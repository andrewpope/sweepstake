import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components / PPR will land in a later phase once we refactor user-
  // dependent surfaces into proper dynamic islands behind <Suspense>. For
  // now Turbopack alone is more than fast enough.
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
}

export default nextConfig
