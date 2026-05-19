import { notFound, redirect } from 'next/navigation'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getPoolForCurrentUser } from '@/lib/sweepstakes/queries'

type Params = Promise<{ id: string }>

export default async function PoolDashboardPage({ params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const pool = await getPoolForCurrentUser(id)

  // RLS already prevents non-members from seeing the row; surface as 404 so
  // we don't leak whether the pool exists.
  if (!pool) notFound()

  const entryPriceLabel = (pool.entryPriceCents / 100).toLocaleString('en-IE', {
    style: 'currency',
    currency: 'EUR',
  })
  const closesAt = pool.registrationClosesAt
    ? new Date(pool.registrationClosesAt).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'not set'

  return (
    <main className="page-wrap py-12">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Pool
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-4">
        <h1
          data-testid="pool-name"
          className="text-4xl font-bold tracking-tight text-foreground"
        >
          {pool.name}
        </h1>
        <StatusChip tone={pool.status === 'drawn' ? 'success' : 'neutral'}>
          {pool.status.toUpperCase()}
        </StatusChip>
        {pool.isOrganiser && <StatusChip tone="info">Organiser</StatusChip>}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Entry price</CardTitle>
          <CardDescription>What every entry costs</CardDescription>
          <p className="mt-4 font-mono text-2xl tabular-nums text-accent">{entryPriceLabel}</p>
        </Card>
        <Card>
          <CardTitle>Max per person</CardTitle>
          <CardDescription>Cap on entries per participant</CardDescription>
          <p className="mt-4 font-mono text-2xl tabular-nums text-foreground">
            {pool.maxEntriesPerParticipant}
          </p>
        </Card>
        <Card>
          <CardTitle>Registration closes</CardTitle>
          <CardDescription>No new entries after this</CardDescription>
          <p className="mt-4 font-mono text-sm tabular-nums text-foreground">{closesAt}</p>
        </Card>
      </section>

      <section className="mt-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Organiser
        </p>
        <p className="mt-2 text-base text-foreground">{pool.organiserName}</p>
      </section>

      <section className="mt-12 rounded-[4px] border border-border bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Coming next
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite link, entries page, payment toggle and draw kick off in P3 and P4. For now
          you&apos;ve created the pool — that&apos;s the P2 deliverable.
        </p>
      </section>
    </main>
  )
}
