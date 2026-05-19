'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase/client'

export default function SignInButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSlack() {
    setError(null)
    setPending(true)
    const supabase = getBrowserClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'slack_oidc',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setPending(false)
    }
  }

  return (
    <>
      <Button
        data-testid="sign-in-slack"
        onClick={handleSlack}
        disabled={pending}
        size="lg"
        className="w-full"
      >
        <SlackMark />
        {pending ? 'Redirecting to Slack…' : 'Sign in with Slack'}
      </Button>
      {error && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-destructive">
          {error}
        </p>
      )}
    </>
  )
}

function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 15a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 4 0v5a2 2 0 0 1-4 0v-5zm2-9a2 2 0 1 1 2-2v2H9zm0 1a2 2 0 0 1 0 4H4a2 2 0 0 1 0-4h5zm9 2a2 2 0 1 1 2 2h-2V9zm-1 0a2 2 0 0 1-4 0V4a2 2 0 0 1 4 0v5zm-2 9a2 2 0 1 1-2 2v-2h2zm0-1a2 2 0 0 1 0-4h5a2 2 0 0 1 0 4h-5z"
        fill="currentColor"
      />
    </svg>
  )
}
