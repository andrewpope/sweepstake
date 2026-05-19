'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getServerClient } from '@/lib/supabase/server'
import { generateSeed, runDraw, type DrawEntry, type DrawTeam } from './algorithm'

const schema = z.object({
  poolId: z.uuid(),
  seed: z.string().trim().max(80).optional(),
})

export type RunDrawState = {
  error?: string
}

export async function runDrawAction(
  _prev: RunDrawState,
  formData: FormData,
): Promise<RunDrawState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not signed in' }

  const parsed = schema.safeParse({
    poolId: formData.get('poolId'),
    seed: (formData.get('seed') as string) || undefined,
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await getServerClient()

  // Verify organiser + load pool status.
  const { data: pool, error: poolErr } = await supabase
    .from('sweepstakes')
    .select('id, organiser_id, status')
    .eq('id', parsed.data.poolId)
    .maybeSingle()
  if (poolErr || !pool) return { error: 'Pool not found' }
  if (pool.organiser_id !== user.id) return { error: 'Only the organiser can run the draw.' }
  if (pool.status !== 'draft' && pool.status !== 'open')
    return { error: `Pool status is "${pool.status}" — draw not available.` }

  // Load paid entries.
  const { data: entries, error: entriesErr } = await supabase
    .from('entries')
    .select('id, participant_id, entry_number')
    .eq('sweepstake_id', parsed.data.poolId)
    .not('paid_at', 'is', null)
    .order('entry_number')
  if (entriesErr) return { error: entriesErr.message }
  if (!entries || entries.length === 0)
    return { error: 'No paid entries to draw. Mark at least one entry as paid first.' }

  // Load teams.
  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id')
    .order('seed')
  if (teamsErr || !teams || teams.length === 0)
    return { error: 'Teams table is empty — seed it before drawing.' }

  // Run the algorithm.
  const drawEntries: DrawEntry[] = entries.map((e) => ({
    entryId: e.id,
    participantId: e.participant_id,
    entryNumber: e.entry_number,
  }))
  const drawTeams: DrawTeam[] = teams.map((t) => ({ teamId: t.id }))
  const seed = parsed.data.seed && parsed.data.seed.length > 0 ? parsed.data.seed : generateSeed()

  let result
  try {
    result = runDraw(drawEntries, drawTeams, seed)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Draw failed' }
  }

  // Persist via the SECURITY DEFINER RPC.
  const { error: rpcErr } = await supabase.rpc('run_pool_draw', {
    p_pool_id: parsed.data.poolId,
    p_seed: seed,
    p_allocations: result.allocations.map((a) => ({ entry_id: a.entryId, team_id: a.teamId })),
  })
  if (rpcErr) return { error: rpcErr.message }

  revalidatePath(`/sweepstakes/${parsed.data.poolId}`)
  revalidatePath(`/sweepstakes/${parsed.data.poolId}/entries`)
  redirect(`/sweepstakes/${parsed.data.poolId}`)
}
