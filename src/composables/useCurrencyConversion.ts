import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { convertCurrency, type CurrencyConversionResult } from 'src/api/currency'
import type { CurrencyCode } from 'src/utils/currency'

export function useCurrencyConversion() {
  const isConverting = ref(false)
  const conversionResult = ref<CurrencyConversionResult | null>(null)
  const conversionError = ref<string | null>(null)

  const hasConversionResult = computed(() => conversionResult.value !== null)
  const hasConversionError = computed(() => conversionError.value !== null)

  async function performConversion(
    from: CurrencyCode,
    to: CurrencyCode,
    amount: number,
  ): Promise<void> {
    if (!from || !to || !amount || amount <= 0) {
      conversionResult.value = null
      conversionError.value = null
      return
    }

    if (from === to) {
      conversionResult.value = null
      conversionError.value = null
      return
    }

    isConverting.value = true
    conversionError.value = null

    try {
      const result = await convertCurrency(from, to, amount)
      conversionResult.value = result
    } catch (error) {
      console.error('Currency conversion error:', error)
      conversionError.value = error instanceof Error ? error.message : 'Failed to convert currency'
      conversionResult.value = null
    } finally {
      isConverting.value = false
    }
  }

  const debouncedConvert = useDebounceFn(performConversion, 500)

  function convertWithDebounce(from: CurrencyCode, to: CurrencyCode, amount: number): void {
    conversionResult.value = null
    conversionError.value = null

    debouncedConvert(from, to, amount)
  }

  function reset(): void {
    isConverting.value = false
    conversionResult.value = null
    conversionError.value = null
  }

  return {
    // State
    isConverting,
    conversionResult,
    conversionError,
    hasConversionResult,
    hasConversionError,

    // Methods
    performConversion,
    convertWithDebounce,
    reset,
  }
}
