import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useCurrencyConversion } from './useCurrencyConversion'
import * as currencyApi from 'src/api/currency'

vi.mock('src/api/currency', () => ({
  convertCurrency: vi.fn(),
}))

describe('useCurrencyConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('performConversion', () => {
    it('converts currency successfully', async () => {
      const mockResult = {
        from: 'JPY' as const,
        to: 'EUR' as const,
        originalAmount: 1000,
        convertedAmount: 6.23,
        rate: 0.00623,
        timestamp: Date.now(),
      }

      vi.mocked(currencyApi.convertCurrency).mockResolvedValue(mockResult)

      const { performConversion, isConverting, conversionResult, hasConversionResult } =
        useCurrencyConversion()

      expect(isConverting.value).toBe(false)
      expect(hasConversionResult.value).toBe(false)

      const promise = performConversion('JPY', 'EUR', 1000)
      expect(isConverting.value).toBe(true)

      await promise

      expect(isConverting.value).toBe(false)
      expect(conversionResult.value).toEqual(mockResult)
      expect(hasConversionResult.value).toBe(true)
      expect(currencyApi.convertCurrency).toHaveBeenCalledWith('JPY', 'EUR', 1000)
    })

    it('handles conversion errors', async () => {
      vi.mocked(currencyApi.convertCurrency).mockRejectedValue(new Error('API key not configured'))

      const { performConversion, conversionError, hasConversionError, conversionResult } =
        useCurrencyConversion()

      await performConversion('JPY', 'EUR', 1000)

      expect(conversionError.value).toBe('API key not configured')
      expect(hasConversionError.value).toBe(true)
      expect(conversionResult.value).toBeNull()
    })

    it('does not convert when currencies are the same', async () => {
      const { performConversion, conversionResult } = useCurrencyConversion()

      await performConversion('EUR', 'EUR', 100)

      expect(conversionResult.value).toBeNull()
      expect(currencyApi.convertCurrency).not.toHaveBeenCalled()
    })

    it('does not convert when amount is zero or negative', async () => {
      const { performConversion, conversionResult } = useCurrencyConversion()

      await performConversion('JPY', 'EUR', 0)
      expect(conversionResult.value).toBeNull()

      await performConversion('JPY', 'EUR', -100)
      expect(conversionResult.value).toBeNull()

      expect(currencyApi.convertCurrency).not.toHaveBeenCalled()
    })
  })

  describe('convertWithDebounce', () => {
    it('debounces conversion calls', async () => {
      const mockResult = {
        from: 'JPY' as const,
        to: 'EUR' as const,
        originalAmount: 1000,
        convertedAmount: 6.23,
        rate: 0.00623,
        timestamp: Date.now(),
      }

      vi.mocked(currencyApi.convertCurrency).mockResolvedValue(mockResult)

      const { convertWithDebounce } = useCurrencyConversion()

      convertWithDebounce('JPY', 'EUR', 100)
      convertWithDebounce('JPY', 'EUR', 500)
      convertWithDebounce('JPY', 'EUR', 1000)

      expect(currencyApi.convertCurrency).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(500)
      await nextTick()

      expect(currencyApi.convertCurrency).toHaveBeenCalledTimes(1)
      expect(currencyApi.convertCurrency).toHaveBeenCalledWith('JPY', 'EUR', 1000)
    })

    it('clears previous results immediately when input changes', () => {
      const { convertWithDebounce, conversionResult, conversionError } = useCurrencyConversion()

      conversionResult.value = {
        from: 'JPY',
        to: 'EUR',
        originalAmount: 100,
        convertedAmount: 0.62,
        rate: 0.0062,
        timestamp: Date.now(),
      }
      conversionError.value = 'Some error'

      convertWithDebounce('JPY', 'EUR', 1000)

      expect(conversionResult.value).toBeNull()
      expect(conversionError.value).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears all conversion state', async () => {
      const mockResult = {
        from: 'JPY' as const,
        to: 'EUR' as const,
        originalAmount: 1000,
        convertedAmount: 6.23,
        rate: 0.00623,
        timestamp: Date.now(),
      }

      vi.mocked(currencyApi.convertCurrency).mockResolvedValue(mockResult)

      const { performConversion, reset, conversionResult, conversionError, isConverting } =
        useCurrencyConversion()

      await performConversion('JPY', 'EUR', 1000)
      expect(conversionResult.value).not.toBeNull()

      reset()

      expect(isConverting.value).toBe(false)
      expect(conversionResult.value).toBeNull()
      expect(conversionError.value).toBeNull()
    })
  })
})
