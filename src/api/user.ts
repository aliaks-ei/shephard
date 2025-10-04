import { supabase } from 'src/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Tables, TablesUpdate } from 'src/lib/supabase/types'

export type { User }

export type UserPreferences = Partial<{
  darkMode: boolean
  pushNotificationsEnabled: boolean
  currency: string
}>

export type CompleteUserPreferences = Required<UserPreferences>

export const DEFAULT_PREFERENCES: CompleteUserPreferences = {
  darkMode: false,
  pushNotificationsEnabled: false,
  currency: 'EUR',
} as const

export type UserSearchResult = {
  id: string
  name: string | null
  email: string
}

async function getUserById(userId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await getUserById(userId)

  if (!user?.preferences) return { ...DEFAULT_PREFERENCES }

  return user.preferences as UserPreferences
}

export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const updateData: TablesUpdate<'users'> = {
    preferences,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', userId)

  if (error) throw error
}

export async function searchUsersByEmail(query: string): Promise<UserSearchResult[]> {
  if (!query.trim()) return []

  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: string, args?: unknown) => Promise<{ data: unknown; error: unknown }>
    }
  ).rpc('search_users_for_sharing', {
    q: query.trim(),
  })

  if (error) throw error as Error
  return (data as UserSearchResult[]) || []
}
