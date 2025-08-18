import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

import { useCategoriesStore } from './categories'
import { useError } from 'src/composables/useError'
import * as categoriesApi from 'src/api/categories'
import type { ExpenseCategory } from 'src/api/categories'

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/api/categories', () => ({
  getExpenseCategories: vi.fn(),
}))

describe('Categories Store', () => {
  const mockHandleError = vi.fn()
  let categoriesStore: ReturnType<typeof useCategoriesStore>

  const mockCategories: ExpenseCategory[] = [
    {
      id: 'cat-1',
      name: 'Rent/Mortgage',
      color: '#1d4ed8',
      icon: 'eva-pricetags-outline',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      name: 'Groceries',
      color: '#22c55e',
      icon: 'eva-pricetags-outline',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 'cat-3',
      name: 'Entertainment',
      color: '#e879f9',
      icon: 'eva-pricetags-outline',
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    categoriesStore = useCategoriesStore(pinia)
  })

  describe('Initial State', () => {
    it('should initialize with empty categories array', () => {
      expect(categoriesStore.categories).toEqual([])
    })

    it('should initialize with loading state as false', () => {
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should have category count of 0 initially', () => {
      expect(categoriesStore.categoryCount).toBe(0)
    })

    it('should have empty categories map initially', () => {
      expect(categoriesStore.categoriesMap).toEqual(new Map())
    })

    it('should have empty sorted categories initially', () => {
      expect(categoriesStore.sortedCategories).toEqual([])
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      categoriesStore.categories = [...mockCategories]
    })

    it('should return correct category count', () => {
      expect(categoriesStore.categoryCount).toBe(3)
    })

    it('should create categories map with correct key-value pairs', () => {
      const map = categoriesStore.categoriesMap
      expect(map.size).toBe(3)
      expect(map.get('cat-1')).toEqual(mockCategories[0])
      expect(map.get('cat-2')).toEqual(mockCategories[1])
      expect(map.get('cat-3')).toEqual(mockCategories[2])
    })

    it('should return categories sorted alphabetically by name', () => {
      const sorted = categoriesStore.sortedCategories
      expect(sorted[0]?.name).toBe('Entertainment')
      expect(sorted[1]?.name).toBe('Groceries')
      expect(sorted[2]?.name).toBe('Rent/Mortgage')
    })
  })

  describe('loadCategories', () => {
    it('should successfully load predefined categories', async () => {
      vi.mocked(categoriesApi.getExpenseCategories).mockResolvedValue(mockCategories)

      await categoriesStore.loadCategories()

      expect(categoriesApi.getExpenseCategories).toHaveBeenCalledWith()
      expect(categoriesStore.categories).toEqual(mockCategories)
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should set loading state correctly during load', async () => {
      let resolvePromise: (value: ExpenseCategory[]) => void
      const promise = new Promise<ExpenseCategory[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(categoriesApi.getExpenseCategories).mockReturnValue(promise)

      const loadPromise = categoriesStore.loadCategories()
      expect(categoriesStore.isLoading).toBe(true)

      resolvePromise!(mockCategories)
      await loadPromise

      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle load error and call handleError', async () => {
      const error = new Error('Load failed')
      vi.mocked(categoriesApi.getExpenseCategories).mockRejectedValue(error)

      await categoriesStore.loadCategories()

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.LOAD_FAILED', error)
      expect(categoriesStore.isLoading).toBe(false)
    })
  })

  describe('getCategoryById', () => {
    beforeEach(() => {
      categoriesStore.categories = [...mockCategories]
    })

    it('should return category when found', () => {
      const category = categoriesStore.getCategoryById('cat-2')
      expect(category).toEqual(mockCategories[1])
    })

    it('should return undefined when category not found', () => {
      const category = categoriesStore.getCategoryById('non-existent')
      expect(category).toBeUndefined()
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      categoriesStore.categories = [...mockCategories]
      categoriesStore.isLoading = true
    })

    it('should reset categories and loading state', () => {
      categoriesStore.reset()

      expect(categoriesStore.categories).toEqual([])
      expect(categoriesStore.isLoading).toBe(false)
    })
  })

  describe('Store Integration', () => {
    it('should work correctly with load operation', async () => {
      vi.mocked(categoriesApi.getExpenseCategories).mockResolvedValue(mockCategories)

      await categoriesStore.loadCategories()
      expect(categoriesStore.categoryCount).toBe(3)
      expect(categoriesStore.getCategoryById('cat-1')).toEqual(mockCategories[0])
      expect(categoriesStore.sortedCategories[0]?.name).toBe('Entertainment')
    })
  })
})
