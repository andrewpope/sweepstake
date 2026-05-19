'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { buyEntryAction } from '@/lib/entries/actions'

export default function BuyEntryButton({
  poolId,
  label,
  disabled,
}: {
  poolId: string
  label: string
  disabled?: boolean
}) {
  const [state, formAction, pending] = useActionState(buyEntryAction, {})

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="poolId" value={poolId} />
      <Button
        data-testid="buy-entry"
        type="submit"
        disabled={pending || disabled}
        size="md"
      >
        {pending ? 'Adding…' : label}
      </Button>
      {state.error && (
        <p
          data-testid="buy-entry-error"
          className="font-mono text-[11px] uppercase tracking-wider text-destructive"
        >
          {state.error}
        </p>
      )}
    </form>
  )
}
