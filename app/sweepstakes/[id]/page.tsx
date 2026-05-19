import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getMyEntries } from '@/lib/entries/queries'
import { getPoolForCurrentUser } from '@/lib/sweepstakes/queries'
import { getServerClient } from '@/lib/supabase/server'
import { formatInAmsterdam } from '@/lib/time'
import BuyEntryButton from './buy-entry-button'
import InviteSection from './invite-section'

type Params = Promise<{ id: string }>

export default async function PoolDashboardPage({ params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const pool = await getPoolForCurrentUser(id)
  if (!pool) notFound()

  const myEntries = await getMyEntries(id)

  const entryPriceLabel = (pool.entryPriceCents / 100).toLocaleString('en-IE', {
    style: 'currency',
    currency: 'EUR',
  })
  const closesAt = pool.registrationClosesAt
    ? `${formatInAmsterdam(pool.registrationClosesAt)} CET/CEST`
    : 'not set'
  const registrationClosed =
    pool.registrationClosesAt !== null && new Date(pool.registrationClosesAt) < new Date()

  // Organiser-only data
  let inviteTokens: string[] = []
  if (pool.isOrganiser) {
    const supabase = await getServerClient()
    const { data } = await supabase
      .from('invites')
      .select('token, created_at')
      .eq('sweepstake_id', id)
      .order('created_at', { ascending: false })
    inviteTokens = data?.map((r) => r.token) ?? []
  }

  const entriesUsed = myEntries.entries.length
  const remainingSlots = pool.maxEntriesPerParticipant - entriesUsed

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
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Your entries
        </h2>
        <div className="mt-3 space-y-2">
          {myEntries.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t bought any entries yet.
            </p>
          ) : (
            <ul data-testid="my-entries" className="space-y-2">
              {myEntries.entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-[2px] border border-border bg-surface px-3 py-2"
                >
                  <span className="font-mono text-sm text-foreground">
                    Entry #{e.entry_number}
                  </span>
                  <StatusChip tone={e.paid_at ? 'success' : 'warning'}>
                    {e.paid_at ? 'Paid' : 'Pending'}
                  </StatusChip>
                </li>
              ))}
            </ul>
          )}
          {remainingSlots > 0 && !registrationClosed && (
            <BuyEntryButton
              poolId={id}
              label={entriesUsed === 0 ? `Buy 1st entry · ${entryPriceLabel}` : `Buy ${ordinal(entriesUsed + 1)} entry · ${entryPriceLabel}`}
            />
          )}
          {registrationClosed && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-destructive">
              Registration closed
            </p>
          )}
        </div>
      </section>

      {pool.isOrganiser && (
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Invite participants
            </h2>
            <div className="flex items-center gap-4">
              <Link
                href={`/sweepstakes/${id}/entries`}
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
              >
                Manage entries →
              </Link>
              <Link
                href={`/sweepstakes/${id}/draw`}
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
              >
                Run draw →
              </Link>
            </div>
          </div>
          <div className="mt-3">
            <InviteSection poolId={id} existingTokens={inviteTokens} />
          </div>
        </section>
      )}

      <section className="mt-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Organiser
        </p>
        <p className="mt-2 text-base text-foreground">{pool.organiserName}</p>
      </section>
    </main>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th')
}
