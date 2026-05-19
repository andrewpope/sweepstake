import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { getRequestHeader, getResponseHeaders } from '@tanstack/react-start/server'
import WebSocket from 'ws'
import type { Database } from './types'
import { supabaseAnonKey, supabaseUrl } from './env'

// Node < 22 has no native WebSocket; supabase-js's realtime client crashes on
// import without one. We don't use realtime server-side, but the client still
// instantiates it. Polyfill from `ws`.
if (typeof globalThis.WebSocket === 'undefined') {
  ;(globalThis as { WebSocket: unknown }).WebSocket = WebSocket
}

/**
 * Supabase client for server functions and route loaders.
 *
 * Cookies are written via `getResponseHeaders().append('Set-Cookie', …)` so
 * multiple Set-Cookie headers accumulate on the response. Both
 * `setResponseHeader('Set-Cookie', …)` and `setCookie(…)` *replace* the
 * Set-Cookie header on each call, which silently drops Supabase's chunked
 * session — only the last `sb-<ref>-auth-token.N` would reach the browser.
 */
export function getServerClient() {
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        const header = getRequestHeader('cookie')
        const parsed = parseCookieHeader(header ?? '')
        return parsed.map((c) => ({ name: c.name, value: c.value ?? '' }))
      },
      setAll(cookiesToSet) {
        const headers = getResponseHeaders()
        for (const { name, value, options } of cookiesToSet) {
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
        }
      },
    },
  })
}
