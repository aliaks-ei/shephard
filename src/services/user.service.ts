import { supabase } from 'src/lib/supabase/client'
import type { Json, Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

// Use the proper typing from Supabase schema
export type UserPreferences =
  NonNullable<Tables<'users'>['preferences']> extends Json
    ? Partial<{
        darkMode: boolean
        pushNotificationsEnabled: boolean
      }>
    : never

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const user = await getUserById(userId)

  if (!user) {
    return null
  }

  return (user.preferences as UserPreferences) || null
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const user = await getUserById(userId)

  if (user) {
    const updateData: TablesUpdate<'users'> = {
      preferences,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('users').update(updateData).eq('id', userId)

    if (error) throw error
  } else {
    // Create new user
    await createUser(userId, preferences)
  }
}

/**
 * Create a new user
 */
export async function createUser(
  userId: string,
  preferences: UserPreferences = {},
  userData: { name?: string; email?: string } = {},
): Promise<void> {
  // Get user auth data if needed
  if (!userData.name || !userData.email) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const userName =
      userData.name ||
      user.user_metadata?.full_name ||
      (user.email ? user.email.split('@')[0] : 'User')

    const userEmail = userData.email || user.email || ''

    // Use the local variables that are guaranteed to be strings
    const insertData: TablesInsert<'users'> = {
      id: userId,
      name: userName,
      email: userEmail,
      preferences,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('users').insert(insertData)

    if (error) throw error
  } else {
    // userData.name and userData.email are both defined
    const insertData: TablesInsert<'users'> = {
      id: userId,
      name: userData.name,
      email: userData.email,
      preferences,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('users').insert(insertData)

    if (error) throw error
  }
}

/**
 * Save specific preference for user
 */
export async function saveUserPreference(
  userId: string,
  key: string,
  value: boolean | string | number | null,
): Promise<void> {
  const currentPreferences = (await getUserPreferences(userId)) || {}

  await saveUserPreferences(userId, {
    ...currentPreferences,
    [key]: value,
  })
}
