'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { runDrawAction, type RunDrawState } from '@/lib/draw/actions'

const initial: RunDrawState = {}

export default function RunDrawForm({
  poolId,
  paidCount,
}: {
  poolId: string
  paidCount: number
}) {
  const [state, formAction, pending] = useActionState(runDrawAction, initial)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="poolId" value={poolId} />
      <div>
        <label
          htmlFor="seed"
          className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          Draw seed (optional)
        </label>
        <input
          id="seed"
          name="seed"
          type="text"
          maxLength={80}
          placeholder="leave blank to generate a random one"
          className="mt-2 block w-full rounded-[2px] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-subtle-foreground focus:border-accent focus:outline-none"
        />
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-subtle-foreground">
          Stored on the pool for audit. Same seed + same paid entries → same allocation.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-accent"
        />
        <span>
          I understand the draw will allocate teams to all {paidCount} paid entries and cannot be
          re-run for this pool.
        </span>
      </label>

      {state.error && (
        <p
          data-testid="draw-error"
          className="font-mono text-xs uppercase tracking-wider text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button
        data-testid="run-draw"
        type="submit"
        disabled={pending || !confirmed}
        size="lg"
        className="w-full"
      >
        {pending ? 'Drawing…' : 'Run draw'}
      </Button>
    </form>
  )
}
