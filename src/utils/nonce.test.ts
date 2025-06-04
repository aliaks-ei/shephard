import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  generateSecureNonce,
  createTimestampedNonce,
  isNonceValid,
  NONCE_MAX_AGE_MS,
  type NonceResult,
} from './nonce'

describe('nonce utils', () => {
  describe('generateSecureNonce', () => {
    it('should generate a nonce and hashed nonce', async () => {
      const result = await generateSecureNonce()

      expect(result).toHaveProperty('nonce')
      expect(result).toHaveProperty('hashedNonce')
      expect(typeof result.nonce).toBe('string')
      expect(typeof result.hashedNonce).toBe('string')
      expect(result.nonce.length).toBeGreaterThan(0)
      expect(result.hashedNonce.length).toBe(64)
    })
  })

  describe('createTimestampedNonce', () => {
    it('should create a timestamped nonce object', () => {
      vi.useFakeTimers()
      const now = 1234567890
      vi.setSystemTime(now)

      const nonceData: NonceResult = {
        nonce: 'test-nonce',
        hashedNonce: 'test-hashed-nonce',
      }

      const result = createTimestampedNonce(nonceData)

      expect(result).toEqual({
        ...nonceData,
        createdAt: now,
      })

      vi.useRealTimers()
    })
  })

  describe('isNonceValid', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for a nonce within the valid time window', () => {
      const now = 1000000
      vi.setSystemTime(now)

      const createdAt = now - (NONCE_MAX_AGE_MS - 1000)

      expect(isNonceValid(createdAt)).toBe(true)
    })

    it('should return false for an expired nonce', () => {
      const now = 1000000
      vi.setSystemTime(now)

      const createdAt = now - (NONCE_MAX_AGE_MS + 1000)

      expect(isNonceValid(createdAt)).toBe(false)
    })

    it('should return true for a just created nonce', () => {
      const now = 1000000
      vi.setSystemTime(now)

      expect(isNonceValid(now)).toBe(true)
    })

    it('should handle edge case at exact expiration time', () => {
      const now = 1000000
      vi.setSystemTime(now)

      const createdAt = now - NONCE_MAX_AGE_MS

      expect(isNonceValid(createdAt)).toBe(false)
    })
  })
})
