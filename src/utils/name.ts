export const getUserDisplayName = (
  name: string | null | undefined,
  email: string | null | undefined,
): string => {
  if (name) return name
  if (!email) return ''

  const atIndex = email.indexOf('@')

  return atIndex > 0 ? email.substring(0, atIndex) : email
}

export const getUserInitial = (email?: string): string =>
  email ? email.charAt(0).toUpperCase() : '?'
