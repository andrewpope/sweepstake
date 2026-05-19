import { Link, useRouteContext, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase/client'

export default function Header() {
  const { user } = useRouteContext({ from: '__root__' })
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getBrowserClient()
    await supabase.auth.signOut()
    await router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="page-wrap flex h-14 items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-foreground no-underline"
        >
          <span className="inline-block h-2 w-2 rounded-sm bg-accent" aria-hidden />
          WCS
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span
                data-testid="user-name"
                className="hidden font-mono text-xs uppercase tracking-wider text-muted-foreground sm:inline"
              >
                {user.name}
              </span>
              <Button
                data-testid="sign-out"
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button data-testid="header-sign-in" variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
