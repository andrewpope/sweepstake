'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { joinPoolAction, type JoinPoolState } from '@/lib/invites/actions'

const initial: JoinPoolState = {}

export default function JoinForm({
  token,
  defaultDisplayName,
}: {
  token: string
  defaultDisplayName: string
}) {
  const [state, formAction, pending] = useActionState(joinPoolAction, initial)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label
          htmlFor="displayName"
          className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={80}
          defaultValue={defaultDisplayName}
          className="mt-2 block w-full rounded-[2px] border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
        />
        {state.fieldErrors?.displayName && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-destructive">
            {state.fieldErrors.displayName}
          </p>
        )}
      </div>

      {state.error && (
        <p
          data-testid="join-error"
          className="font-mono text-xs uppercase tracking-wider text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button data-testid="confirm-join" type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Joining…' : 'Join pool'}
      </Button>
    </form>
  )
}
