-- World Cup Sweepstake — baseline schema (P0.5)
-- RLS is enabled on every table; policies here are permissive for authenticated users.
-- Per-feature phases tighten the policies (notably P4.3 for pre-reveal allocation hiding).

-- ============================================================================
-- Enums
-- ============================================================================

create type sweepstake_status as enum (
  'draft',       -- created, no entries yet
  'open',        -- accepting entries
  'drawing',     -- draw in progress (locked)
  'drawn',       -- allocations exist, tournament not yet over
  'completed'    -- tournament finished, prizes settled
);

create type match_status as enum (
  'NS',   -- not started
  '1H',   -- first half
  'HT',   -- half time
  '2H',   -- second half
  'ET',   -- extra time
  'P',    -- penalty shootout
  'AET',  -- after extra time
  'PEN',  -- finished on penalties
  'FT',   -- full time
  'PST',  -- postponed
  'CANC'  -- cancelled
);

create type match_stage as enum (
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place_playoff',
  'final'
);

create type team_final_position as enum (
  'group_stage',           -- eliminated in groups
  'round_of_32',           -- eliminated in R32
  'round_of_16',           -- eliminated in R16
  'quarter_final',         -- eliminated in QF
  'fourth',                -- lost 3rd-place playoff
  'third',                 -- won 3rd-place playoff
  'runner_up',             -- lost final
  'champion'               -- lifted the cup
);

create type paid_method as enum ('cash', 'tikkie', 'other');

-- ============================================================================
-- Tables
-- ============================================================================

create table sweepstakes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  organiser_id uuid not null references auth.users(id) on delete restrict,
  status sweepstake_status not null default 'draft',
  draw_at timestamptz,
  draw_seed text,
  entry_price_cents integer not null default 500 check (entry_price_cents > 0),
  max_entries_per_participant smallint not null default 2 check (max_entries_per_participant between 1 and 10),
  prize_split jsonb not null default jsonb_build_object(
    'winner', 0.50,
    'runner_up', 0.20,
    'third', 0.10,
    'wooden_spoon', 0.10,
    'best_group_non_knockout', 0.10
  ),
  registration_closes_at timestamptz,
  reveals_unlock_at timestamptz,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references sweepstakes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (sweepstake_id, user_id)
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  sweepstake_id uuid not null references sweepstakes(id) on delete cascade,
  entry_number smallint not null check (entry_number between 1 and 10),
  paid_at timestamptz,
  paid_method paid_method,
  payment_ref text,
  created_at timestamptz not null default now(),
  unique (participant_id, entry_number),
  -- if paid_at is set, paid_method must be too
  check ((paid_at is null) = (paid_method is null))
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique check (length(code) = 3),
  group_name char(1) not null check (group_name between 'A' and 'L'),  -- 12 groups A-L
  seed smallint,
  group_points smallint not null default 0,
  group_goal_diff smallint not null default 0,
  group_goals_for smallint not null default 0,
  final_position team_final_position,
  eliminated_at timestamptz
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,                       -- api-football fixture id
  stage match_stage not null,
  home_team_id uuid not null references teams(id) on delete restrict,
  away_team_id uuid not null references teams(id) on delete restrict,
  kickoff_at timestamptz not null,
  status match_status not null default 'NS',
  home_score smallint check (home_score between 0 and 30),
  away_score smallint check (away_score between 0 and 30),
  source text,                                   -- 'api-football' | 'manual' | ...
  synced_at timestamptz,
  manual_override boolean not null default false,
  check (home_team_id <> away_team_id)
);

create table allocations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  team_id uuid not null references teams(id) on delete restrict,
  drawn_at timestamptz not null default now(),
  revealed_at timestamptz,
  unique (entry_id)   -- exactly one team per entry
);

create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  matches_updated integer not null default 0,
  error text
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references sweepstakes(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index participants_sweepstake_idx on participants(sweepstake_id);
create index entries_sweepstake_idx on entries(sweepstake_id);
create index entries_participant_idx on entries(participant_id);
create index entries_paid_idx on entries(sweepstake_id) where paid_at is not null;
create index allocations_entry_idx on allocations(entry_id);
create index allocations_team_idx on allocations(team_id);
create index matches_kickoff_idx on matches(kickoff_at);
create index matches_status_idx on matches(status);
create index invites_token_idx on invites(token);

-- ============================================================================
-- Entry-cap trigger
-- ============================================================================

create or replace function enforce_entry_cap()
returns trigger
language plpgsql
security definer
as $$
declare
  cap smallint;
begin
  select max_entries_per_participant
    into cap
    from sweepstakes
   where id = new.sweepstake_id;

  if new.entry_number > cap then
    raise exception 'entry_number % exceeds the pool cap of %', new.entry_number, cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger entries_enforce_cap
  before insert or update of entry_number, sweepstake_id on entries
  for each row execute function enforce_entry_cap();

-- ============================================================================
-- RLS (permissive baseline — feature phases tighten these)
-- ============================================================================

alter table sweepstakes  enable row level security;
alter table participants enable row level security;
alter table entries      enable row level security;
alter table allocations  enable row level security;
alter table teams        enable row level security;
alter table matches      enable row level security;
alter table sync_runs    enable row level security;
alter table invites      enable row level security;

-- Authenticated users can do anything for now; per-table policies tighten in later phases.
create policy permissive_all on sweepstakes  for all to authenticated using (true) with check (true);
create policy permissive_all on participants for all to authenticated using (true) with check (true);
create policy permissive_all on entries      for all to authenticated using (true) with check (true);
create policy permissive_all on allocations  for all to authenticated using (true) with check (true);
create policy permissive_all on invites      for all to authenticated using (true) with check (true);

-- Reference data is world-readable.
create policy public_read on teams   for select to anon, authenticated using (true);
create policy public_read on matches for select to anon, authenticated using (true);

-- sync_runs writable by service role only (cron handler authenticates with service key).
create policy service_only_read on sync_runs for select to authenticated using (false);
