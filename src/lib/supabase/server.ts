import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'
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
 * Wires `@supabase/ssr` to TanStack Start's request/response primitives so the
 * auth session cookie travels round-trip through SSR loaders, server functions
 * and the OAuth callback.
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
        for (const { name, value, options } of cookiesToSet) {
          setResponseHeader('Set-Cookie', serializeCookieHeader(name, value, options))
        }
      },
    },
  })
}
