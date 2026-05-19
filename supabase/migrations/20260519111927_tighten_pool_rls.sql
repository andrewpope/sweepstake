-- P2.1 — tighten RLS on sweepstakes + participants
--
-- The init migration left these with a permissive_all policy for any
-- authenticated user. Now we enforce:
--   sweepstakes  → organiser can write own; pool members can read; world cannot
--   participants → organiser can write any row in pools they organise;
--                  authenticated users can self-join (insert their own row);
--                  pool members can read each other; world cannot.
-- Other tables (entries, allocations, invites, sync_runs) keep the
-- permissive_all baseline for now; their per-feature phases will tighten.

-- ============================================================================
-- sweepstakes
-- ============================================================================

drop policy if exists permissive_all on sweepstakes;

create policy sweepstakes_organiser_all on sweepstakes
  for all to authenticated
  using (organiser_id = auth.uid())
  with check (organiser_id = auth.uid());

create policy sweepstakes_member_read on sweepstakes
  for select to authenticated
  using (
    exists (
      select 1 from participants p
      where p.sweepstake_id = sweepstakes.id
        and p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- participants
-- ============================================================================

drop policy if exists permissive_all on participants;

create policy participants_organiser_all on participants
  for all to authenticated
  using (
    exists (
      select 1 from sweepstakes s
      where s.id = participants.sweepstake_id
        and s.organiser_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sweepstakes s
      where s.id = participants.sweepstake_id
        and s.organiser_id = auth.uid()
    )
  );

create policy participants_self_insert on participants
  for insert to authenticated
  with check (user_id = auth.uid());

create policy participants_member_read on participants
  for select to authenticated
  using (
    exists (
      select 1 from participants self
      where self.sweepstake_id = participants.sweepstake_id
        and self.user_id = auth.uid()
    )
  );

create policy participants_self_update on participants
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy participants_self_delete on participants
  for delete to authenticated
  using (user_id = auth.uid());
