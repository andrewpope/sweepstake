import { notFound, redirect } from 'next/navigation'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getPoolForCurrentUser } from '@/lib/sweepstakes/queries'
import { getServerClient } from '@/lib/supabase/server'
import RunDrawForm from './run-draw-form'

type Params = Promise<{ id: string }>

export default async function DrawPage({ params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const pool = await getPoolForCurrentUser(id)
  if (!pool) notFound()
  if (!pool.isOrganiser) redirect(`/sweepstakes/${id}`)

  const supabase = await getServerClient()
  const { count: paidCount } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('sweepstake_id', id)
    .not('paid_at', 'is', null)
  const { count: unpaidCount } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('sweepstake_id', id)
    .is('paid_at', null)

  const alreadyDrawn = pool.status === 'drawn' || pool.status === 'completed'

  return (
    <main className="page-wrap py-12">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Pool · {pool.name}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Run the draw</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Allocates teams to every paid entry using the round-based algorithm. Unpaid entries are
        excluded. The draw is immutable once run.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Paid entries</CardTitle>
          <CardDescription>Will be included in the draw</CardDescription>
          <p className="mt-4 font-mono text-2xl tabular-nums text-accent">{paidCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>Unpaid entries</CardTitle>
          <CardDescription>Will be excluded</CardDescription>
          <p className="mt-4 font-mono text-2xl tabular-nums text-muted-foreground">
            {unpaidCount ?? 0}
          </p>
        </Card>
      </section>

      <section className="mt-12">
        {alreadyDrawn ? (
          <div className="rounded-[4px] border border-border bg-surface p-5">
            <StatusChip tone="success">Drawn</StatusChip>
            <p className="mt-3 text-sm text-muted-foreground">
              This pool has already been drawn. Allocations are immutable.
            </p>
          </div>
        ) : (paidCount ?? 0) === 0 ? (
          <div className="rounded-[4px] border border-border bg-surface p-5">
            <StatusChip tone="warning">No paid entries</StatusChip>
            <p className="mt-3 text-sm text-muted-foreground">
              Mark at least one entry as paid on the entries page before running the draw.
            </p>
          </div>
        ) : (
          <RunDrawForm poolId={id} paidCount={paidCount ?? 0} />
        )}
      </section>
    </main>
  )
}
