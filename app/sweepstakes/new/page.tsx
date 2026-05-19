import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import NewSweepstakeForm from './new-sweepstake-form'

export default async function NewSweepstakePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/sweepstakes/new')

  return (
    <main className="page-wrap py-12">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Create a pool · World Cup 2026
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Set up your sweepstake.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You&apos;ll be the organiser. Every pool draws the 48 teams of the 2026 FIFA
          World Cup (USA · Canada · Mexico, 11 June – 19 July 2026). You can invite
          participants once the pool is created.
        </p>

        <div className="mt-8">
          <NewSweepstakeForm />
        </div>
      </div>
    </main>
  )
}
