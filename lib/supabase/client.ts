import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { supabaseAnonKey, supabaseUrl } from './env'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
  }
  return browserClient
}
