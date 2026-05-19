'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createInviteAction } from '@/lib/invites/actions'

export default function InviteSection({
  poolId,
  existingTokens,
}: {
  poolId: string
  existingTokens: string[]
}) {
  const [state, formAction, pending] = useActionState(createInviteAction, {})
  const [copied, setCopied] = useState<string | null>(null)

  const tokens = state.token ? [state.token, ...existingTokens] : existingTokens
  const origin = typeof window === 'undefined' ? '' : window.location.origin

  async function copy(token: string) {
    const url = `${origin}/join/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 1800)
  }

  return (
    <div>
      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="poolId" value={poolId} />
        <Button data-testid="create-invite" type="submit" disabled={pending} size="sm">
          {pending ? 'Creating…' : 'Generate invite link'}
        </Button>
        {state.error && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-destructive">
            {state.error}
          </span>
        )}
      </form>

      {tokens.length > 0 && (
        <ul className="mt-4 space-y-2">
          {tokens.map((token) => {
            const url = `${origin}/join/${token}`
            return (
              <li
                key={token}
                className="flex items-center gap-3 rounded-[2px] border border-border bg-surface-elevated px-3 py-2"
              >
                <code className="flex-1 truncate font-mono text-xs text-foreground">
                  {url || `/join/${token}`}
                </code>
                <button
                  type="button"
                  onClick={() => copy(token)}
                  className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
                >
                  {copied === token ? 'Copied!' : 'Copy'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
