import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // PKCE prevents an auth code intercepted from the URL (e.g. via a leaked
    // referrer or browser extension) from being redeemed without the
    // code_verifier held by the originating tab.  It is a strict upgrade over
    // the default implicit flow for SPA/PWA clients.
    flowType: 'pkce',
  },
})
