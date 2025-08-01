import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

import { useCategoriesStore } from './categories'
import { useUserStore } from './user'
import { useError } from 'src/composables/useError'
import * as categoriesApi from 'src/api/categories'
import type { ExpenseCategory, ExpenseCategoryUpdate } from 'src/api/categories'

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/api/categories', () => ({
  getExpenseCategories: vi.fn(),
  createExpenseCategory: vi.fn(),
  updateExpenseCategory: vi.fn(),
  deleteExpenseCategory: vi.fn(),
}))

vi.mock('./user', () => ({
  useUserStore: vi.fn(),
}))

describe('Categories Store', () => {
  const mockHandleError = vi.fn()
  const mockUserStore = {
    userProfile: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  let categoriesStore: ReturnType<typeof useCategoriesStore>

  const mockCategories: ExpenseCategory[] = [
    {
      id: 'cat-1',
      name: 'Food',
      color: '#FF5722',
      owner_id: 'user-123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      name: 'Transport',
      color: '#2196F3',
      owner_id: 'user-123',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 'cat-3',
      name: 'Entertainment',
      color: '#9C27B0',
      owner_id: 'user-123',
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    vi.mocked(useUserStore).mockReturnValue(
      mockUserStore as unknown as ReturnType<typeof useUserStore>,
    )

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
      expect(sorted[1]?.name).toBe('Food')
      expect(sorted[2]?.name).toBe('Transport')
    })
  })

  describe('loadCategories', () => {
    it('should not load categories when userId is not available', async () => {
      vi.mocked(useUserStore).mockReturnValue({
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)
      categoriesStore = useCategoriesStore(
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
        }),
      )

      await categoriesStore.loadCategories()

      expect(categoriesApi.getExpenseCategories).not.toHaveBeenCalled()
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should successfully load categories', async () => {
      vi.mocked(categoriesApi.getExpenseCategories).mockResolvedValue(mockCategories)

      await categoriesStore.loadCategories()

      expect(categoriesApi.getExpenseCategories).toHaveBeenCalledWith('user-123')
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

  describe('addCategory', () => {
    const newCategoryPayload = { name: 'Health', color: '#4CAF50' }
    const newCategory: ExpenseCategory = {
      id: 'cat-4',
      name: 'Health',
      color: '#4CAF50',
      owner_id: 'user-123',
      created_at: '2023-01-04T00:00:00Z',
      updated_at: '2023-01-04T00:00:00Z',
    }

    it('should return false when userId is not available', async () => {
      vi.mocked(useUserStore).mockReturnValue({
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)
      categoriesStore = useCategoriesStore(
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
        }),
      )

      const result = await categoriesStore.addCategory(newCategoryPayload)

      expect(result).toBe(false)
      expect(categoriesApi.createExpenseCategory).not.toHaveBeenCalled()
    })

    it('should successfully add category', async () => {
      vi.mocked(categoriesApi.createExpenseCategory).mockResolvedValue(newCategory)

      const result = await categoriesStore.addCategory(newCategoryPayload)

      expect(categoriesApi.createExpenseCategory).toHaveBeenCalledWith({
        name: 'Health',
        color: '#4CAF50',
        owner_id: 'user-123',
      })
      expect(categoriesStore.categories).toEqual([newCategory])
      expect(result).toBe(true)
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should set loading state correctly during add', async () => {
      let resolvePromise: (value: ExpenseCategory) => void
      const promise = new Promise<ExpenseCategory>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(categoriesApi.createExpenseCategory).mockReturnValue(promise)

      const addPromise = categoriesStore.addCategory(newCategoryPayload)
      expect(categoriesStore.isLoading).toBe(true)

      resolvePromise!(newCategory)
      await addPromise

      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle duplicate name error', async () => {
      const duplicateError = new Error('DUPLICATE_CATEGORY_NAME')
      duplicateError.name = 'DUPLICATE_CATEGORY_NAME'
      vi.mocked(categoriesApi.createExpenseCategory).mockRejectedValue(duplicateError)

      const result = await categoriesStore.addCategory(newCategoryPayload)

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.DUPLICATE_NAME', duplicateError)
      expect(result).toBe(false)
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle general create error', async () => {
      const error = new Error('Create failed')
      vi.mocked(categoriesApi.createExpenseCategory).mockRejectedValue(error)

      const result = await categoriesStore.addCategory(newCategoryPayload)

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.CREATE_FAILED', error)
      expect(result).toBe(false)
      expect(categoriesStore.isLoading).toBe(false)
    })
  })

  describe('editCategory', () => {
    const categoryId = 'cat-1'
    const updates: ExpenseCategoryUpdate = { name: 'Updated Food', color: '#FF9800' }
    const updatedCategory: ExpenseCategory = {
      ...mockCategories[0]!,
      name: 'Updated Food',
      color: '#FF9800',
      updated_at: '2023-01-05T00:00:00Z',
    }

    beforeEach(() => {
      categoriesStore.categories = [...mockCategories]
    })

    it('should successfully edit category', async () => {
      vi.mocked(categoriesApi.updateExpenseCategory).mockResolvedValue(updatedCategory)

      const result = await categoriesStore.editCategory(categoryId, updates)

      expect(categoriesApi.updateExpenseCategory).toHaveBeenCalledWith(categoryId, updates)
      expect(categoriesStore.categories[0]).toEqual(updatedCategory)
      expect(result).toBe(true)
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle category not found in local state', async () => {
      vi.mocked(categoriesApi.updateExpenseCategory).mockResolvedValue(updatedCategory)

      const result = await categoriesStore.editCategory('non-existent', updates)

      expect(result).toBe(true)
      expect(categoriesStore.categories).toEqual(mockCategories)
    })

    it('should set loading state correctly during edit', async () => {
      let resolvePromise: (value: ExpenseCategory) => void
      const promise = new Promise<ExpenseCategory>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(categoriesApi.updateExpenseCategory).mockReturnValue(promise)

      const editPromise = categoriesStore.editCategory(categoryId, updates)
      expect(categoriesStore.isLoading).toBe(true)

      resolvePromise!(updatedCategory)
      await editPromise

      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle duplicate name error', async () => {
      const duplicateError = new Error('DUPLICATE_CATEGORY_NAME')
      duplicateError.name = 'DUPLICATE_CATEGORY_NAME'
      vi.mocked(categoriesApi.updateExpenseCategory).mockRejectedValue(duplicateError)

      const result = await categoriesStore.editCategory(categoryId, updates)

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.DUPLICATE_NAME', duplicateError, {
        categoryId,
      })
      expect(result).toBe(false)
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle general update error', async () => {
      const error = new Error('Update failed')
      vi.mocked(categoriesApi.updateExpenseCategory).mockRejectedValue(error)

      const result = await categoriesStore.editCategory(categoryId, updates)

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.UPDATE_FAILED', error, {
        categoryId,
      })
      expect(result).toBe(false)
      expect(categoriesStore.isLoading).toBe(false)
    })
  })

  describe('removeCategory', () => {
    const categoryId = 'cat-2'

    beforeEach(() => {
      categoriesStore.categories = [...mockCategories]
    })

    it('should successfully remove category', async () => {
      vi.mocked(categoriesApi.deleteExpenseCategory).mockResolvedValue()

      await categoriesStore.removeCategory(categoryId)

      expect(categoriesApi.deleteExpenseCategory).toHaveBeenCalledWith(categoryId)
      expect(categoriesStore.categories).toHaveLength(2)
      expect(categoriesStore.categories.find((c) => c.id === categoryId)).toBeUndefined()
      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should set loading state correctly during remove', async () => {
      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(categoriesApi.deleteExpenseCategory).mockReturnValue(promise)

      const removePromise = categoriesStore.removeCategory(categoryId)
      expect(categoriesStore.isLoading).toBe(true)

      resolvePromise!()
      await removePromise

      expect(categoriesStore.isLoading).toBe(false)
    })

    it('should handle delete error', async () => {
      const error = new Error('Delete failed')
      vi.mocked(categoriesApi.deleteExpenseCategory).mockRejectedValue(error)

      await categoriesStore.removeCategory(categoryId)

      expect(mockHandleError).toHaveBeenCalledWith('CATEGORIES.DELETE_FAILED', error, {
        categoryId,
      })
      expect(categoriesStore.categories).toEqual(mockCategories)
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
    it('should work correctly with multiple operations', async () => {
      vi.mocked(categoriesApi.getExpenseCategories).mockResolvedValue(mockCategories)
      vi.mocked(categoriesApi.createExpenseCategory).mockResolvedValue({
        id: 'cat-4',
        name: 'New Category',
        color: '#000000',
        owner_id: 'user-123',
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      })
      vi.mocked(categoriesApi.deleteExpenseCategory).mockResolvedValue()

      await categoriesStore.loadCategories()
      expect(categoriesStore.categoryCount).toBe(3)

      await categoriesStore.addCategory({ name: 'New Category', color: '#000000' })
      expect(categoriesStore.categoryCount).toBe(4)

      await categoriesStore.removeCategory('cat-1')
      expect(categoriesStore.categoryCount).toBe(3)
      expect(categoriesStore.getCategoryById('cat-1')).toBeUndefined()
    })
  })
})
