import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { getCurrentUser } from '@/server/fns/auth'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'World Cup Sweepstake' },
      { name: 'theme-color', content: '#0a0a0a' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function NotFoundPage() {
  const path = typeof window !== 'undefined' ? window.location.href : '(server)'
  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-destructive">
          404 — Not Found
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          No route matches this URL.
        </h1>
        <div className="mt-6 rounded-[4px] border border-border bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            requested URL
          </p>
          <p className="mt-1 break-all font-mono text-sm text-foreground">{path}</p>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <a className="text-accent underline" href="/">
            Back to home →
          </a>
        </p>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        <Header />
        {children}
        <Footer />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
