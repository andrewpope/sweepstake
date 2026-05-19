import 'server-only'
import { getServerClient } from '@/lib/supabase/server'

export type PoolSummary = {
  id: string
  name: string
  status: string
  organiserId: string
  organiserName: string
  registrationClosesAt: string | null
  entryPriceCents: number
  maxEntriesPerParticipant: number
  isOrganiser: boolean
}

export async function getPoolForCurrentUser(poolId: string): Promise<PoolSummary | null> {
  const supabase = await getServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data, error } = await supabase
    .from('sweepstakes')
    .select(
      'id, name, status, organiser_id, registration_closes_at, entry_price_cents, max_entries_per_participant',
    )
    .eq('id', poolId)
    .maybeSingle()

  if (error || !data) return null

  // Look up organiser display via participants table (organiser is always a
  // participant). Falls back to email if their participant row is missing.
  const { data: organiserParticipant } = await supabase
    .from('participants')
    .select('display_name')
    .eq('sweepstake_id', poolId)
    .eq('user_id', data.organiser_id)
    .maybeSingle()

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    organiserId: data.organiser_id,
    organiserName: organiserParticipant?.display_name ?? 'Organiser',
    registrationClosesAt: data.registration_closes_at,
    entryPriceCents: data.entry_price_cents,
    maxEntriesPerParticipant: data.max_entries_per_participant,
    isOrganiser: data.organiser_id === userData.user.id,
  }
}
