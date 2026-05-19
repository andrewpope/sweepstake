# World Cup Sweepstake — SPEC

## 1. Objective

A web app for running private World Cup 2026 sweepstakes. One organiser creates a pool, invites participants by link, collects **€5 entries (max 2 per person)**, then runs a balanced random draw that gives every entry **one team**. After the draw, each participant gets a personal **reveal moment** for their team(s). Prizes are paid out at the end of the tournament based on **how each owner's teams actually finish** — the classic office sweepstake, with two side prizes to keep the group stage interesting and the unlucky entertained.

**Target users**
- **Organisers**: one per pool — set it up, mark entries paid, trigger the draw, manage manual overrides.
- **Participants**: invited members — register, pay, reveal their team(s), watch the tournament.

**Why now**: 2026 FIFA World Cup runs **11 June – 19 July 2026** (USA / Canada / Mexico, 48 teams, 104 matches). MVP must be live by **5 June 2026**.

**Non-goals (MVP)**
- Real-money gambling / regulated betting — informal pot only.
- Predictive games (match-by-match score predictions).
- Running "live leaderboards" with cumulative point totals — prizes are decided by where each team finishes.
- In-app payment processing — paid status is organiser-confirmed in v1. **Tikkie integration is Phase 2.**
- Native mobile apps — responsive web only.

---

## 2. Commands

```bash
# Install
pnpm install

# Local dev (TanStack Start on Vite, port 3737)
pnpm dev

# Production build & run
pnpm build
pnpm start

# Local Supabase stack
pnpm supabase:start
pnpm supabase:stop
pnpm supabase:reset

# Migrations
pnpm db:new <name>
pnpm db:push
pnpm db:types

# Quality
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
pnpm test:e2e

# Ops
pnpm sync:results -- --date=2026-06-11
pnpm draw -- --pool=<id> --seed=<seed>    # offline rehearsal

# Deploy
vercel
vercel --prod
```

---

## 3. Project structure

```
/
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── auth.callback.tsx
│   │   ├── sweepstakes/
│   │   │   ├── new.tsx
│   │   │   ├── $id.index.tsx         # status board (your teams + their fate)
│   │   │   ├── $id.entries.tsx       # organiser: payment + entries
│   │   │   ├── $id.draw.tsx          # organiser: trigger draw
│   │   │   ├── $id.reveal.tsx        # participant: reveal own teams
│   │   │   ├── $id.prizes.tsx        # current standings of the 5 prize slots
│   │   │   └── join.$token.tsx
│   │   └── api/
│   │       └── cron.sync-results.ts
│   ├── server/
│   │   ├── fns/                      # createServerFn
│   │   │   ├── sweepstakes.ts
│   │   │   ├── entries.ts
│   │   │   ├── draw.ts
│   │   │   ├── reveal.ts
│   │   │   └── prizes.ts
│   │   └── auth.ts
│   ├── lib/
│   │   ├── supabase/
│   │   ├── draw.ts                   # round-based allocation (pure)
│   │   ├── prizes.ts                 # team-rank → prize resolver (pure)
│   │   └── fixtures/
│   │       ├── api-football.ts
│   │       └── sync.ts
│   ├── components/
│   │   ├── ui/                       # shadcn/ui
│   │   ├── draw/
│   │   ├── reveal/                   # the reveal animation
│   │   ├── status-board/
│   │   ├── entries/
│   │   └── pool/
│   ├── router.tsx
│   ├── client.tsx
│   └── ssr.tsx
├── supabase/
│   ├── migrations/
│   ├── seed.sql                      # 48 teams + 2026 fixture skeleton
│   └── config.toml
├── tests/
│   ├── unit/
│   └── e2e/
├── vite.config.ts
├── vercel.ts
├── SPEC.md
└── package.json
```

**Key data model (Postgres / Supabase)**

```
users             (id, email, display_name, created_at)
sweepstakes       (id, name, organiser_id, status, draw_at, created_at,
                   entry_price_cents,                  -- default 500 (€5)
                   max_entries_per_participant,        -- default 2
                   prize_split,                        -- jsonb (see below)
                   registration_closes_at,
                   reveals_unlock_at,                  -- nullable; null = reveal as soon as drawn
                   draw_seed)
participants      (id, sweepstake_id, user_id, display_name, created_at)
                                                       -- UNIQUE(sweepstake_id, user_id) — one row per (pool, auth user)
entries           (id, participant_id, sweepstake_id,
                   entry_number,                       -- 1 or 2; UNIQUE(participant_id, entry_number)
                   paid_at, paid_method, payment_ref, created_at)
                                                       -- CHECK (entry_number BETWEEN 1 AND
                                                       --        (SELECT max_entries_per_participant FROM sweepstakes
                                                       --         WHERE id = sweepstake_id))  enforced via trigger
allocations       (id, entry_id, team_id, drawn_at,
                   revealed_at)                        -- nullable; null = not yet revealed
                                                       -- exactly 1 row per entry
teams             (id, name, code, group, seed,
                   group_points,
                   group_goal_diff,
                   group_goals_for,
                   final_position,                     -- 'champion'|'runner_up'|'third'|'fourth'
                                                       --  |'quarter_final'|'round_of_16'|'round_of_32'
                                                       --  |'group_stage'  (else NULL = still in)
                   eliminated_at)
matches           (id, external_id, stage, home_team_id, away_team_id,
                   kickoff_at, status,
                   home_score, away_score,
                   source, synced_at, manual_override)
sync_runs         (id, started_at, finished_at, matches_updated, error)
invites           (id, sweepstake_id, token, expires_at, max_uses)
```

`prize_split` (default):
```json
{
  "winner":        0.50,
  "runner_up":     0.20,
  "third":         0.10,
  "wooden_spoon":  0.10,
  "best_group_non_knockout": 0.10
}
```

Row Level Security:
- Participants read only sweepstakes they belong to.
- Organisers write their own sweepstakes / entries / allocations.
- `teams` and `matches` are world-readable.
- `allocations` are read-only after `sweepstakes.status = 'drawn'`.
- **Pre-reveal**, an `allocation` is readable **only by its owner** (who can see "🎁 Reveal" without knowing the team) and the organiser; after `revealed_at` is set, it's readable by all pool members.
- `entries.paid_at` writable only by organiser in v1 (Phase 2: Tikkie webhook).

---

## 4. Code style

- **TypeScript strict** (`"strict": true`, `"noUncheckedIndexedAccess": true`).
- **TanStack Start + TanStack Router**, end-to-end type-safe routing.
- **`createServerFn`** for mutations and authenticated reads; route `loader`s for SSR data.
- **Vercel Functions on Node.js 24 LTS** via TanStack Start's Vercel preset.
- **Tailwind CSS v4** + **shadcn/ui** for components, themed via the design tokens in section 5.
- **Framer Motion** for the reveal animation only — no other animation framework.
- **Pure functions** for `lib/draw.ts` and `lib/prizes.ts` — no I/O, fully unit-testable.
- **Zod** at every trust boundary.
- **No `any`**, no `as` casts except at marked external-boundary parse points.
- **Imports**: `~/` alias for `src/`.
- **Filenames**: `kebab-case.tsx`; routes use TanStack Router dot-notation.
- **Comments**: only where intent is non-obvious.
- **Dates**: UTC `timestamptz` in DB; format with `Intl.DateTimeFormat` client-side.

---

## Brand & design

**Direction**: DAZN-inspired sports app — confident, dark, sharp.

- **Mood**: stadium-floodlight contrast. The product looks like a sports broadcast UI, not a B2B SaaS.
- **Typography**: a two-family system, both from the Geist family for coherence.
  - **Geist** (sans) — bold display weight for headlines and team names; regular for body.
  - **Geist Mono** — used wherever data wants to feel like data: **scores** (`2 — 1`), kickoff timestamps, countdown timers, group-stage standings tables, match index counters (`#047 / 104`), team 3-letter codes (`BRA`, `FRA`), pool invite codes, and the reveal-unlock countdown. The mono treatment reinforces the "live scoreboard / broadcast graphic" feel.
  - Loaded via TanStack Start's font helpers; numbers in sans contexts still use `tabular-nums`.
- **Shape language**: 4 px corner radius on cards, 2 px on buttons. No pill buttons except for status chips (THROUGH / OUT / ELIMINATED). No skeuomorphic shadows; rely on flat surfaces and yellow accents for elevation.
- **Imagery**: team flags as 4:3 SVGs (e.g. `country-flag-icons`), no photographs. Confetti on champion reveals is CSS-only, yellow + white.
- **Motion**: reveal animation (Framer Motion) and subtle hover/press states on interactive elements. Everything else is static. `prefers-reduced-motion` disables non-essential animation.

**Design tokens** (CSS variables exposed to Tailwind v4 + shadcn/ui):

```css
:root {
  /* Surfaces */
  --background:        #0A0A0A;   /* page */
  --surface:           #141414;   /* cards */
  --surface-elevated:  #1F1F1F;   /* modals, popovers */
  --border:            #262626;
  --border-strong:     #3A3A3A;

  /* Foreground */
  --foreground:        #FAFAFA;
  --muted-foreground:  #A1A1A1;
  --subtle-foreground: #6B6B6B;

  /* Accent — the single hero colour */
  --accent:            #F5E663;   /* electric yellow, slightly warm to avoid eye-strain */
  --accent-foreground: #000000;
  --accent-hover:      #E6D650;

  /* Semantic */
  --success:           #22C55E;   /* THROUGH */
  --destructive:       #EF4444;   /* OUT / ELIMINATED */
  --info:              #38BDF8;   /* IN PROGRESS */
  --warning:           #FBBF24;   /* PAYMENT PENDING */

  /* Effects */
  --radius:            4px;
  --radius-sm:         2px;
  --ring:              #F5E663;   /* focus ring uses accent */
}
```

**Component conventions**
- Primary CTA = solid `--accent` background, black text, bold weight. Sparingly used — one per screen.
- Secondary CTA = transparent with `--border-strong`, foreground text.
- Status chips: 12 px text, 600 weight, uppercase, 8 px horizontal padding, 2 px radius. Bg = semantic colour at 18 % alpha, foreground = full semantic colour.
- Team cards (status board): flag (left), team name + group (middle), status chip (right). On hover: yellow 1 px left border.
- Score display: **Geist Mono**, large weight, yellow when their team won; loser's score in `--muted-foreground`.
- Match metadata strip (kickoff time, stage, match number): **Geist Mono** at 12 px, `--muted-foreground`, uppercase.
- Countdown timers (reveal unlock, kickoff): **Geist Mono** with leading zeros, e.g. `02:14:09`.

**Light mode**: not in MVP. Dark mode is the design.

---

## 5. Entry rules & validation

**Constraints**
- **Entry price**: €5 (configurable per pool via `entry_price_cents`).
- **Max entries per person**: 2 (configurable via `max_entries_per_participant`).
- **Identity** for the cap: one `participant` row per (`sweepstake_id`, `user_id`) where `user_id` is the **Supabase Auth user**. The cap is enforced against `participant_id`, not display name.

**Enforcement layers (defense in depth)**
1. **DB**: `UNIQUE(sweepstake_id, user_id)` on `participants` — a user cannot create two participant rows in the same pool.
2. **DB**: `UNIQUE(participant_id, entry_number)` on `entries`.
3. **DB**: trigger that rejects an entry where `entry_number > sweepstakes.max_entries_per_participant`.
4. **Server fn**: `createEntry` re-checks the count before insert and surfaces a clear error if exceeded.
5. **UI**: "Buy 2nd entry" button is hidden once a participant has 2 paid (or pending) entries.

**Anti-abuse expectations (informal — friendly pool, not a casino)**
- **Authentication is Slack OAuth only** (Supabase Auth's Slack provider). No email/password, no magic-link, no other social logins. The invite link is the gate to a specific pool.
- Slack-only sign-in raises the bar against multi-accounting: a determined cheater would need a second Slack workspace account, not just a second email inbox. Not impossible, but enough friction for a friendly pool.
- The organiser's `$id.entries.tsx` page still surfaces a flag when two participants share similar display names (simple Levenshtein heuristic) for manual review.

---

## 6. Draw mechanics — round-based allocation

**Inputs**
- `paid_entries`: all entries with `paid_at` not null, at `registration_closes_at`. Unpaid entries are excluded.
- `teams`: the 48 World Cup teams.
- `draw_seed`: organiser-set or generated and **recorded** on `sweepstakes` for audit/replay.

**Invariants**
1. Every paid entry receives **exactly one team**.
2. Within a participant's entries, **no team appears twice** (skip-owned rule).
3. **Round-bucket fairness**: nobody receives their `N+1`th team before everyone who has an `N+1`th entry has received their `N`th. Concretely: all "first entries" are dealt before any "second entry" gets a team.
4. Across all entries, every team has either `⌊E/48⌋` or `⌈E/48⌉` owners (where `E` is total paid entries).
5. Allocation is deterministic given `draw_seed`.

**Algorithm** (pure function in `src/lib/draw.ts`)

```
draw(paid_entries, teams, draw_seed):
  rng = seeded(draw_seed)

  # 1. Bucket entries by entry_number, shuffle within bucket
  buckets = group_by(paid_entries, e -> e.entry_number)    # {1: [...], 2: [...]}
  for n in sort(buckets.keys()):
    shuffle(buckets[n], rng)

  # 2. Concatenate in bucket order
  ordered_entries = flatten([buckets[n] for n in sort(buckets.keys())])

  # 3. Shuffle teams once
  shuffled_teams = shuffle(teams.copy(), rng)

  # 4. Round-robin deal with skip-owned
  allocations = {}                              # entry_id -> team
  owned_by_participant = {}                     # participant_id -> set[team_id]
  for i, entry in enumerate(ordered_entries):
    candidate = shuffled_teams[i % 48]
    already_owned = owned_by_participant.get(entry.participant_id, set())
    if candidate in already_owned:
      # find next team in round-robin order this participant doesn't own
      candidate = next(
        shuffled_teams[(i + k) % 48]
        for k in 1..48
        if shuffled_teams[(i + k) % 48] not in already_owned
      )
      # swap candidate with the team at i so the round-robin
      # invariant (every team gets floor/ceil owners) is preserved:
      # we'll re-process the displaced position via a single bounded retry pass
    allocations[entry.id] = candidate
    owned_by_participant.setdefault(entry.participant_id, set()).add(candidate)

  return { allocations, seed: draw_seed }
```

The skip-owned rule only fires for participants on their **2nd** entry. The retry/swap step keeps the per-team ownership counts within `floor` / `ceil` of `E/48`.

**Worked default (€5 entry, 60 participants)**
- 60 single entries → 60 entries → pot **€300**.
  - 60/48 → 12 teams 2-owned, 36 teams 1-owned.
- 30 of those buy a 2nd entry → 90 entries → pot **€450**.
  - 90/48 → 42 teams 2-owned, 6 teams 1-owned.
- All 60 buy 2 → 120 entries → pot **€600**.
  - 120/48 → every team has exactly 2 or 3 owners (24 of each); each participant has 2 distinct teams.

---

## 7. Reveal experience

After the organiser triggers the draw, allocations are **stored but hidden**. Each participant gets a per-team reveal moment.

**State machine**
- `allocations.revealed_at = NULL`: hidden everywhere except as "🎁 Reveal" card on the owner's status board.
- Owner clicks reveal → server fn sets `revealed_at = now()` and returns the team → client plays a short Framer Motion animation (envelope opens, flag flips in, team name + group revealed).
- Once revealed, the team is visible to all pool members on the public status board.

**Optional time gate**
- `sweepstakes.reveals_unlock_at` (nullable): if set, the reveal button is disabled with a countdown until that timestamp. Default `NULL` → reveal available immediately after draw.
- This lets an organiser schedule a "reveal night" (e.g. 8 pm Friday before kick-off) for a shared moment.

**Visibility rules summary**
| State | Owner sees | Others see |
|---|---|---|
| Pre-draw | nothing assigned | nothing |
| Drawn + not revealed + before `reveals_unlock_at` | "🎁 Reveal unlocks at <time>" | "🎁 [Alice] — pending" |
| Drawn + not revealed + after `reveals_unlock_at` | "🎁 Reveal" (clickable) | "🎁 [Alice] — pending" |
| Revealed | full team detail + status | full team detail + status |

**Reveal animation**
- ~2.5 seconds, Framer Motion `motion.div` sequence: card flip, flag scale-in, team name fade in.
- Confetti burst (CSS) on champion-tier teams (Brazil, France, Argentina, England, Germany, Spain, Netherlands) for a small extra payoff — light Easter egg, no functional effect.
- Reduced-motion respects `prefers-reduced-motion`: fall back to a simple fade.

---

## 8. Prize resolution

Prizes are decided **purely from where each team finishes**. Co-owners of a winning team split that prize equally (rounded to cents, residue to the team's first-allocated owner).

| Prize | Won by owner(s) of | % of pot |
|---|---|---|
| **Winner** | Team that lifts the World Cup | 50 % |
| **Runner-up** | Team that loses the final | 20 % |
| **Third place** | Winner of the 3rd-place playoff | 10 % |
| **Best group-stage exit** | Highest-ranked team that did not advance | 10 % |
| **Wooden spoon** | Lowest-ranked team in the tournament overall | 10 % |

**Group-stage exit ranking**: of the 16 teams eliminated in groups, order by group points DESC → goal difference DESC → goals for DESC → drawing of lots (organiser action, logged). Top of the list = best group-stage exit; bottom = wooden spoon.

**Worked default** (€5 entry, 60 single entries, pot €300):
- Winner: €150 → if 2 co-owners: €75 each.
- Runner-up: €60 → if 2 co-owners: €30 each.
- Third: €30.
- Best group exit: €30.
- Wooden spoon: €30.

---

## 9. Results sync

- **Provider**: **api-football** (free tier, ~5 req/day under this schedule).
- **Schedule**: Vercel Cron in `vercel.ts`, **once daily at 06:00 UTC**, hitting `/api/cron/sync-results` with `Authorization: Bearer <CRON_SECRET>`.
- **Algorithm**:
  1. Fetch fixtures updated since `max(sync_runs.finished_at)`.
  2. Upsert `matches` keyed on `external_id`; skip rows with `manual_override = true`.
  3. For each newly-`FT` match, update the involved teams' group standings and (if eliminated) `final_position` + `eliminated_at`.
  4. Record the run in `sync_runs`.
- **Manual override**: organiser can edit any match or team status; flagged rows are skipped by future syncs.
- **UI copy**: "Results update once daily, around 07:00 UK time."

---

## 10. Testing strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `lib/draw.ts`, `lib/prizes.ts`, api-football Zod parser. ≥ 90 % line coverage on these files. |
| Integration | Vitest + local Supabase | RLS policies, server fns, sync replay via MSW, entry-cap triggers. |
| E2E | Playwright | Create → invite → join → buy 1st entry → buy 2nd entry → can't buy 3rd → mark paid → draw → reveal → status board → simulated tournament → prize payout view. |

**Always-test invariants (failing test first)**
1. **Draw — exactly 1 team per entry.**
2. **Draw — round-bucket fairness**: in a mixed-entry-count population, no participant gets a 2nd team before any participant with a 2nd entry gets their 1st.
3. **Draw — no participant owns the same team twice.**
4. **Draw — co-ownership spread ≤ 1** across 10 000-seed property test.
5. **Draw — deterministic given seed.**
6. **Entry cap — DB rejects a 3rd entry** at the trigger level, not just the UI.
7. **Identity cap — `UNIQUE(sweepstake_id, user_id)`** blocks a second participant row.
8. **Reveal — `allocations.team_id` is not returned** by the public read endpoint until `revealed_at` is set (RLS test).
9. **Sync idempotence**: re-running sync for the same match doesn't change team state.
10. **Manual override**: flagged rows are not overwritten by sync.
11. **Prize resolution** when the final is `FT` produces exactly five non-empty prize positions; sum of payouts = pot to the cent.
12. **Co-owner split** divides each prize evenly; rounding residue goes to the earliest-drawn allocation.

**Pre-deploy manual check**: full rehearsal draw with 60 mock participants and a mix of 1st/2nd entries; reveal flow on desktop + mobile; replay a recorded api-football response and verify status board + prize view.

---

## 11. Boundaries

### Always do
- **Validate at every trust boundary** with Zod.
- **Use Supabase RLS** for authorisation, especially the pre-reveal allocation hiding rule.
- **Keep secrets in Vercel env vars** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `API_FOOTBALL_KEY`, `CRON_SECRET`). Commit only `.env.example`. Slack credentials are also configured in the Supabase Auth dashboard under Providers → Slack.
- **Record the `draw_seed`** so draws are replayable.
- **Treat api-football data as untrusted** — Zod-parse, clamp scores, keep the loop alive on a single bad fixture.
- **Log every `sync_runs` row** with counts and errors.

### Ask first
- Any in-app payment processing (Tikkie — Phase 2).
- Sending email/SMS/push notifications.
- Swapping the results provider or moving to a paid api-football tier.
- Schema migrations that drop or rename existing columns.
- Adding a third-party dependency outside the stack (TanStack Start/Router, Supabase, shadcn, Tailwind, Framer Motion, Zod, Vitest, Playwright, api-football client).
- Adding any auth method other than Slack OAuth (magic-link, email/password, Google, etc.). MVP is Slack-only by design.
- Raising `max_entries_per_participant` above 2 or changing `prize_split` after `status = 'drawn'`.
- Production deploys outside the standard `vercel --prod` flow.

### Never do
- **No regulated gambling features.**
- **No PII beyond email + display name.**
- **No service-role Supabase key or `API_FOOTBALL_KEY` in client bundles.**
- **No analytics that ship user data to third parties** without consent.
- **No re-running a completed draw.** Allocations are immutable once `status = 'drawn'`.
- **No silent prize-rule changes** mid-tournament.
- **No bypassing the reveal**: an allocation's `team_id` must never be returned to a non-owner before `revealed_at` is set.
- **No `--force` pushes** to `main`; no `git reset --hard` on shared branches; no skipping pre-commit hooks.

---

## Phase 2 / Open questions

- **Tikkie integration**: on entry creation, generate a unique payment code; receive a webhook from Tikkie/ING when paid; auto-set `entries.paid_at` and `payment_ref`. Needs research on Tikkie Business API access, webhook security, NL business entity requirement.
- **Slack workspace gating** — currently any Slack workspace is accepted; if abuse appears, restrict to a specific workspace ID at the auth callback. Defer until needed.
- **Slack DMs from the app** — would need `chat:write` scope and a workspace install. Useful for "your team got knocked out" or "reveal night starts now" pings. Phase 2.
- **Group reveal events** with realtime / websockets so participants can watch each other's reveals in a "draw party". Probably Supabase Realtime channels. Defer.
- **Name & logo** — DAZN-style design direction is locked (see Brand & design section); product **name** and **logomark** still TBD.
- **Public read-only links** — gated behind invite token in v1.
- **Late-join cutoff** — defaulting to "no new entries after `registration_closes_at`", which the organiser sets to first kick-off (11 June 2026 ~17:00 UK).
- **Prize split UI** — `prize_split` is jsonb in the DB; the 50/20/10/10/10 default is hard-coded in v1.
- **Tiebreaker drawing-of-lots**: organiser does it manually + logs; could be seeded later.
