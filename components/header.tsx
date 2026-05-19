import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { signOutAction } from '@/app/_actions/sign-out'

/**
 * Static shell used as a Suspense fallback by the root layout. Renders the
 * brand mark + an empty right slot so the page paints instantly while the
 * user-aware `<Header />` resolves.
 */
export function HeaderShell({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="page-wrap flex h-14 items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-foreground no-underline"
        >
          <span className="inline-block h-2 w-2 rounded-sm bg-accent" aria-hidden />
          WCS
        </Link>
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </nav>
    </header>
  )
}

export default async function Header() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <HeaderShell
        right={
          <Link href="/login">
            <Button data-testid="header-sign-in" variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <HeaderShell
      right={
        <>
          <span
            data-testid="user-name"
            className="hidden font-mono text-xs uppercase tracking-wider text-muted-foreground sm:inline"
          >
            {user.name}
          </span>
          <form action={signOutAction}>
            <Button data-testid="sign-out" variant="secondary" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </>
      }
    />
  )
}
