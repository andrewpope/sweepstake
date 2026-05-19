# Todo — World Cup Sweepstake

Detail: `tasks/plan.md`. Spec: `SPEC.md`. Launch target: **2026-06-05**.

## P0 — Foundation
- [ ] P0.1 Scaffold TanStack Start
- [ ] P0.2 Tooling baseline (ESLint, Prettier, Vitest, Playwright, strict TS)
- [ ] P0.3 Tailwind v4 + shadcn/ui + design tokens
- [ ] P0.4 Geist + Geist Mono fonts
- [ ] P0.5 Supabase local + schema baseline
- [ ] P0.6 Vercel project + CI

**→ CP-α: preview deploy green, smoke route renders design tokens.**

## P1 — Auth
- [ ] P1.1 Sign in with Slack (Supabase OAuth, Slack-only)
- [ ] P1.2 Root layout + header
- [ ] P1.3 Marketing landing

## P2 — Pool creation
- [ ] P2.1 `sweepstakes` schema + RLS
- [ ] P2.2 `createSweepstake` server fn
- [ ] P2.3 `/sweepstakes/new` UI
- [ ] P2.4 `/sweepstakes/$id` skeleton

## P3 — Entries
- [ ] P3.1 `entries` schema + DB triggers (cap enforcement)
- [ ] P3.2 Invite tokens + `join.$token` route
- [ ] P3.3 `createEntry` server fn
- [ ] P3.4 Buy-entries UI
- [ ] P3.5 Organiser entries page + paid toggle

**→ CP-β: pool runnable to "ready to draw"; cap enforced; RLS verified.**

## P4 — Draw
- [ ] P4.1 Seed `teams` (48 rows)
- [ ] P4.2 `lib/draw.ts` round-based algorithm + property tests
- [ ] P4.3 `allocations` RLS (pre-reveal hiding)
- [ ] P4.4 `runDraw` server fn (transactional)
- [ ] P4.5 `/sweepstakes/$id/draw` organiser UI

## P5 — Reveal
- [ ] P5.1 `reveal` server fn
- [ ] P5.2 `/sweepstakes/$id/reveal` route + Framer Motion
- [ ] P5.3 Reveal-unlock countdown (Geist Mono)
- [ ] P5.4 Champion-tier confetti

**→ CP-γ: draw deterministic, fairness property test 10 000 seeds, reveal hides team_id via direct REST check.**

## P6 — Status board
- [ ] P6.1 Fixture skeleton seed (104 matches)
- [ ] P6.2 Team status chip component
- [ ] P6.3 Status board route
- [ ] P6.4 Group standings table

## P7 — Results sync
- [ ] P7.1 `lib/fixtures/api-football.ts` + Zod schemas
- [ ] P7.2 `lib/fixtures/sync.ts` reconciliation (idempotent)
- [ ] P7.3 `/api/cron/sync-results` route + CRON_SECRET
- [ ] P7.4 Vercel cron `0 6 * * *`
- [ ] P7.5 Manual override UI

**→ CP-δ: cron green in preview, sync idempotent, override respected.**

## P8 — Prizes
- [ ] P8.1 `lib/prizes.ts` resolver (pure)
- [ ] P8.2 `/sweepstakes/$id/prizes` UI
- [ ] P8.3 Wooden-spoon tiebreaker dice tool

## P9 — Hardening & launch
- [ ] P9.1 Playwright E2E happy path in CI
- [ ] P9.2 Accessibility audit (axe + keyboard + reduced-motion)
- [ ] P9.3 Mobile pass (360 / 414 px, Lighthouse ≥ 90)
- [ ] P9.4 Pre-launch checklist (`/agent-skills:ship`)
- [ ] P9.5 `vercel --prod` + smoke test (2026-06-05)

**→ CP-ε: production ready, soak through 2026-06-11.**

## Buffer / cuttable scope (drop if running late)
- [ ] P5.4 Confetti
- [ ] P8.3 Tiebreaker dice tool (organiser can roll manually + log instead)
- [ ] P6.4 Group standings sort/filter (read-only table is enough)
