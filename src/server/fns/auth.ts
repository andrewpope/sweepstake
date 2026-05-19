import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { getServerClient } from '@/lib/supabase/server'

/** Returns the current authenticated user, or null if signed out. */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const cookieHeader = getRequestHeader('cookie') ?? ''
  const hasSupabaseCookie = /\bsb-[^=]+-auth-token(\.\d+)?=/.test(cookieHeader)

  if (!hasSupabaseCookie) {
    return null
  }

  const supabase = getServerClient()
  // Use getUser — it validates the token with Supabase Auth, which means
  // a malformed/expired session cookie returns null cleanly rather than
  // trusting a tampered JWT.
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    // Surface server-side so we can see *why* it failed during dev.
    console.warn(
      '[auth] getUser returned no user',
      { error: error?.message, cookieNames: extractCookieNames(cookieHeader) },
    )
    return null
  }

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

function extractCookieNames(header: string): string[] {
  return header
    .split(/;\s*/)
    .map((p) => p.split('=', 1)[0])
    .filter((n): n is string => Boolean(n))
}
