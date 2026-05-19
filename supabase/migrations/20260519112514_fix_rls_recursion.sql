-- Fix RLS infinite recursion introduced in the tighten_pool_rls migration.
--
-- The recursion chain:
--   SELECT FROM sweepstakes → sweepstakes_member_read policy
--     → EXISTS (select … FROM participants …)
--     → participants_member_read policy
--       → EXISTS (select … FROM participants …)   ← recurses on itself
--
-- Standard Supabase fix: wrap the membership check in a SECURITY DEFINER
-- function so the inner select bypasses RLS. The function reads only its
-- own (user_id, sweepstake_id) pair so there is no information leak.

create or replace function public.is_pool_member(p_pool_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.participants
    where sweepstake_id = p_pool_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_pool_member(uuid) from public;
grant execute on function public.is_pool_member(uuid) to authenticated;

create or replace function public.is_pool_organiser(p_pool_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sweepstakes
    where id = p_pool_id
      and organiser_id = auth.uid()
  );
$$;

revoke all on function public.is_pool_organiser(uuid) from public;
grant execute on function public.is_pool_organiser(uuid) to authenticated;

-- ============================================================================
-- sweepstakes: rewrite member_read to use the helper
-- ============================================================================

drop policy if exists sweepstakes_member_read on sweepstakes;

create policy sweepstakes_member_read on sweepstakes
  for select to authenticated
  using (public.is_pool_member(id));

-- ============================================================================
-- participants: rewrite policies to use helpers, avoiding self-recursion
-- ============================================================================

drop policy if exists participants_organiser_all on participants;
drop policy if exists participants_member_read on participants;

create policy participants_organiser_all on participants
  for all to authenticated
  using (public.is_pool_organiser(sweepstake_id))
  with check (public.is_pool_organiser(sweepstake_id));

create policy participants_member_read on participants
  for select to authenticated
  using (public.is_pool_member(sweepstake_id));
