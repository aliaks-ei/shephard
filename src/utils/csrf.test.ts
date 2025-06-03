import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateCsrfToken, getCsrfToken, clearCsrfToken } from './csrf'

describe('CSRF Utilities', () => {
  const CSRF_TOKEN_COOKIE = 'csrf_token'

  let documentCookies: string[] = []

  beforeEach(() => {
    documentCookies = []

    Object.defineProperty(document, 'cookie', {
      get: vi.fn(() => documentCookies.join('; ')),
      set: vi.fn((value: string) => {
        if (value.includes('expires=Thu, 01 Jan 1970')) {
          const cookieName = value.split('=')[0]
          documentCookies = documentCookies.filter((cookie) => !cookie.startsWith(cookieName + '='))
          return
        }

        const cookieParts = value.split(';')[0]?.split('=')
        const cookieName = cookieParts?.[0]
        const cookieValue = cookieParts?.[1]

        const existingIndex = documentCookies.findIndex((c) => c.startsWith(cookieName + '='))
        if (existingIndex >= 0) {
          documentCookies[existingIndex] = `${cookieName}=${cookieValue}`
        } else {
          documentCookies.push(`${cookieName}=${cookieValue}`)
        }
      }),
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateCsrfToken', () => {
    it('should generate a non-empty string token', () => {
      const token = generateCsrfToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should store the token in a cookie', () => {
      const token = generateCsrfToken()
      expect(document.cookie).toContain(`${CSRF_TOKEN_COOKIE}=${token}`)
    })

    it('should generate a different token each time', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('getCsrfToken', () => {
    it('should return the token when it exists in cookies', () => {
      const token = 'test-csrf-token'
      documentCookies.push(`${CSRF_TOKEN_COOKIE}=${token}`)

      const result = getCsrfToken()
      expect(result).toBe(token)
    })

    it('should return null when the token does not exist', () => {
      const result = getCsrfToken()
      expect(result).toBeNull()
    })

    it('should find the token among multiple cookies', () => {
      const token = 'test-csrf-token'
      documentCookies.push('other_cookie=some-value')
      documentCookies.push(`${CSRF_TOKEN_COOKIE}=${token}`)
      documentCookies.push('another_cookie=another-value')

      const result = getCsrfToken()
      expect(result).toBe(token)
    })
  })

  describe('clearCsrfToken', () => {
    it('should clear the CSRF token cookie', () => {
      const token = 'test-csrf-token'
      documentCookies.push(`${CSRF_TOKEN_COOKIE}=${token}`)

      expect(getCsrfToken()).toBe(token)

      clearCsrfToken()

      expect(getCsrfToken()).toBeNull()
    })

    it('should not affect other cookies', () => {
      documentCookies.push('other_cookie=some-value')
      documentCookies.push(`${CSRF_TOKEN_COOKIE}=test-token`)

      clearCsrfToken()

      expect(document.cookie).toContain('other_cookie=some-value')
      expect(document.cookie).not.toContain(CSRF_TOKEN_COOKIE)
    })
  })
})
