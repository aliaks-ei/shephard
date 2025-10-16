import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertCurrency } from './currency'

const mockInvoke = vi.fn()

vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('currency API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('convertCurrency', () => {
    it('returns immediately when converting same currency', async () => {
      const result = await convertCurrency('EUR', 'EUR', 100)

      expect(result).toEqual({
        from: 'EUR',
        to: 'EUR',
        originalAmount: 100,
        convertedAmount: 100,
        rate: 1,
        timestamp: expect.any(Number),
      })
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('successfully converts currency using Edge Function', async () => {
      const mockResponse = {
        success: true,
        data: {
          from: 'JPY',
          to: 'EUR',
          originalAmount: 1000,
          convertedAmount: 6.23,
          rate: 0.00623,
          timestamp: 1705425600000,
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await convertCurrency('JPY', 'EUR', 1000)

      expect(mockInvoke).toHaveBeenCalledWith('convert-currency', {
        body: {
          from: 'JPY',
          to: 'EUR',
          amount: 1000,
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('throws error when Edge Function returns error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: new Error('API key not configured'),
      })

      await expect(convertCurrency('JPY', 'EUR', 1000)).rejects.toThrow(
        'Currency conversion failed',
      )
    })

    it('throws error when response is invalid', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false },
        error: null,
      } as unknown as { data: unknown; error: null })

      await expect(convertCurrency('JPY', 'EUR', 1000)).rejects.toThrow(
        'Invalid response from currency conversion service',
      )
    })

    it('throws error for missing parameters', async () => {
      await expect(convertCurrency('' as unknown as 'EUR', 'USD', 100)).rejects.toThrow(
        'Missing required parameters',
      )
    })

    it('throws error for zero or negative amount', async () => {
      await expect(convertCurrency('EUR', 'USD', 0)).rejects.toThrow(
        'Amount must be greater than 0',
      )

      await expect(convertCurrency('EUR', 'USD', -50)).rejects.toThrow(
        'Amount must be greater than 0',
      )
    })
  })
})
