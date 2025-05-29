import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesUpdate } from 'src/lib/supabase/types'

export type UserPreferences = Partial<{
  darkMode: boolean
  pushNotificationsEnabled: boolean
}>

export type CompleteUserPreferences = Required<UserPreferences>

export const DEFAULT_PREFERENCES: CompleteUserPreferences = {
  darkMode: false,
  pushNotificationsEnabled: false,
} as const

async function getUserById(userId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const user = await getUserById(userId)

  if (!user?.preferences) return null

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
