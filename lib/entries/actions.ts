'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getServerClient } from '@/lib/supabase/server'

const poolIdSchema = z.object({ poolId: z.uuid() })

export async function buyEntryAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not signed in' }

  const parsed = poolIdSchema.safeParse({ poolId: formData.get('poolId') })
  if (!parsed.success) return { error: 'Invalid pool id' }

  const supabase = await getServerClient()

  // Reject after registration closes.
  const { data: pool, error: poolErr } = await supabase
    .from('sweepstakes')
    .select('id, registration_closes_at, max_entries_per_participant, status')
    .eq('id', parsed.data.poolId)
    .maybeSingle()
  if (poolErr || !pool) return { error: 'Pool not found' }
  if (pool.registration_closes_at && new Date(pool.registration_closes_at) < new Date())
    return { error: 'Registration is closed for this pool.' }
  if (pool.status !== 'draft' && pool.status !== 'open')
    return { error: 'This pool is no longer accepting entries.' }

  // Resolve the caller's participant id in this pool.
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('sweepstake_id', parsed.data.poolId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!participant) return { error: 'You are not a participant in this pool.' }

  // Compute next entry_number for this participant.
  const { count: existingCount, error: countErr } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('participant_id', participant.id)
  if (countErr) return { error: countErr.message }

  const nextEntryNumber = (existingCount ?? 0) + 1
  if (nextEntryNumber > pool.max_entries_per_participant)
    return { error: `Maximum of ${pool.max_entries_per_participant} entries reached.` }

  const { error: insertErr } = await supabase.from('entries').insert({
    participant_id: participant.id,
    sweepstake_id: parsed.data.poolId,
    entry_number: nextEntryNumber,
  })

  if (insertErr) {
    if (insertErr.message.includes('exceeds the pool cap'))
      return { error: 'Maximum entries reached for this pool.' }
    return { error: insertErr.message }
  }

  revalidatePath(`/sweepstakes/${parsed.data.poolId}`)
  revalidatePath(`/sweepstakes/${parsed.data.poolId}/entries`)
  return {}
}

const togglePaidSchema = z.object({
  entryId: z.uuid(),
  poolId: z.uuid(),
  paid: z.enum(['true', 'false']),
})

export async function toggleEntryPaidAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not signed in' }

  const parsed = togglePaidSchema.safeParse({
    entryId: formData.get('entryId'),
    poolId: formData.get('poolId'),
    paid: formData.get('paid'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await getServerClient()
  const markPaid = parsed.data.paid === 'true'

  const { error } = await supabase
    .from('entries')
    .update(
      markPaid
        ? { paid_at: new Date().toISOString(), paid_method: 'other' }
        : { paid_at: null, paid_method: null },
    )
    .eq('id', parsed.data.entryId)

  if (error) return { error: error.message }

  revalidatePath(`/sweepstakes/${parsed.data.poolId}`)
  revalidatePath(`/sweepstakes/${parsed.data.poolId}/entries`)
  return {}
}
