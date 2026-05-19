import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="page-wrap py-12">
      <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
        World Cup 2026 / Sweepstake
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        Draw your teams.
        <br />
        <span className="text-accent">Watch them fly or flop.</span>
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        €5 entry, max 2 per person. The bracket draws balanced, your teams reveal one by one,
        and the prize pot waits for the final whistle on 19 July 2026.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <>
            <Button data-testid="cta-primary" disabled>
              Create a sweepstake — coming in P2
            </Button>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground self-center">
              Signed in as {user.name}
            </span>
          </>
        ) : (
          <Link href="/login">
            <Button data-testid="cta-primary">Sign in with Slack</Button>
          </Link>
        )}
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="card-sample">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Brazil</CardTitle>
              <CardDescription>Group D</CardDescription>
            </div>
            <StatusChip tone="success">Through</StatusChip>
          </div>
          <p className="mt-4 font-mono text-2xl tabular-nums text-accent">2 — 1</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            vs. Senegal · #023 / 104
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Iran</CardTitle>
              <CardDescription>Group F</CardDescription>
            </div>
            <StatusChip tone="destructive">Out</StatusChip>
          </div>
          <p className="mt-4 font-mono text-2xl tabular-nums text-muted-foreground">0 — 3</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            vs. Netherlands · #017 / 104
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Argentina</CardTitle>
              <CardDescription>Group A</CardDescription>
            </div>
            <StatusChip tone="info">Live · 67&apos;</StatusChip>
          </div>
          <p className="mt-4 font-mono text-2xl tabular-nums text-foreground">1 — 1</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            vs. Mexico · #042 / 104
          </p>
        </Card>
      </section>
    </main>
  )
}
