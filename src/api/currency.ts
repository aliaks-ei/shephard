import { supabase } from 'src/lib/supabase/client'
import type { CurrencyCode } from 'src/utils/currency'

export type CurrencyConversionRequest = {
  from: CurrencyCode
  to: CurrencyCode
  amount: number
}

export type CurrencyConversionResult = {
  from: CurrencyCode
  to: CurrencyCode
  originalAmount: number
  convertedAmount: number
  rate: number
  timestamp: number
}

export type CurrencyConversionResponse = {
  success: boolean
  data: CurrencyConversionResult
}

/**
 * Converts an amount from one currency to another using the Supabase Edge Function
 *
 * @param from - Source currency code (e.g., 'JPY')
 * @param to - Target currency code (e.g., 'EUR')
 * @param amount - Amount to convert
 * @returns Conversion result with rate and converted amount
 * @throws Error if conversion fails
 */
export async function convertCurrency(
  from: CurrencyCode,
  to: CurrencyCode,
  amount: number,
): Promise<CurrencyConversionResult> {
  if (!from || !to || amount === undefined || amount === null) {
    throw new Error('Missing required parameters for currency conversion')
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  // If same currency, return immediately (no conversion needed)
  if (from === to) {
    return {
      from,
      to,
      originalAmount: amount,
      convertedAmount: amount,
      rate: 1,
      timestamp: Date.now(),
    }
  }

  const { data, error } = await supabase.functions.invoke<CurrencyConversionResponse>(
    'convert-currency',
    {
      body: {
        from,
        to,
        amount,
      },
    },
  )

  if (error) {
    throw new Error(`Currency conversion failed: ${error.message}`)
  }

  if (!data || !data.success || !data.data) {
    throw new Error('Invalid response from currency conversion service')
  }

  return data.data
}
