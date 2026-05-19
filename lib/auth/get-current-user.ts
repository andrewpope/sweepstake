import 'server-only'
import { getServerClient } from '@/lib/supabase/server'

export type CurrentUser = {
  id: string
  email: string | null
  name: string
  avatarUrl: string | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await getServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null

  const u = data.user
  const meta = u.user_metadata as Record<string, unknown>
  return {
    id: u.id,
    email: u.email ?? null,
    name:
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      u.email ||
      'Unknown',
    avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : null,
  }
}
