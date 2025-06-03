import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNonce } from './useNonce'
import type { NonceResult, NonceData } from 'src/utils/nonce'

vi.mock('src/utils/nonce', () => ({
  generateSecureNonce: vi.fn(),
  createTimestampedNonce: vi.fn(),
  isNonceValid: vi.fn(),
}))

const mockGenerateSecureNonce = vi.mocked(await import('src/utils/nonce')).generateSecureNonce
const mockCreateTimestampedNonce = vi.mocked(await import('src/utils/nonce')).createTimestampedNonce
const mockIsNonceValid = vi.mocked(await import('src/utils/nonce')).isNonceValid

describe('useNonce', () => {
  const mockNonceResult: NonceResult = {
    nonce: 'test-nonce-123',
    hashedNonce: 'test-hashed-nonce-456',
  }

  const mockNonceData: NonceData = {
    ...mockNonceResult,
    createdAt: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const { resetNonce } = useNonce()
    resetNonce()

    mockGenerateSecureNonce.mockResolvedValue(mockNonceResult)
    mockCreateTimestampedNonce.mockReturnValue(mockNonceData)
    mockIsNonceValid.mockReturnValue(true)
  })

  describe('initial state', () => {
    it('should have null currentNonce on first call', () => {
      const { currentNonce } = useNonce()
      expect(currentNonce.value).toBeNull()
    })

    it('should have empty hashedNonce on first call', () => {
      const { hashedNonce } = useNonce()
      expect(hashedNonce.value).toBe('')
    })

    it('should have false isNonceReady on first call', () => {
      const { isNonceReady } = useNonce()
      expect(isNonceReady.value).toBe(false)
    })
  })

  describe('hashedNonce computed property', () => {
    it('should return empty string when currentNonce is null', () => {
      const { hashedNonce, resetNonce } = useNonce()
      resetNonce()
      expect(hashedNonce.value).toBe('')
    })

    it('should return correct hashed nonce when currentNonce has value', async () => {
      const { hashedNonce, generateNonce } = useNonce()
      await generateNonce()
      expect(hashedNonce.value).toBe(mockNonceData.hashedNonce)
    })

    it('should update reactively when currentNonce changes', async () => {
      const { hashedNonce, generateNonce, resetNonce } = useNonce()

      expect(hashedNonce.value).toBe('')

      await generateNonce()
      expect(hashedNonce.value).toBe(mockNonceData.hashedNonce)

      resetNonce()
      expect(hashedNonce.value).toBe('')
    })
  })

  describe('isNonceReady computed property', () => {
    it('should return false when currentNonce is null', () => {
      const { isNonceReady, resetNonce } = useNonce()
      resetNonce()
      expect(isNonceReady.value).toBe(false)
    })

    it('should return false when currentNonce exists but has no hashedNonce', async () => {
      const { isNonceReady, generateNonce } = useNonce()
      const nonceDataWithoutHash = { ...mockNonceData, hashedNonce: '' }
      mockCreateTimestampedNonce.mockReturnValueOnce(nonceDataWithoutHash)

      await generateNonce()
      expect(isNonceReady.value).toBe(false)
    })

    it('should return false when currentNonce exists but is expired', async () => {
      const { isNonceReady, generateNonce } = useNonce()
      mockIsNonceValid.mockReturnValue(false)

      await generateNonce()
      expect(isNonceReady.value).toBe(false)
    })

    it('should return true when currentNonce exists with valid hashedNonce and is not expired', async () => {
      const { isNonceReady, generateNonce } = useNonce()
      mockIsNonceValid.mockReturnValue(true)

      await generateNonce()
      expect(isNonceReady.value).toBe(true)
    })

    it('should update reactively when currentNonce changes', async () => {
      const { isNonceReady, generateNonce, resetNonce } = useNonce()
      mockIsNonceValid.mockReturnValue(true)

      expect(isNonceReady.value).toBe(false)

      await generateNonce()
      expect(isNonceReady.value).toBe(true)

      resetNonce()
      expect(isNonceReady.value).toBe(false)
    })
  })

  describe('generateNonce function', () => {
    it('should call generateSecureNonce utility function', async () => {
      const { generateNonce } = useNonce()
      await generateNonce()
      expect(mockGenerateSecureNonce).toHaveBeenCalledOnce()
    })

    it('should call createTimestampedNonce with result from generateSecureNonce', async () => {
      const { generateNonce } = useNonce()
      await generateNonce()
      expect(mockCreateTimestampedNonce).toHaveBeenCalledWith(mockNonceResult)
    })

    it('should update currentNonce with timestamped nonce data', async () => {
      const { generateNonce, currentNonce } = useNonce()
      await generateNonce()
      expect(currentNonce.value).toEqual(mockNonceData)
    })

    it('should return the generated timestamped nonce data', async () => {
      const { generateNonce } = useNonce()
      const result = await generateNonce()
      expect(result).toEqual(mockNonceData)
    })

    it('should propagate errors from generateSecureNonce', async () => {
      const { generateNonce } = useNonce()
      const error = new Error('Nonce generation failed')
      mockGenerateSecureNonce.mockRejectedValueOnce(error)

      await expect(generateNonce()).rejects.toThrow('Nonce generation failed')
    })

    it('should propagate errors from createTimestampedNonce', async () => {
      const { generateNonce } = useNonce()
      const error = new Error('Timestamp creation failed')
      mockCreateTimestampedNonce.mockImplementationOnce(() => {
        throw error
      })

      await expect(generateNonce()).rejects.toThrow('Timestamp creation failed')
    })
  })

  describe('resetNonce function', () => {
    it('should set currentNonce to null', async () => {
      const { generateNonce, resetNonce, currentNonce } = useNonce()

      await generateNonce()
      expect(currentNonce.value).not.toBeNull()

      resetNonce()
      expect(currentNonce.value).toBeNull()
    })

    it('should update computed properties when called', async () => {
      const { generateNonce, resetNonce, hashedNonce, isNonceReady } = useNonce()

      await generateNonce()
      expect(hashedNonce.value).toBe(mockNonceData.hashedNonce)
      expect(isNonceReady.value).toBe(true)

      resetNonce()
      expect(hashedNonce.value).toBe('')
      expect(isNonceReady.value).toBe(false)
    })
  })

  describe('ensureFreshNonce function', () => {
    it('should generate new nonce when no current nonce exists', async () => {
      const { ensureFreshNonce, resetNonce } = useNonce()
      resetNonce()

      const result = await ensureFreshNonce()

      expect(mockGenerateSecureNonce).toHaveBeenCalledOnce()
      expect(result).toEqual(mockNonceData)
    })

    it('should return existing nonce when current nonce is valid', async () => {
      const { ensureFreshNonce, generateNonce } = useNonce()
      mockIsNonceValid.mockReturnValue(true)

      await generateNonce()
      vi.clearAllMocks()

      const result = await ensureFreshNonce()

      expect(mockGenerateSecureNonce).not.toHaveBeenCalled()
      expect(result).toEqual(mockNonceData)
    })

    it('should generate new nonce when current nonce is expired', async () => {
      const { ensureFreshNonce, generateNonce } = useNonce()

      await generateNonce()
      mockIsNonceValid.mockReturnValue(false)
      vi.clearAllMocks()

      const result = await ensureFreshNonce()

      expect(mockGenerateSecureNonce).toHaveBeenCalledOnce()
      expect(result).toEqual(mockNonceData)
    })

    it('should propagate errors from generateNonce', async () => {
      const { ensureFreshNonce, resetNonce } = useNonce()
      resetNonce()

      const error = new Error('Generation failed')
      mockGenerateSecureNonce.mockRejectedValueOnce(error)

      await expect(ensureFreshNonce()).rejects.toThrow('Generation failed')
    })
  })

  describe('state management', () => {
    it('should share state between multiple instances', async () => {
      const instance1 = useNonce()
      const instance2 = useNonce()

      await instance1.generateNonce()

      expect(instance2.currentNonce.value).toEqual(mockNonceData)
      expect(instance2.hashedNonce.value).toBe(mockNonceData.hashedNonce)
      expect(instance2.isNonceReady.value).toBe(true)
    })

    it('should reflect changes across instances', async () => {
      const instance1 = useNonce()
      const instance2 = useNonce()

      await instance1.generateNonce()
      expect(instance2.currentNonce.value).not.toBeNull()

      instance1.resetNonce()
      expect(instance2.currentNonce.value).toBeNull()
    })
  })

  describe('realistic workflows', () => {
    it('should handle generate, verify ready, then reset workflow', async () => {
      const { generateNonce, isNonceReady, resetNonce } = useNonce()

      expect(isNonceReady.value).toBe(false)

      await generateNonce()
      expect(isNonceReady.value).toBe(true)

      resetNonce()
      expect(isNonceReady.value).toBe(false)
    })

    it('should regenerate expired nonce with ensureFreshNonce', async () => {
      const { generateNonce, ensureFreshNonce } = useNonce()

      await generateNonce()

      mockIsNonceValid.mockReturnValue(false)
      const newMockData = { ...mockNonceData, nonce: 'new-nonce' }
      mockCreateTimestampedNonce.mockReturnValue(newMockData)
      vi.clearAllMocks()

      const result = await ensureFreshNonce()

      expect(mockGenerateSecureNonce).toHaveBeenCalledOnce()
      expect(result).toEqual(newMockData)
    })

    it('should return same nonce for multiple consecutive ensureFreshNonce calls when valid', async () => {
      const { generateNonce, ensureFreshNonce } = useNonce()
      mockIsNonceValid.mockReturnValue(true)

      await generateNonce()
      vi.clearAllMocks()

      const result1 = await ensureFreshNonce()
      const result2 = await ensureFreshNonce()
      const result3 = await ensureFreshNonce()

      expect(mockGenerateSecureNonce).not.toHaveBeenCalled()
      expect(result1).toEqual(mockNonceData)
      expect(result2).toEqual(mockNonceData)
      expect(result3).toEqual(mockNonceData)
    })
  })
})
