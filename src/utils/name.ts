/**
 * Returns the display name for a user
 * @param user - The user object
 * @returns The display name
 */
export const getUserDisplayName = (
  name: string | null | undefined,
  email: string | null | undefined,
): string => {
  if (name) return name
  if (!email) return ''

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
