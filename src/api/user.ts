import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesUpdate, UserPreferences } from 'src/lib/supabase/types'

export async function _getUserById(userId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const user = await _getUserById(userId)

  return user?.preferences ?? null
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
