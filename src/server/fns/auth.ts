import { createServerFn } from '@tanstack/react-start'
import { getServerClient } from '@/lib/supabase/server'

/** Returns the current authenticated user, or null if signed out. */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getServerClient()
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
})

/** Clears the Supabase session cookie. */
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getServerClient()
  await supabase.auth.signOut()
  return { ok: true }
})
