-- P4 — draw mechanics: allocations RLS (pre-reveal hiding) + transactional
-- run_pool_draw function.

-- ============================================================================
-- allocations RLS
-- ============================================================================

alter table allocations enable row level security;

drop policy if exists permissive_all on allocations;

-- Owner of the entry can always read their own allocation (so the reveal page
-- knows what to reveal, and the dashboard can show "your teams" post-reveal).
create policy allocations_owner_read on allocations
  for select to authenticated
  using (
    exists (
      select 1
        from public.entries e
        join public.participants p on p.id = e.participant_id
       where e.id = allocations.entry_id
         and p.user_id = auth.uid()
    )
  );

-- Organiser can read every allocation in their pool (managing the draw).
create policy allocations_organiser_read on allocations
  for select to authenticated
  using (
    exists (
      select 1
        from public.entries e
        join public.sweepstakes s on s.id = e.sweepstake_id
       where e.id = allocations.entry_id
         and s.organiser_id = auth.uid()
    )
  );

-- Pool members can read allocations only AFTER the owner reveals.
create policy allocations_member_read_revealed on allocations
  for select to authenticated
  using (
    revealed_at is not null
    and exists (
      select 1
        from public.entries e
       where e.id = allocations.entry_id
         and public.is_pool_member(e.sweepstake_id)
    )
  );

-- Owner can update their own row (used by the reveal action — sets revealed_at).
create policy allocations_owner_update on allocations
  for update to authenticated
  using (
    exists (
      select 1
        from public.entries e
        join public.participants p on p.id = e.participant_id
       where e.id = allocations.entry_id
         and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
        from public.entries e
        join public.participants p on p.id = e.participant_id
       where e.id = allocations.entry_id
         and p.user_id = auth.uid()
    )
  );

-- Inserts are only via run_pool_draw (SECURITY DEFINER); no INSERT policy
-- exposed to authenticated. Updates by organiser are intentionally NOT
-- allowed — allocations are immutable once drawn except for the owner's
-- reveal timestamp.

-- ============================================================================
-- run_pool_draw — atomic persistence of a computed draw
-- ============================================================================

create or replace function public.run_pool_draw(
  p_pool_id uuid,
  p_seed text,
  p_allocations jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status sweepstake_status;
  v_alloc_count integer;
begin
  -- Must be the organiser.
  if not public.is_pool_organiser(p_pool_id) then
    raise exception 'only the organiser can run the draw' using errcode = '42501';
  end if;

  -- Lock the pool row, check status.
  select status into v_status
    from public.sweepstakes
   where id = p_pool_id
   for update;

  if v_status is null then
    raise exception 'pool_not_found' using errcode = 'P0002';
  end if;
  if v_status not in ('draft', 'open') then
    raise exception 'pool already drawn or closed (status=%)', v_status
      using errcode = '22023';
  end if;

  -- Refuse to overwrite existing allocations as a safety net.
  select count(*) into v_alloc_count
    from public.allocations a
    join public.entries e on e.id = a.entry_id
   where e.sweepstake_id = p_pool_id;
  if v_alloc_count > 0 then
    raise exception 'allocations already exist for this pool' using errcode = '22023';
  end if;

  -- Insert the allocations passed in as jsonb [{ entry_id, team_id }, ...].
  insert into public.allocations (entry_id, team_id)
  select
    (elem->>'entry_id')::uuid,
    (elem->>'team_id')::uuid
  from jsonb_array_elements(p_allocations) elem;

  -- Flip status + record the seed.
  update public.sweepstakes
     set status = 'drawn',
         draw_seed = p_seed,
         draw_at = now()
   where id = p_pool_id;
end;
$$;

revoke all on function public.run_pool_draw(uuid, text, jsonb) from public;
grant execute on function public.run_pool_draw(uuid, text, jsonb) to authenticated;
