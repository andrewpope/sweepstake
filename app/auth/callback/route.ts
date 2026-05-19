import { NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  const providerErr = url.searchParams.get('error_description') ?? url.searchParams.get('error')
  if (providerErr) {
    const errUrl = new URL('/login', url.origin)
    errUrl.searchParams.set('error', providerErr)
    return NextResponse.redirect(errUrl)
  }

  if (!code) {
    const errUrl = new URL('/login', url.origin)
    errUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(errUrl)
  }

  const supabase = await getServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const errUrl = new URL('/login', url.origin)
    errUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errUrl)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
