'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { createSweepstakeAction, type CreateSweepstakeState } from '@/lib/sweepstakes/actions'

// 11 June 2026 18:00 Amsterdam = first kick-off. The form value is a
// wall-clock string interpreted server-side as Europe/Amsterdam local time.
const DEFAULT_CLOSES_AT = '2026-06-11T18:00'

const initialState: CreateSweepstakeState = {}

export default function NewSweepstakeForm() {
  const [state, formAction, pending] = useActionState(createSweepstakeAction, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          Pool name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Office Sweepstake 2026"
          className="mt-2 block w-full rounded-[2px] border border-border bg-surface px-3 py-2 text-foreground placeholder:text-subtle-foreground focus:border-accent focus:outline-none"
        />
        {state.fieldErrors?.name && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="registrationClosesAt"
          className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          Registration closes (Amsterdam time)
        </label>
        <input
          id="registrationClosesAt"
          name="registrationClosesAt"
          type="datetime-local"
          required
          defaultValue={DEFAULT_CLOSES_AT}
          className="mt-2 block w-full rounded-[2px] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
        />
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-subtle-foreground">
          No new entries after this. Default = first kick-off (11 Jun 2026, 18:00 Amsterdam).
        </p>
        {state.fieldErrors?.registrationClosesAt && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-destructive">
            {state.fieldErrors.registrationClosesAt}
          </p>
        )}
      </div>

      {state.formError && (
        <p
          data-testid="form-error"
          className="font-mono text-xs uppercase tracking-wider text-destructive"
        >
          {state.formError}
        </p>
      )}

      <Button data-testid="create-pool" type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Creating…' : 'Create pool'}
      </Button>
    </form>
  )
}
