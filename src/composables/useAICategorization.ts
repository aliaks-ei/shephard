import { ref, computed, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { suggestExpenseCategory } from 'src/api/ai'
import type { CategorySuggestion } from 'src/api/ai'
import { useError } from './useError'

export function useAICategorization(planId?: Ref<string | null>) {
  const { handleError } = useError()

  const isCategorizing = ref(false)
  const lastSuggestion = ref<CategorySuggestion | null>(null)
  const lowConfidenceSuggestion = ref<CategorySuggestion | null>(null)
  const categorizationError = ref<string | null>(null)

  async function categorizeName(expenseName: string) {
    categorizationError.value = null
    lowConfidenceSuggestion.value = null

    if (!expenseName || expenseName.trim().length < 3) {
      lastSuggestion.value = null
      isCategorizing.value = false
      return null
    }

    isCategorizing.value = true

    try {
      const currentPlanId = planId?.value ?? undefined
      const suggestion = await suggestExpenseCategory(expenseName, currentPlanId)
      lastSuggestion.value = suggestion

      if (suggestion.confidence <= 0.5) {
        lowConfidenceSuggestion.value = suggestion
        return null
      }

      return suggestion
    } catch (error) {
      categorizationError.value = 'Failed to categorize expense'
      handleError('AI.CATEGORIZATION_FAILED', error, { expenseName })
      return null
    } finally {
      isCategorizing.value = false
    }
  }

  const debouncedCategorize = useDebounceFn(categorizeName, 500)

  function clearSuggestion() {
    lastSuggestion.value = null
    lowConfidenceSuggestion.value = null
    categorizationError.value = null
    isCategorizing.value = false
  }

  return {
    isCategorizing: computed(() => isCategorizing.value),
    lastSuggestion: computed(() => lastSuggestion.value),
    lowConfidenceSuggestion: computed(() => lowConfidenceSuggestion.value),
    hasError: computed(() => !!categorizationError.value),
    errorMessage: computed(() => categorizationError.value),
    categorizeName,
    debouncedCategorize,
    clearSuggestion,
  }
}
