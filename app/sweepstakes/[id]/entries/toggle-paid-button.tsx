'use client'

import { useActionState } from 'react'
import { toggleEntryPaidAction } from '@/lib/entries/actions'

export default function TogglePaidButton({
  entryId,
  poolId,
  currentlyPaid,
}: {
  entryId: string
  poolId: string
  currentlyPaid: boolean
}) {
  const [state, formAction, pending] = useActionState(toggleEntryPaidAction, {})

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="poolId" value={poolId} />
      <input type="hidden" name="paid" value={currentlyPaid ? 'false' : 'true'} />
      <button
        data-testid="toggle-paid"
        type="submit"
        disabled={pending}
        className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline disabled:opacity-50"
      >
        {pending ? '…' : currentlyPaid ? 'Mark unpaid' : 'Mark paid'}
      </button>
      {state.error && (
        <span className="font-mono text-[11px] uppercase tracking-wider text-destructive">
          {state.error}
        </span>
      )}
    </form>
  )
}
