'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getServerClient } from '@/lib/supabase/server'

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Pool name is required')
    .max(80, 'Pool name must be 80 characters or fewer'),
  registrationClosesAt: z
    .string()
    .min(1, 'Registration deadline is required')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
})

export type CreateSweepstakeState = {
  fieldErrors?: Partial<Record<'name' | 'registrationClosesAt', string>>
  formError?: string
}

export async function createSweepstakeAction(
  _prev: CreateSweepstakeState,
  formData: FormData,
): Promise<CreateSweepstakeState> {
  const user = await getCurrentUser()
  if (!user) return { formError: 'You need to sign in first.' }

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    registrationClosesAt: formData.get('registrationClosesAt'),
  })
  if (!parsed.success) {
    const fieldErrors: CreateSweepstakeState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (key === 'name' || key === 'registrationClosesAt') {
        fieldErrors[key] = issue.message
      }
    }
    return { fieldErrors }
  }

  const supabase = await getServerClient()

  const { data: inserted, error: insertError } = await supabase
    .from('sweepstakes')
    .insert({
      name: parsed.data.name,
      organiser_id: user.id,
      registration_closes_at: new Date(parsed.data.registrationClosesAt).toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { formError: insertError?.message ?? 'Failed to create pool.' }
  }

  const { error: participantError } = await supabase.from('participants').insert({
    sweepstake_id: inserted.id,
    user_id: user.id,
    display_name: user.name,
  })

  if (participantError) {
    // Roll back the sweepstake — RLS lets the organiser delete their own row.
    await supabase.from('sweepstakes').delete().eq('id', inserted.id)
    return { formError: participantError.message }
  }

  redirect(`/sweepstakes/${inserted.id}`)
}
