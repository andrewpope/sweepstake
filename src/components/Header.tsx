import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="page-wrap flex h-14 items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-foreground no-underline"
        >
          <span className="inline-block h-2 w-2 rounded-sm bg-accent" aria-hidden />
          WCS
        </Link>
      </nav>
    </header>
  )
}
