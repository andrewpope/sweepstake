import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Cookie I/O delegates to `next/headers#cookies()` — purpose-built for
 * multi-Set-Cookie scenarios (the chunked Supabase session cookies). This is
 * the documented Next.js + @supabase/ssr happy path.
 */
export async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component — set in middleware/Server Action
          // or Route Handler instead. Safe to ignore here per Supabase docs.
        }
      },
    },
  })
}
