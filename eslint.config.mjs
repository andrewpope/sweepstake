import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    '.tanstack/**',
    '.output/**',
    'test-results/**',
    'playwright-report/**',
    'next-env.d.ts',
    'lib/supabase/types.ts',
  ]),
])

export default eslintConfig
