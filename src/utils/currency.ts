export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY'

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
} as const

export const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  JPY: 'ja-JP',
} as const

export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currencyCode] || '$'
}

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

export function formatCurrencyPrivate(currencyCode: CurrencyCode): string {
  return `${getCurrencySymbol(currencyCode)}****`
}

export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return Object.keys(CURRENCY_SYMBOLS).includes(code)
}

export function getCurrencyDisplayName(currencyCode: CurrencyCode): string {
  const names: Record<CurrencyCode, string> = {
    EUR: 'Euro',
    USD: 'US Dollar',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
  }
  return names[currencyCode] || currencyCode
}
