import type { User } from 'src/api/user'

/**
 * Returns the display name for a user
 * @param user - The user object
 * @returns The display name
 */
export const getDisplayName = (user: User): string => {
  if (!user) return ''

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name

  if (fullName) {
    return fullName
  }

  const email = user.email || ''
  const atIndex = email.indexOf('@')

  return atIndex > 0 ? email.substring(0, atIndex) : email
}

/**
 * Returns the initial of the first part of the email
 * @param email - The email address
 * @returns The initial of the first part of the email
 */
export const getUserInitial = (email?: string): string =>
  email ? email.charAt(0).toUpperCase() : '?'
