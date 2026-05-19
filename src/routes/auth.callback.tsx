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
      return { ok: false as const, next: data.next, error: 'missing_code' as const }
    }
    const supabase = getServerClient()
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(data.code)
      if (error) {
        return { ok: false as const, next: data.next, error: error.message }
      }
      return { ok: true as const, next: data.next }
    } catch (err) {
      return {
        ok: false as const,
        next: data.next,
        error: err instanceof Error ? err.message : 'unknown_error',
      }
    }
  })

type CallbackData = { kind: 'error'; error: string; provider_error?: string }

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    next: typeof search.next === 'string' ? search.next : '/',
    error: typeof search.error === 'string' ? search.error : undefined,
    error_description:
      typeof search.error_description === 'string' ? search.error_description : undefined,
  }),
  loaderDeps: ({ search }) => ({
    code: search.code,
    next: search.next,
    providerError: search.error_description ?? search.error,
  }),
  loader: async ({ deps }): Promise<CallbackData> => {
    if (deps.providerError) {
      return { kind: 'error', error: 'provider_error', provider_error: deps.providerError }
    }
    if (!deps.code) {
      return { kind: 'error', error: 'missing_code' }
    }
    const result = await exchangeCode({ data: { code: deps.code, next: deps.next } })
    if (!result.ok) {
      return { kind: 'error', error: result.error }
    }
    throw redirect({ to: result.next })
  },
  component: CallbackErrorPage,
})

function CallbackErrorPage() {
  const data = Route.useLoaderData()
  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-destructive">
          Sign-in failed
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Something went wrong on the callback.
        </h1>
        <div className="mt-6 rounded-[4px] border border-border bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            error
          </p>
          <p className="mt-1 break-all font-mono text-sm text-foreground">{data.error}</p>
          {data.provider_error && (
            <>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                provider message
              </p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {data.provider_error}
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <a className="text-accent underline" href="/login">
            Try signing in again →
          </a>
        </p>
      </div>
    </main>
  )
}
