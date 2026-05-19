// Year is hardcoded to keep Footer fully static under Cache Components.
// We'll bump it manually each January; not worth the complexity of accessing
// the current time in a Server Component (`cacheComponents: true` makes this
// an explicit decision).
const CURRENT_YEAR = 2026

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="page-wrap flex flex-col gap-1 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          &copy; {CURRENT_YEAR} World Cup Sweepstake
        </p>
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">
          Not affiliated with FIFA
        </p>
      </div>
    </footer>
  )
}
