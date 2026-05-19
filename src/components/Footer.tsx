export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="page-wrap flex flex-col gap-1 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          &copy; {year} World Cup Sweepstake
        </p>
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">
          Not affiliated with FIFA
        </p>
      </div>
    </footer>
  )
}
