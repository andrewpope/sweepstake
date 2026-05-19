import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import SignInButton from './sign-in-button'

type SearchParams = Promise<{ error?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser()
  if (user) redirect('/')

  const { error } = await searchParams

  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Sign in
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Welcome back.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use the same Slack account your sweepstake organiser invited. We don&apos;t store
          anything beyond your display name and avatar.
        </p>

        <div className="mt-8">
          <SignInButton />
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
