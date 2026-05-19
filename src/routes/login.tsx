import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/server/fns/auth'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { error?: string } =>
    typeof search.error === 'string' ? { error: search.error } : {},
  beforeLoad: async () => {
    // If the user is already signed in, send them home.
    const user = await getCurrentUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { error: searchError } = Route.useSearch()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(searchError ?? null)

  async function handleSlack() {
    setError(null)
    setPending(true)
    const supabase = getBrowserClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'slack_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setPending(false)
    }
    // On success, the browser is redirected to Slack — nothing else to do here.
  }

  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Sign in
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Welcome back.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use the same Slack account your sweepstake organiser invited. We don&apos;t store
          anything beyond your display name and avatar.
        </p>

        <div className="mt-8">
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
        </div>

        {error && (
          <p
            data-testid="sign-in-error"
            className="mt-4 font-mono text-xs uppercase tracking-wider text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </main>
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
