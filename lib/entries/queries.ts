import 'server-only'
import { getServerClient } from '@/lib/supabase/server'

export type MyEntriesView = {
  participantId: string | null
  entries: Array<{ id: string; entry_number: number; paid_at: string | null }>
}

export async function getMyEntries(poolId: string): Promise<MyEntriesView> {
  const supabase = await getServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { participantId: null, entries: [] }

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('sweepstake_id', poolId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (!participant) return { participantId: null, entries: [] }

  const { data: entries } = await supabase
    .from('entries')
    .select('id, entry_number, paid_at')
    .eq('participant_id', participant.id)
    .order('entry_number')

  return { participantId: participant.id, entries: entries ?? [] }
}

export type ParticipantWithEntries = {
  participantId: string
  userId: string
  displayName: string
  joinedAt: string
  entries: Array<{ id: string; entry_number: number; paid_at: string | null }>
}

export async function getPoolEntriesForOrganiser(
  poolId: string,
): Promise<ParticipantWithEntries[]> {
  const supabase = await getServerClient()
  const { data: participants } = await supabase
    .from('participants')
    .select('id, user_id, display_name, created_at')
    .eq('sweepstake_id', poolId)
    .order('created_at')

  if (!participants) return []

  const { data: entries } = await supabase
    .from('entries')
    .select('id, participant_id, entry_number, paid_at')
    .eq('sweepstake_id', poolId)

  const grouped = new Map<string, ParticipantWithEntries>()
  for (const p of participants) {
    grouped.set(p.id, {
      participantId: p.id,
      userId: p.user_id,
      displayName: p.display_name,
      joinedAt: p.created_at,
      entries: [],
    })
  }
  for (const e of entries ?? []) {
    const row = grouped.get(e.participant_id)
    if (!row) continue
    row.entries.push({ id: e.id, entry_number: e.entry_number, paid_at: e.paid_at })
  }
  for (const row of grouped.values()) row.entries.sort((a, b) => a.entry_number - b.entry_number)

  return Array.from(grouped.values())
}

/** Simple Levenshtein for the duplicate-name flag. */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const prev: number[] = new Array(n + 1)
  const curr: number[] = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      )
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j] ?? 0
  }
  return prev[n] ?? 0
}

export function findDuplicateNamePairs(
  rows: ParticipantWithEntries[],
  threshold = 2,
): Set<string> {
  const flagged = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i]
    if (!a) continue
    for (let j = i + 1; j < rows.length; j++) {
      const b = rows[j]
      if (!b) continue
      const an = a.displayName.toLowerCase().trim()
      const bn = b.displayName.toLowerCase().trim()
      if (an === bn || levenshtein(an, bn) <= threshold) {
        flagged.add(a.participantId)
        flagged.add(b.participantId)
      }
    }
  }
  return flagged
}
