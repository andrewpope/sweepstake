import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getServerClient } from '@/lib/supabase/server'
import { resolveInvite } from '@/lib/invites/queries'
import JoinForm from './join-form'

type Params = Promise<{ token: string }>

export default async function JoinPage({ params }: { params: Params }) {
  const { token } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/join/${encodeURIComponent(token)}`)

  const invite = await resolveInvite(token)
  if (!invite) return <InviteError title="Invite not found" />

  if (invite.status === 'expired') return <InviteError title="This invite has expired" />
  if (invite.status === 'exhausted')
    return <InviteError title="This invite has been used up" />

  // If the user is already a member of this pool, skip the form and go straight in.
  const supabase = await getServerClient()
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('sweepstake_id', invite.sweepstakeId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) redirect(`/sweepstakes/${invite.sweepstakeId}`)

  return (
    <main className="page-wrap py-12">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Join pool
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {invite.sweepstakeName}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick the display name your fellow participants will see. You can&apos;t change it
          later without asking the organiser.
        </p>
        <div className="mt-8">
          <JoinForm token={token} defaultDisplayName={user.name} />
        </div>
      </div>
    </main>
  )
}

function InviteError({ title }: { title: string }) {
  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-destructive">
          Cannot join
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask the organiser for a fresh invite link.
        </p>
      </div>
    </main>
  )
}
