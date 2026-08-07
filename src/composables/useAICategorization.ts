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
  const noSuggestionMessage = ref<string | null>(null)
  let requestVersion = 0

  async function categorizeName(expenseName: string) {
    const currentRequestVersion = ++requestVersion
    categorizationError.value = null
    lowConfidenceSuggestion.value = null
    noSuggestionMessage.value = null

    if (!expenseName || expenseName.trim().length < 3) {
      lastSuggestion.value = null
      isCategorizing.value = false
      return null
    }

    isCategorizing.value = true

    try {
      const currentPlanId = planId?.value ?? undefined
      const suggestion = await suggestExpenseCategory(expenseName, currentPlanId)

      if (currentRequestVersion !== requestVersion) {
        return null
      }

      if (!suggestion) {
        lastSuggestion.value = null
        noSuggestionMessage.value = 'No category suggestion found. Please choose one manually.'
        return null
      }

      lastSuggestion.value = suggestion

      if (suggestion.confidence <= 0.65) {
        lowConfidenceSuggestion.value = suggestion
        return null
      }

      return suggestion
    } catch (error) {
      if (currentRequestVersion !== requestVersion) {
        return null
      }

      categorizationError.value = "Couldn't suggest a category. Please choose one manually."
      handleError('AI.CATEGORIZATION_FAILED', error, { expenseName })
      return null
    } finally {
      if (currentRequestVersion === requestVersion) {
        isCategorizing.value = false
      }
    }
  }

  const debouncedCategorize = useDebounceFn(categorizeName, 300)

  function clearSuggestion() {
    requestVersion += 1
    lastSuggestion.value = null
    lowConfidenceSuggestion.value = null
    categorizationError.value = null
    noSuggestionMessage.value = null
    isCategorizing.value = false
  }

  return {
    isCategorizing: computed(() => isCategorizing.value),
    lastSuggestion: computed(() => lastSuggestion.value),
    lowConfidenceSuggestion: computed(() => lowConfidenceSuggestion.value),
    hasError: computed(() => !!categorizationError.value),
    errorMessage: computed(() => categorizationError.value),
    hasNoSuggestion: computed(() => !!noSuggestionMessage.value),
    noSuggestionMessage: computed(() => noSuggestionMessage.value),
    categorizeName,
    debouncedCategorize,
    clearSuggestion,
  }
}
