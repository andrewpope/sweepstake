'use server'

import { redirect } from 'next/navigation'
import { getServerClient } from '@/lib/supabase/server'

export async function signOutAction() {
  const supabase = await getServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
