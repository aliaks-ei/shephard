import { describe, it, expect } from 'vitest'
import {
  CURRENCY_SYMBOLS,
  CURRENCY_LOCALES,
  getCurrencySymbol,
  formatCurrency,
  isValidCurrencyCode,
  getCurrencyDisplayName,
} from './currency'

describe('currency utilities', () => {
  describe('CURRENCY_SYMBOLS', () => {
    it('should have correct symbols for all currencies', () => {
      expect(CURRENCY_SYMBOLS.EUR).toBe('€')
      expect(CURRENCY_SYMBOLS.USD).toBe('$')
      expect(CURRENCY_SYMBOLS.GBP).toBe('£')
    })
  })

  describe('CURRENCY_LOCALES', () => {
    it('should have correct locales for all currencies', () => {
      expect(CURRENCY_LOCALES.EUR).toBe('de-DE')
      expect(CURRENCY_LOCALES.USD).toBe('en-US')
      expect(CURRENCY_LOCALES.GBP).toBe('en-GB')
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('should return correct symbol for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£')
    })
  })

  describe('formatCurrency', () => {
    it('should format EUR amounts correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1.234,56')
      expect(formatCurrency(0, 'EUR')).toBe('€0.00')
      expect(formatCurrency(1000, 'EUR')).toBe('€1.000,00')
    })

    it('should format USD amounts correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
    })

    it('should format GBP amounts correctly', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56')
      expect(formatCurrency(0, 'GBP')).toBe('£0.00')
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00')
    })

    it('should handle null amounts', () => {
      expect(formatCurrency(null, 'EUR')).toBe('€0.00')
      expect(formatCurrency(null, 'USD')).toBe('$0.00')
      expect(formatCurrency(null, 'GBP')).toBe('£0.00')
    })

    it('should handle undefined amounts', () => {
      expect(formatCurrency(undefined, 'EUR')).toBe('€0.00')
      expect(formatCurrency(undefined, 'USD')).toBe('$0.00')
      expect(formatCurrency(undefined, 'GBP')).toBe('£0.00')
    })

    it('should handle decimal amounts', () => {
      expect(formatCurrency(0.5, 'USD')).toBe('$0.50')
      expect(formatCurrency(0.01, 'EUR')).toBe('€0,01')
      expect(formatCurrency(0.99, 'GBP')).toBe('£0.99')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00')
      expect(formatCurrency(999999.99, 'EUR')).toBe('€999.999,99')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100, 'USD')).toBe('$-100.00')
      expect(formatCurrency(-1234.56, 'EUR')).toBe('€-1.234,56')
    })
  })

  describe('isValidCurrencyCode', () => {
    it('should return true for valid currency codes', () => {
      expect(isValidCurrencyCode('EUR')).toBe(true)
      expect(isValidCurrencyCode('USD')).toBe(true)
      expect(isValidCurrencyCode('GBP')).toBe(true)
    })

    it('should return false for invalid currency codes', () => {
      expect(isValidCurrencyCode('CAD')).toBe(false)
      expect(isValidCurrencyCode('JPY')).toBe(false)
      expect(isValidCurrencyCode('invalid')).toBe(false)
      expect(isValidCurrencyCode('')).toBe(false)
      expect(isValidCurrencyCode('eur')).toBe(false)
    })

    it('should provide type narrowing for valid codes', () => {
      const code = 'EUR' as string
      if (isValidCurrencyCode(code)) {
        const symbol: string = getCurrencySymbol(code)
        expect(symbol).toBe('€')
      }
    })
  })

  describe('getCurrencyDisplayName', () => {
    it('should return correct display names', () => {
      expect(getCurrencyDisplayName('EUR')).toBe('Euro')
      expect(getCurrencyDisplayName('USD')).toBe('US Dollar')
      expect(getCurrencyDisplayName('GBP')).toBe('British Pound')
    })
  })
})
