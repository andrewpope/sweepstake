'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getServerClient } from '@/lib/supabase/server'

function generateToken(): string {
  // 24 bytes → 32-char base64url. Plenty of entropy, URL-safe, no padding.
  return randomBytes(24).toString('base64url')
}

const createInviteSchema = z.object({
  poolId: z.uuid(),
})

export async function createInviteAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ token?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not signed in' }

  const parsed = createInviteSchema.safeParse({ poolId: formData.get('poolId') })
  if (!parsed.success) return { error: 'Invalid pool id' }

  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('invites')
    .insert({ sweepstake_id: parsed.data.poolId, token: generateToken() })
    .select('token')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to create invite' }

  revalidatePath(`/sweepstakes/${parsed.data.poolId}`)
  return { token: data.token }
}

const joinSchema = z.object({
  token: z.string().min(1),
  displayName: z.string().trim().min(1).max(80),
})

export type JoinPoolState = {
  error?: string
  fieldErrors?: Partial<Record<'displayName', string>>
}

export async function joinPoolAction(
  _prev: JoinPoolState,
  formData: FormData,
): Promise<JoinPoolState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not signed in' }

  const parsed = joinSchema.safeParse({
    token: formData.get('token'),
    displayName: formData.get('displayName'),
  })
  if (!parsed.success) {
    const fieldErrors: JoinPoolState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'displayName') fieldErrors.displayName = issue.message
    }
    return { fieldErrors, error: fieldErrors.displayName ? undefined : 'Invalid input' }
  }

  const supabase = await getServerClient()
  const { data, error } = await supabase.rpc('join_pool_via_invite', {
    p_token: parsed.data.token,
    p_display_name: parsed.data.displayName,
  })

  if (error || !data) {
    const msg = error?.message ?? 'Failed to join'
    if (msg.includes('invite_not_found')) return { error: 'This invite link is invalid.' }
    if (msg.includes('invite_expired')) return { error: 'This invite link has expired.' }
    if (msg.includes('invite_exhausted'))
      return { error: 'This invite link has already been used the maximum number of times.' }
    return { error: msg }
  }

  // Look up the sweepstake id from the participant we just inserted.
  const { data: participant } = await supabase
    .from('participants')
    .select('sweepstake_id')
    .eq('id', data)
    .single()
  if (!participant) return { error: 'Joined but pool not found.' }

  redirect(`/sweepstakes/${participant.sweepstake_id}`)
}
