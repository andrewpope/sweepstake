import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getServerClient } from '@/lib/supabase/server'

const exchangeCode = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('invalid input')
    }
    const { code, next } = data as { code?: unknown; next?: unknown }
    return {
      code: typeof code === 'string' && code.length > 0 ? code : null,
      next: typeof next === 'string' && next.startsWith('/') ? next : '/',
    }
  })
  .handler(async ({ data }) => {
    if (!data.code) {
      return { ok: false as const, next: data.next }
    }
    const supabase = getServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(data.code)
    return { ok: !error, next: data.next, error: error?.message ?? null }
  })

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    next: typeof search.next === 'string' ? search.next : '/',
    error_description:
      typeof search.error_description === 'string' ? search.error_description : undefined,
  }),
  loaderDeps: ({ search }) => ({ code: search.code, next: search.next }),
  loader: async ({ deps }) => {
    if (!deps.code) {
      throw redirect({ to: '/login', search: { error: 'missing_code' } })
    }
    const result = await exchangeCode({ data: { code: deps.code, next: deps.next } })
    if (!result.ok) {
      throw redirect({ to: '/login', search: { error: result.error ?? 'exchange_failed' } })
    }
    throw redirect({ to: result.next })
  },
  component: () => null,
})
