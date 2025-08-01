export type CurrencyCode = 'EUR' | 'USD' | 'GBP'

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
} as const

export const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  EUR: 'de-DE', // German locale for Euro formatting
  USD: 'en-US', // US locale for Dollar formatting
  GBP: 'en-GB', // UK locale for Pound formatting
} as const

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currencyCode] || '$'
}

/**
 * Format amount with proper currency symbol and locale formatting
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: CurrencyCode,
): string {
  if (!amount) return `${getCurrencySymbol(currencyCode)}0.00`

  const locale = CURRENCY_LOCALES[currencyCode]
  const symbol = getCurrencySymbol(currencyCode)

  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formattedAmount}`
}

/**
 * Validate if a string is a valid currency code
 */
export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return Object.keys(CURRENCY_SYMBOLS).includes(code)
}

/**
 * Get currency display name
 */
export function getCurrencyDisplayName(currencyCode: CurrencyCode): string {
  const names: Record<CurrencyCode, string> = {
    EUR: 'Euro',
    USD: 'US Dollar',
    GBP: 'British Pound',
  }
  return names[currencyCode] || currencyCode
}
