import { ref, computed, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { suggestExpenseCategory } from 'src/api/ai'
import type { CategoryDetectionResult, CategorySuggestion } from 'src/api/ai'
import { useError } from './useError'

const unavailableMessages: Record<
  Extract<CategoryDetectionResult, { status: 'unavailable' }>['reason'],
  string
> = {
  model_timeout: 'Category detection took too long. Please choose one manually.',
  model_error: "Couldn't suggest a category. Please choose one manually.",
  invalid_model_response: "Couldn't suggest a category. Please choose one manually.",
  no_matching_category: 'No category suggestion found. Please choose one manually.',
}

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
      const result = await suggestExpenseCategory(expenseName, currentPlanId)

      if (currentRequestVersion !== requestVersion) {
        return null
      }

      if (result.status === 'unavailable') {
        lastSuggestion.value = null
        noSuggestionMessage.value = unavailableMessages[result.reason]
        return result
      }

      const suggestion = result.suggestion
      lastSuggestion.value = suggestion

      if (result.status === 'suggested') {
        lowConfidenceSuggestion.value = suggestion
      }

      return result
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

  function reportUnavailable(message: string) {
    lastSuggestion.value = null
    lowConfidenceSuggestion.value = null
    categorizationError.value = null
    noSuggestionMessage.value = message
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
    reportUnavailable,
  }
}
