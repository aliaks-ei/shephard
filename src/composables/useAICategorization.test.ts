import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useAICategorization } from './useAICategorization'
import type { CategorySuggestion } from 'src/api/ai'
import * as aiApi from 'src/api/ai'
import * as errorComposable from './useError'

vi.mock('src/api/ai', () => ({
  suggestExpenseCategory: vi.fn(),
}))

vi.mock('./useError', () => ({
  useError: vi.fn(),
}))

const mockSuggestExpenseCategory = vi.mocked(aiApi.suggestExpenseCategory)
const mockHandleError = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(errorComposable.useError).mockReturnValue({
    handleError: mockHandleError,
  })
})

describe('useAICategorization', () => {
  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { isCategorizing, lastSuggestion, lowConfidenceSuggestion, hasError, errorMessage } =
        useAICategorization()

      expect(isCategorizing.value).toBe(false)
      expect(lastSuggestion.value).toBeNull()
      expect(lowConfidenceSuggestion.value).toBeNull()
      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBeNull()
    })
  })

  describe('categorizeName', () => {
    it('should return null and not call API for empty expense name', async () => {
      const { categorizeName } = useAICategorization()

      const result = await categorizeName('')

      expect(result).toBeNull()
      expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()
    })

    it('should return null and not call API for whitespace-only expense name', async () => {
      const { categorizeName } = useAICategorization()

      const result = await categorizeName('   ')

      expect(result).toBeNull()
      expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()
    })

    it('should return null and not call API for expense name shorter than 3 characters', async () => {
      const { categorizeName } = useAICategorization()

      const result = await categorizeName('ab')

      expect(result).toBeNull()
      expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()
    })

    it('should clear lastSuggestion when expense name is too short', async () => {
      const { categorizeName, lastSuggestion } = useAICategorization()

      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Coffee at Starbucks')
      expect(lastSuggestion.value).not.toBeNull()

      await categorizeName('ab')
      expect(lastSuggestion.value).toBeNull()
    })

    it('should set loading state while categorizing', async () => {
      const { categorizeName, isCategorizing } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }

      let resolvePromise: (value: CategorySuggestion) => void
      const promise = new Promise<CategorySuggestion>((resolve) => {
        resolvePromise = resolve
      })
      mockSuggestExpenseCategory.mockReturnValue(promise)

      const categorizationPromise = categorizeName('Coffee')

      await nextTick()
      expect(isCategorizing.value).toBe(true)

      resolvePromise!(mockSuggestion)
      await categorizationPromise

      expect(isCategorizing.value).toBe(false)
    })

    it('should return suggestion for high confidence result', async () => {
      const { categorizeName, lastSuggestion, lowConfidenceSuggestion } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.85,
        reasoning: 'Common food establishment',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      const result = await categorizeName('Coffee at Starbucks')

      expect(result).toEqual(mockSuggestion)
      expect(lastSuggestion.value).toEqual(mockSuggestion)
      expect(lowConfidenceSuggestion.value).toBeNull()
    })

    it('should store low confidence suggestion and return null', async () => {
      const { categorizeName, lastSuggestion, lowConfidenceSuggestion } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '456',
        categoryName: 'Shopping',
        confidence: 0.3,
        reasoning: 'Uncertain categorization',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      const result = await categorizeName('Purchase')

      expect(result).toBeNull()
      expect(lastSuggestion.value).toEqual(mockSuggestion)
      expect(lowConfidenceSuggestion.value).toEqual(mockSuggestion)
    })

    it('should handle exactly 0.5 confidence as low confidence', async () => {
      const { categorizeName, lowConfidenceSuggestion } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '789',
        categoryName: 'Entertainment',
        confidence: 0.5,
        reasoning: 'Border case',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      const result = await categorizeName('Movie ticket')

      expect(result).toBeNull()
      expect(lowConfidenceSuggestion.value).toEqual(mockSuggestion)
    })

    it('should call API with expense name and undefined planId when no planId provided', async () => {
      const { categorizeName } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Coffee')

      expect(mockSuggestExpenseCategory).toHaveBeenCalledWith('Coffee', undefined)
    })

    it('should call API with expense name and planId when planId provided', async () => {
      const planId = ref('plan-123')
      const { categorizeName } = useAICategorization(planId)
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Coffee')

      expect(mockSuggestExpenseCategory).toHaveBeenCalledWith('Coffee', 'plan-123')
    })

    it('should call API with undefined when planId ref is null', async () => {
      const planId = ref<string | null>(null)
      const { categorizeName } = useAICategorization(planId)
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Coffee')

      expect(mockSuggestExpenseCategory).toHaveBeenCalledWith('Coffee', undefined)
    })

    it('should handle API errors and set error state', async () => {
      const { categorizeName, hasError, errorMessage, lastSuggestion } = useAICategorization()
      const apiError = new Error('Network error')
      mockSuggestExpenseCategory.mockRejectedValue(apiError)

      const result = await categorizeName('Coffee')

      expect(result).toBeNull()
      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toBe('Failed to categorize expense')
      expect(lastSuggestion.value).toBeNull()
    })

    it('should call handleError with correct parameters on error', async () => {
      const { categorizeName } = useAICategorization()
      const apiError = new Error('API failure')
      mockSuggestExpenseCategory.mockRejectedValue(apiError)

      await categorizeName('Expense Name')

      expect(mockHandleError).toHaveBeenCalledWith('AI.CATEGORIZATION_FAILED', apiError, {
        expenseName: 'Expense Name',
      })
    })

    it('should clear loading state after error', async () => {
      const { categorizeName, isCategorizing } = useAICategorization()
      mockSuggestExpenseCategory.mockRejectedValue(new Error('API error'))

      await categorizeName('Coffee')

      expect(isCategorizing.value).toBe(false)
    })

    it('should clear error state before new categorization', async () => {
      const { categorizeName, hasError, errorMessage } = useAICategorization()
      mockSuggestExpenseCategory.mockRejectedValue(new Error('First error'))

      await categorizeName('First')
      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toBe('Failed to categorize expense')

      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Second')
      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBeNull()
    })

    it('should clear low confidence suggestion before new categorization', async () => {
      const { categorizeName, lowConfidenceSuggestion } = useAICategorization()

      const lowConfSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.3,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(lowConfSuggestion)
      await categorizeName('First')

      expect(lowConfidenceSuggestion.value).not.toBeNull()

      const highConfSuggestion: CategorySuggestion = {
        categoryId: '456',
        categoryName: 'Transport',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(highConfSuggestion)
      await categorizeName('Second')

      expect(lowConfidenceSuggestion.value).toBeNull()
    })
  })

  describe('debouncedCategorize', () => {
    it('should be a function', () => {
      const { debouncedCategorize } = useAICategorization()

      expect(typeof debouncedCategorize).toBe('function')
    })

    it('should delay execution by 500ms', async () => {
      vi.useFakeTimers()
      const { debouncedCategorize } = useAICategorization()
      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      debouncedCategorize('Coffee')

      expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()

      vi.advanceTimersByTime(499)
      expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      await nextTick()
      expect(mockSuggestExpenseCategory).toHaveBeenCalledWith('Coffee', undefined)

      vi.useRealTimers()
    })
  })

  describe('clearSuggestion', () => {
    it('should reset all state to initial values', async () => {
      const {
        categorizeName,
        clearSuggestion,
        lastSuggestion,
        lowConfidenceSuggestion,
        hasError,
        errorMessage,
        isCategorizing,
      } = useAICategorization()

      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)
      await categorizeName('Coffee')

      expect(lastSuggestion.value).not.toBeNull()

      mockSuggestExpenseCategory.mockRejectedValue(new Error('Error'))
      await categorizeName('Another expense')

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toBe('Failed to categorize expense')

      clearSuggestion()

      expect(lastSuggestion.value).toBeNull()
      expect(lowConfidenceSuggestion.value).toBeNull()
      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBeNull()
      expect(isCategorizing.value).toBe(false)
    })

    it('should clear low confidence suggestion', async () => {
      const { categorizeName, clearSuggestion, lowConfidenceSuggestion } = useAICategorization()

      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.3,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)
      await categorizeName('Coffee')

      expect(lowConfidenceSuggestion.value).not.toBeNull()

      clearSuggestion()

      expect(lowConfidenceSuggestion.value).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('should return computed refs that are readonly', () => {
      const { isCategorizing, lastSuggestion, lowConfidenceSuggestion, hasError, errorMessage } =
        useAICategorization()

      expect(isCategorizing.value).toBeDefined()
      expect(lastSuggestion.value).toBeDefined()
      expect(lowConfidenceSuggestion.value).toBeDefined()
      expect(hasError.value).toBeDefined()
      expect(errorMessage.value).toBeDefined()
    })

    it('should react to state changes', async () => {
      const { categorizeName, isCategorizing, lastSuggestion } = useAICategorization()

      expect(isCategorizing.value).toBe(false)
      expect(lastSuggestion.value).toBeNull()

      const mockSuggestion: CategorySuggestion = {
        categoryId: '123',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'test',
      }
      mockSuggestExpenseCategory.mockResolvedValue(mockSuggestion)

      await categorizeName('Coffee')

      expect(lastSuggestion.value).toEqual(mockSuggestion)
    })
  })
})
