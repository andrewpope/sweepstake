-- P3.1 — entries + invites RLS and supporting helpers.

-- invites: usage tracking column
alter table invites
  add column if not exists used_count integer not null default 0
    check (used_count >= 0);

-- ============================================================================
-- Token-resolution helper (SECURITY DEFINER)
-- ============================================================================

create or replace function public.get_invite_by_token(p_token text)
returns table (
  invite_id uuid,
  sweepstake_id uuid,
  sweepstake_name text,
  expires_at timestamptz,
  max_uses integer,
  used_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    i.id          as invite_id,
    i.sweepstake_id,
    s.name        as sweepstake_name,
    i.expires_at,
    i.max_uses,
    i.used_count
  from public.invites i
  join public.sweepstakes s on s.id = i.sweepstake_id
  where i.token = p_token;
$$;

revoke all on function public.get_invite_by_token(text) from public;
grant execute on function public.get_invite_by_token(text) to authenticated;

-- ============================================================================
-- join_pool_via_invite: atomic claim, bumps used_count, idempotent for the
-- same caller. Returns the resulting participant_id.
-- ============================================================================

create or replace function public.join_pool_via_invite(
  p_token text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select i.id, i.sweepstake_id, i.expires_at, i.max_uses, i.used_count
    into v_invite
    from public.invites i
   where i.token = p_token
   for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite_expired' using errcode = '22023';
  end if;
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    raise exception 'invite_exhausted' using errcode = '22023';
  end if;

  select id into v_participant_id
    from public.participants
   where sweepstake_id = v_invite.sweepstake_id
     and user_id = auth.uid();

  if v_participant_id is null then
    insert into public.participants (sweepstake_id, user_id, display_name)
      values (v_invite.sweepstake_id, auth.uid(), p_display_name)
      returning id into v_participant_id;
    update public.invites set used_count = used_count + 1 where id = v_invite.id;
  end if;

  return v_participant_id;
end;
$$;

revoke all on function public.join_pool_via_invite(text, text) from public;
grant execute on function public.join_pool_via_invite(text, text) to authenticated;

-- ============================================================================
-- entries: tighten policies
-- ============================================================================

drop policy if exists permissive_all on entries;

create policy entries_member_read on entries
  for select to authenticated
  using (public.is_pool_member(sweepstake_id));

create policy entries_self_insert on entries
  for insert to authenticated
  with check (
    exists (
      select 1 from public.participants p
      where p.id = entries.participant_id
        and p.user_id = auth.uid()
        and p.sweepstake_id = entries.sweepstake_id
    )
  );

create policy entries_self_delete_unpaid on entries
  for delete to authenticated
  using (
    paid_at is null
    and exists (
      select 1 from public.participants p
      where p.id = entries.participant_id
        and p.user_id = auth.uid()
    )
  );

create policy entries_organiser_all on entries
  for all to authenticated
  using (public.is_pool_organiser(sweepstake_id))
  with check (public.is_pool_organiser(sweepstake_id));

-- ============================================================================
-- invites: tighten policies
-- ============================================================================

drop policy if exists permissive_all on invites;

create policy invites_organiser_all on invites
  for all to authenticated
  using (public.is_pool_organiser(sweepstake_id))
  with check (public.is_pool_organiser(sweepstake_id));

create policy invites_member_read on invites
  for select to authenticated
  using (public.is_pool_member(sweepstake_id));
