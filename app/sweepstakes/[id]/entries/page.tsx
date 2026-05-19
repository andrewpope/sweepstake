import { notFound, redirect } from 'next/navigation'
import { StatusChip } from '@/components/ui/status-chip'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { findDuplicateNamePairs, getPoolEntriesForOrganiser } from '@/lib/entries/queries'
import { getPoolForCurrentUser } from '@/lib/sweepstakes/queries'
import { formatInAmsterdam } from '@/lib/time'
import TogglePaidButton from './toggle-paid-button'

type Params = Promise<{ id: string }>

export default async function PoolEntriesPage({ params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const pool = await getPoolForCurrentUser(id)
  if (!pool) notFound()
  if (!pool.isOrganiser) {
    // Members can read but only organiser manages — bounce non-organisers to the dashboard.
    redirect(`/sweepstakes/${id}`)
  }

  const rows = await getPoolEntriesForOrganiser(id)
  const dupeFlags = findDuplicateNamePairs(rows)

  const paidCount = rows.reduce(
    (acc, r) => acc + r.entries.filter((e) => e.paid_at !== null).length,
    0,
  )
  const totalEntries = rows.reduce((acc, r) => acc + r.entries.length, 0)

  return (
    <main className="page-wrap py-12">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Pool · {pool.name}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Entries</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {paidCount} / {totalEntries} paid · {rows.length} participants
      </p>

      <section className="mt-8 overflow-hidden rounded-[4px] border border-border">
        <table className="w-full">
          <thead className="bg-surface-elevated">
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Participant</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Entries</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No participants yet. Share the invite link from the dashboard.
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const flagged = dupeFlags.has(row.participantId)
              return (
                <tr
                  key={row.participantId}
                  className={i === rows.length - 1 ? '' : 'border-b border-border'}
                >
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{row.displayName}</span>
                      {flagged && (
                        <StatusChip tone="warning" title="Similar display name to another participant">
                          Dupe?
                        </StatusChip>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-xs text-muted-foreground">
                    {formatInAmsterdam(row.joinedAt)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {row.entries.length === 0 && (
                      <span className="font-mono text-xs uppercase tracking-wider text-subtle-foreground">
                        none yet
                      </span>
                    )}
                    <ul className="space-y-2">
                      {row.entries.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center gap-3"
                          data-testid="entry-row"
                        >
                          <span className="font-mono text-xs text-foreground">
                            #{e.entry_number}
                          </span>
                          <StatusChip tone={e.paid_at ? 'success' : 'warning'}>
                            {e.paid_at ? 'Paid' : 'Pending'}
                          </StatusChip>
                          <TogglePaidButton
                            entryId={e.id}
                            poolId={id}
                            currentlyPaid={e.paid_at !== null}
                          />
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </main>
  )
}
