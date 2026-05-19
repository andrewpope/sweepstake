import 'server-only'
import { getServerClient } from '@/lib/supabase/server'

export type ResolvedInvite = {
  inviteId: string
  sweepstakeId: string
  sweepstakeName: string
  expiresAt: string | null
  maxUses: number | null
  usedCount: number
  status: 'ok' | 'expired' | 'exhausted'
}

export async function resolveInvite(token: string): Promise<ResolvedInvite | null> {
  const supabase = await getServerClient()
  const { data, error } = await supabase.rpc('get_invite_by_token', { p_token: token })
  if (error || !data || data.length === 0) return null

  const row = data[0]
  if (!row) return null
  const expired = row.expires_at !== null && new Date(row.expires_at) < new Date()
  const exhausted = row.max_uses !== null && row.used_count >= row.max_uses

  return {
    inviteId: row.invite_id,
    sweepstakeId: row.sweepstake_id,
    sweepstakeName: row.sweepstake_name,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    status: expired ? 'expired' : exhausted ? 'exhausted' : 'ok',
  }
}
