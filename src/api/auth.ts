import { supabase } from 'src/lib/supabase/client'
import type {
  Session,
  AuthResponse,
  AuthOtpResponse,
  UserResponse,
  AuthChangeEvent,
} from '@supabase/supabase-js'

export type { Session }

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (data.session) {
    const expiresAt = data.session.expires_at
    const now = Math.floor(Date.now() / 1000)

    if (expiresAt && expiresAt < now) {
      console.warn('Session expired, attempting to refresh...')

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Failed to refresh expired session:', refreshError)
        return null
      }

      return refreshData.session
    }
  }

  return data.session
}

export async function signInWithIdToken(params: {
  provider: string
  token: string
  nonce: string
}): Promise<AuthResponse['data']> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: params.provider,
    token: params.token,
    nonce: params.nonce,
  })

  if (error) throw error
  return data
}

export async function sendOtpToEmail(
  email: string,
  redirectTo: string,
): Promise<AuthOtpResponse['data']> {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) throw error
  return data
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthResponse['data']> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  })

  if (error) throw error
  return data
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function updateUserPreferences(updates: {
  email?: string
  data?: object
}): Promise<UserResponse['data']> {
  const { data, error } = await supabase.auth.updateUser(updates)

  if (error) throw error
  return data
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => Promise<void>,
) {
  supabase.auth.onAuthStateChange(callback)
}
