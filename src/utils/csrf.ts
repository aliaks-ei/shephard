const CSRF_TOKEN_COOKIE = 'csrf_token'

/**
 * Generates a CSRF token and stores it in a cookie
 * @returns The generated CSRF token
 */
export function generateCsrfToken(): string {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  document.cookie = `${CSRF_TOKEN_COOKIE}=${token}; path=/; SameSite=Strict; secure`

  return token
}

/**
 * Retrieves the CSRF token from cookies
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_TOKEN_COOKIE && value !== undefined) {
      return value
    }
  }
  return null
}

/**
 * Clears the CSRF token cookie
 */
export function clearCsrfToken(): void {
  document.cookie = `${CSRF_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; secure`
}
