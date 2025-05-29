import type { User } from "@supabase/supabase-js"

export const getDisplayName = (user: User): string => {
  if (!user) return ''

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name

  if (fullName) return fullName

  const email = user.email || ''
  const atIndex = email.indexOf('@')

  return atIndex > 0 ? email.substring(0, atIndex) : email
}

export const getUserInitial = (email?: string): string => {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}