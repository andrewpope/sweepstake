function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. See .env.example for the full list; ` +
        `for local dev, copy values from \`supabase start\` output into .env.local.`,
    )
  }
  return value
}

export const supabaseUrl = (): string =>
  required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)

export const supabaseAnonKey = (): string =>
  required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)
