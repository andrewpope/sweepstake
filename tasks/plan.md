# Implementation Plan — World Cup Sweepstake

Source spec: `SPEC.md`. Today: **2026-05-19**. Launch target: **2026-06-05** (17 days). First kick-off: **2026-06-11**.

## Slicing principle

Each task is a **vertical slice**: data → server fn → route → UI → test, end-to-end for one piece of functionality. We do not stage horizontal layers ("all DB first, then all backend, then all UI"). Phases group tasks by feature; tasks within a phase are usable in isolation.

## Dependency graph

```
P0 (foundation)
  └── P1 (auth) ──── P2 (pool create) ──── P3 (entries)
                                              │
                                              ▼
                                           P4 (draw)
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                     P5 (reveal)         P6 (status)         P7 (sync) ──── P8 (prizes)
                                                                                │
                                                                                ▼
                                                                          P9 (hardening + launch)
```

Phases 5, 6, 7 can run in parallel once P4 is complete (different files, no shared mutation surface).

## Timeline (17 working days)

| Days | Phase | Notes |
|---|---|---|
| 1–2 | P0 Foundation | Scaffold, CI, deploy preview |
| 3   | P1 Auth | Magic-link only |
| 4   | P2 Pool creation | Organiser flow only |
| 5–6 | P3 Entries | Cap enforcement is the hard part |
| 7–8 | P4 Draw | Pure algorithm + UI |
| 9   | P5 Reveal | Framer Motion + RLS pre-reveal hiding |
| 10  | P6 Status board | Read-only UI over allocations + teams |
| 11–12 | P7 Sync | api-football integration + cron |
| 13  | P8 Prizes | Pure resolver + standings page |
| 14–15 | P9 Hardening | E2E, a11y, mobile pass |
| 16  | Buffer | Bug fixes, final brand polish |
| 17  | Launch | Production deploy + smoke test (2026-06-05) |

Kick-off is **2026-06-11** — leaving **6 days of soak time** between launch and first match.

## Checkpoints (don't move past until met)

- **CP-α (end of P0)**: app deploys to Vercel preview; `pnpm dev`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all green locally; design tokens visible in a smoke `/` route.
- **CP-β (end of P3)**: a manual click-through can create a pool, join it as a second user, buy 2 entries, attempt a 3rd and be blocked. RLS denies cross-pool reads.
- **CP-γ (end of P5)**: full draw runs deterministically with a fixed seed; round-bucket fairness property test passes 10 000 seeds; reveal hides `team_id` from non-owners (verified via direct Supabase REST call, not just UI).
- **CP-δ (end of P7)**: daily cron runs in preview with a recorded fixture and produces an idempotent sync; manual override correctly skips overwrite.
- **CP-ε (end of P9)**: Playwright E2E happy-path passes on production-equivalent build; Lighthouse mobile ≥ 90 on landing + status board; reduced-motion disables reveal animation.

---

## Phase 0 — Foundation

### P0.1 Scaffold TanStack Start
- Goal: empty repo → running `pnpm dev` on `http://localhost:3000` with a TanStack Start hello-world.
- Acceptance: `pnpm dev` serves a route from `src/routes/index.tsx`. Type-safe routing works (typo in a `Link` `to` produces a TS error).
- Verify: `pnpm dev`, hit `/`, see hello-world. `pnpm typecheck` clean.

### P0.2 Tooling baseline
- Goal: ESLint, Prettier, Vitest, Playwright, `tsconfig.json` strict, `~/` alias.
- Acceptance: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all execute (even with no tests) and exit 0.
- Verify: run each command.

### P0.3 Tailwind v4 + shadcn/ui + design tokens
- Goal: dark theme baseline applied. CSS variables from SPEC §"Brand & design" wired through Tailwind config and shadcn theme.
- Acceptance: a smoke route renders a card with `bg-surface`, accent button with `bg-accent text-accent-foreground`, and a status chip with success/destructive variants — visually matching the spec.
- Verify: visit smoke route, take screenshot for review.

### P0.4 Geist + Geist Mono fonts
- Goal: both fonts loaded with subsetting, `font-sans` and `font-mono` tokens available.
- Acceptance: a heading uses Geist; a `<span class="font-mono tabular-nums">2 — 1</span>` renders in Geist Mono.
- Verify: smoke route.

### P0.5 Supabase local + schema baseline
- Goal: `pnpm supabase:start` brings up Postgres + Auth + Studio. `users`, `sweepstakes`, `participants`, `entries`, `allocations`, `teams`, `matches`, `sync_runs`, `invites` tables exist via migrations. RLS enabled but permissive in this phase.
- Acceptance: `pnpm db:push` applies cleanly; `pnpm db:types` regenerates `~/lib/supabase/types.ts`.
- Verify: open Supabase Studio at `http://localhost:54323`, all tables visible.

### P0.6 Vercel project + CI
- Goal: `vercel link`, environment scaffolded (preview + production); GitHub Actions runs lint/typecheck/test on PR.
- Acceptance: a no-op PR triggers green CI; `vercel` produces a working preview URL with the smoke route.
- Verify: open the preview URL.

**→ CP-α**

---

## Phase 1 — Auth

### P1.1 Sign in with Slack (Supabase OAuth)
- Goal: `/login` shows a single "Sign in with Slack" button → Supabase Auth's Slack provider handles OAuth → `/auth/callback` route handles the redirect → user lands on `/` authenticated with email, display name and avatar populated from Slack.
- Acceptance: Slack app registered, `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` in Vercel env + Supabase Auth dashboard; round-trip works in preview; session persists across reloads; `useSession()` server-side helper returns the user; **no other auth methods are exposed**.
- Verify: complete the OAuth round-trip on preview deploy from a second Slack account.

### P1.2 Root layout + header
- Goal: persistent dark header on every route showing logo placeholder (text "WCS"), user email when signed in, "Sign out" action.
- Acceptance: matches design tokens; mobile-responsive; passes contrast check (WCAG AA on body text).
- Verify: manual visual + axe-core smoke run.

### P1.3 Marketing landing
- Goal: `/` (signed-out) explains the product in a single screen with one CTA "Sign in to organise" / "Sign in to join". Dark, sporty, Geist + Geist Mono treatment.
- Acceptance: above-the-fold on a 360 px mobile viewport, no horizontal scroll.
- Verify: Chrome DevTools mobile viewport.

---

## Phase 2 — Pool creation

### P2.1 `sweepstakes` schema final + RLS
- Goal: full column list from SPEC §3 in place; RLS: organiser can write own, others can read pools they belong to (joined via `participants`).
- Acceptance: integration test — Alice creates a pool; Bob is not a participant; Bob's authed client returns 0 rows for `SELECT * FROM sweepstakes WHERE id = <alice's>`.
- Verify: Vitest RLS test against local Supabase.

### P2.2 `createSweepstake` server fn
- Goal: `createServerFn` validates inputs (Zod), inserts a `sweepstakes` row + a `participants` row for the organiser, returns the new pool ID.
- Acceptance: invalid inputs return 400 with field-level Zod errors; valid input creates both rows in one transaction.
- Verify: unit test on the server fn against local Supabase.

### P2.3 `/sweepstakes/new` UI
- Goal: form for name + `registration_closes_at` (default = 2026-06-11 17:00 UK); on submit, route to `/sweepstakes/$id`.
- Acceptance: form is keyboard-navigable; loading state on submit; redirects only on success.
- Verify: manual click-through.

### P2.4 `/sweepstakes/$id` skeleton
- Goal: pool dashboard route loads via `createFileRoute`, fetches pool via server-side loader, renders pool name, status, organiser info.
- Acceptance: non-members hitting the URL get a 404 (RLS), not a leaked name.
- Verify: open in a private window with a second Supabase user.

---

## Phase 3 — Entries

### P3.1 `entries` schema + DB triggers
- Goal: `entries` table with constraints — `UNIQUE(participant_id, entry_number)`, `UNIQUE(sweepstake_id, user_id)` on `participants`, trigger rejecting `entry_number > sweepstakes.max_entries_per_participant`.
- Acceptance: SQL-level test — trying to insert a 3rd entry returns the trigger error; trying to insert a duplicate `(participant, entry_number)` returns a unique-violation; both with messages a UI can translate.
- Verify: Vitest integration test.

### P3.2 Invite tokens + `join.$token` route
- Goal: organiser-generated invite link `/[id]/join/[token]`. Token landing creates the `participant` row (if missing) and routes to `/sweepstakes/$id`.
- Acceptance: token has `expires_at` + `max_uses`. Expired/exhausted tokens render a clear error page.
- Verify: manual click-through + integration test on token state machine.

### P3.3 `createEntry` server fn
- Goal: server fn inserts an `entry` for the current participant. Pre-check count; surface "you already have 2 entries" if hit. Default `paid_at = NULL`.
- Acceptance: returns the new entry; rejects when cap exceeded; rejects when `sweepstakes.registration_closes_at < now()`.
- Verify: integration test covers cap, deadline, and happy path.

### P3.4 Buy-entries UI on pool dashboard
- Goal: participant-facing block showing "Buy 1st entry" or "Buy 2nd entry" (yellow CTA); hides when both bought; shows payment status pill (PAID / PENDING).
- Acceptance: matches design tokens; uses status chip components from P0.3; uses Geist Mono for entry number.
- Verify: manual.

### P3.5 Organiser entries page `$id.entries.tsx`
- Goal: organiser sees a table of participants with email, display name, # entries, paid status; can toggle paid/unpaid per entry; sees Levenshtein-based "possible duplicate" flag.
- Acceptance: toggling paid status updates `paid_at` immediately and is reflected on participants' dashboards.
- Verify: 2-user click-through.

**→ CP-β**

---

## Phase 4 — Draw

### P4.1 Seed `teams` table
- Goal: 48 World Cup 2026 teams in `teams` with name, code, group, seed. Idempotent seed script in `supabase/seed.sql`.
- Acceptance: `pnpm supabase:reset` results in exactly 48 rows.
- Verify: query count.

### P4.2 `lib/draw.ts` — round-based algorithm
- Goal: pure function implementing SPEC §6 algorithm. Inputs: `paid_entries`, `teams`, `draw_seed`. Output: `{ allocations: Map<entryId, teamId>, seed }`.
- Acceptance: all 5 invariants from SPEC §6 hold; deterministic.
- Verify: Vitest unit tests (the 5 invariants + 10 000-seed property test on round-bucket fairness and co-ownership spread).

### P4.3 `allocations` RLS — pre-reveal hiding
- Goal: RLS on `allocations` so `team_id` is readable only by the owning participant (and organiser) until `revealed_at IS NOT NULL`. Post-reveal, readable by all pool members.
- Acceptance: direct Supabase REST call from Bob's session returns Alice's allocation row but with `team_id = null` pre-reveal; full team after reveal.
- Verify: integration test using two authed clients.

### P4.4 `runDraw` server fn
- Goal: organiser-only server fn that: locks the pool (status → 'drawing'), generates or accepts a seed, calls `lib/draw.ts`, inserts allocations in a transaction, sets `status = 'drawn'` and stores `draw_seed`.
- Acceptance: re-running on a drawn pool errors with "already drawn"; transaction rolls back on any failure; allocations match what the pure function returned.
- Verify: integration test.

### P4.5 `/sweepstakes/$id/draw` UI
- Goal: organiser-only page showing entries summary ("90 paid, 6 unpaid — unpaid will be excluded"), a "Run draw" button (destructive-tone confirmation), a `draw_seed` input (optional).
- Acceptance: post-draw, redirects to pool dashboard which now shows revealable cards.
- Verify: click-through.

---

## Phase 5 — Reveal

### P5.1 `reveal` server fn
- Goal: takes `allocation_id`; verifies the caller is the owner; if `reveals_unlock_at` is set, verifies `now() >= reveals_unlock_at`; updates `revealed_at = now()`; returns the team.
- Acceptance: non-owner returns 403; pre-unlock returns "locked until X"; second call on the same allocation returns the team (idempotent).
- Verify: integration test.

### P5.2 `/sweepstakes/$id/reveal` route
- Goal: shows the owner's unrevealed allocations as "🎁 Reveal" cards. Clicking triggers the server fn + Framer Motion animation (envelope flip + flag scale-in + name fade).
- Acceptance: animation duration ~2.5 s; `prefers-reduced-motion` swaps to a 200 ms fade; keyboard-accessible (Enter triggers).
- Verify: manual on desktop, mobile, and with reduced-motion enabled in DevTools.

### P5.3 Reveal-unlock countdown
- Goal: when `reveals_unlock_at` is in the future, the page shows a Geist Mono countdown `HH:MM:SS` instead of the reveal cards.
- Acceptance: countdown ticks every second client-side; once it hits 00:00:00, the cards swap in without a page reload.
- Verify: manual with a 60-second future timestamp.

### P5.4 Champion-tier confetti
- Goal: CSS-only confetti burst (yellow + white) on reveal of Brazil, France, Argentina, England, Germany, Spain, Netherlands.
- Acceptance: no extra JS deps; respects reduced-motion (no confetti).
- Verify: manual.

**→ CP-γ**

---

## Phase 6 — Status board

### P6.1 Fixture skeleton seed
- Goal: `matches` table seeded with the 104 WC 2026 fixtures (stage, teams, kickoff timestamps) — `home_score`/`away_score` NULL, `status = 'NS'`.
- Acceptance: 104 rows; `kickoff_at` between 2026-06-11 and 2026-07-19.
- Verify: SQL count + range check.

### P6.2 Team status chip component
- Goal: status chip showing one of: `IN: GROUP X` / `THROUGH TO R32` / `ELIMINATED — GROUP STAGE` / `WON QF` / `CHAMPION` / `RUNNER-UP` / etc. Colour-coded per SPEC §"Brand & design".
- Acceptance: storybook-style smoke route renders all variants.
- Verify: visual.

### P6.3 Status board route `$id.index.tsx`
- Goal: for a participant, list their entries; for each entry, the team (post-reveal) with its current status chip; for the organiser, the same view across all participants.
- Acceptance: pre-reveal allocations render as "🎁 Pending" without leaking team identity (re-verifies the RLS rule visually).
- Verify: manual + RLS integration test.

### P6.4 Group standings table
- Goal: 12 group tables sortable client-side by points, GD, GF — using Geist Mono throughout.
- Acceptance: keyboard navigable; tabular-nums; columns labelled in uppercase mono.
- Verify: manual + axe-core.

---

## Phase 7 — Results sync

### P7.1 `lib/fixtures/api-football.ts` client + Zod schemas
- Goal: thin client for the api-football "fixtures by league" endpoint; Zod parses every response; clamps `home_score`/`away_score` to `[0, 30]`; logs and skips malformed rows without throwing.
- Acceptance: 100 % unit test coverage on the parser with a recorded fixture sample.
- Verify: Vitest.

### P7.2 `lib/fixtures/sync.ts` reconciliation
- Goal: pure-ish function taking parsed API matches + current DB state, returning a list of upserts (matches) and team-state updates (group standings, final_position, eliminated_at). Does not touch the DB itself — the route handler does.
- Acceptance: idempotent — calling twice with the same input produces the same output; rows with `manual_override = true` are filtered out before upsert.
- Verify: Vitest unit test with a fixture going `NS → 1H → HT → FT` across calls.

### P7.3 `/api/cron/sync-results` route
- Goal: route handler verifies `Authorization: Bearer <CRON_SECRET>`, fetches via the client, runs `sync.ts`, writes upserts in a transaction, logs to `sync_runs`.
- Acceptance: unauthenticated → 401; success path increments `sync_runs.matches_updated`; failure path writes the error and exits 500.
- Verify: integration test with MSW stubbing api-football.

### P7.4 Vercel cron in `vercel.ts`
- Goal: single cron at `0 6 * * *` (06:00 UTC) hitting `/api/cron/sync-results`.
- Acceptance: deployed cron visible in Vercel dashboard; manual trigger works.
- Verify: trigger from Vercel UI.

### P7.5 Manual override UI
- Goal: organiser edits a match score on `$id.index.tsx`; sets `manual_override = true`; subsequent sync runs skip it.
- Acceptance: integration test asserts skip behaviour.
- Verify: integration test + manual.

**→ CP-δ**

---

## Phase 8 — Prizes

### P8.1 `lib/prizes.ts` resolver
- Goal: pure function taking `teams` (with `final_position`, group stats) + `allocations` → list of 5 prize positions, each with team(s) and owner(s) with cent-accurate splits.
- Acceptance: invariants from SPEC §10 test list #11 and #12 hold; rounding residue assigned deterministically to the earliest-drawn allocation.
- Verify: Vitest with hand-crafted tournament states (champion decided / 4 group exits tied / all permutations of wooden-spoon tiebreaker).

### P8.2 `/sweepstakes/$id/prizes` UI
- Goal: 5 prize slots, each showing current candidate (or final winner), the team flag + name, co-owner list with split amounts. Pre-decided prizes (winner, runner-up, third) show "Pending — final whistle on 19 July" until the tournament ends.
- Acceptance: matches the broadcast-graphic aesthetic — Geist Mono for amounts, accent colour for confirmed winners.
- Verify: manual + screenshot review.

### P8.3 Wooden-spoon tiebreaker drawing-of-lots tool
- Goal: when group-stage exits tie on all three metrics, organiser is prompted to roll a deterministic dice (uses pool seed) to resolve; resolution logged with reason.
- Acceptance: result is reproducible from the seed + tied team IDs; visible in an audit panel.
- Verify: unit + manual.

---

## Phase 9 — Hardening & launch

### P9.1 Playwright E2E happy path
- Goal: full flow scripted: create pool → invite → join → buy 2 entries → mark paid → run draw → reveal → see status board → trigger a sync replay → see prize standings update.
- Acceptance: runs green in CI; takes < 60 s; deterministic.
- Verify: CI run.

### P9.2 Accessibility audit
- Goal: axe-core run on every public route; manual keyboard-only walkthrough of the happy path; reduced-motion fallback verified.
- Acceptance: zero `serious` or `critical` axe violations; reveal works without animation when reduced-motion is on.
- Verify: axe report + manual.

### P9.3 Mobile pass
- Goal: 360 px / 414 px viewports for every route; touch targets ≥ 44 px; reveal animation tested on actual phone.
- Acceptance: Lighthouse mobile ≥ 90 on landing + status board.
- Verify: Lighthouse + manual.

### P9.4 Pre-launch checklist (`agent-skills:ship`)
- Goal: env vars present in production; cron secret rotated; Supabase RLS verified against the production database; analytics/error reporting (if any) wired with consent.
- Acceptance: checklist signed off.
- Verify: walk through the skill.

### P9.5 Production deploy + smoke test
- Goal: `vercel --prod`; smoke test the happy path on the production URL; record the production `draw_seed` convention; brief the organiser on operating it.
- Acceptance: green smoke; rollback plan documented (link to previous deploy).
- Verify: live click-through.

**→ CP-ε**

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| api-football WC 2026 coverage is patchy on free tier | Manual override UI (P7.5) is the safety net. Worst case: switch to paid tier (€20/mo) for one month — flagged in spec as ask-first. |
| Slack app approval / OAuth config | Register the Slack app on day 1 of P0 so DNS, redirect URLs and review (if needed) are settled before P1.1. |
| Round-bucket algorithm edge case at small N | 10 000-seed property test in P4.2 covers all realistic N. Algorithm is < 50 lines so easy to audit. |
| Reveal RLS leak | CP-γ explicitly tests via direct REST call, not just UI. |
| 17-day timeline too tight | P9.4 buffer + parallel P5/P6/P7 if needed. If we slip, drop confetti (P5.4), drop wooden-spoon dice (P8.3), and ship without. |

## Out of scope (Phase 2 / post-launch)

- Tikkie integration
- Group reveal events (Supabase Realtime)
- Configurable prize-split UI
- Public read-only leaderboard
- Light theme
- Push/email notifications
- Multi-tournament support (Women's WC 2027, Euros, etc.)
