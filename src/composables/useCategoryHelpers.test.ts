import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useCategoryHelpers } from './useCategoryHelpers'

const mockGetCategoryById = vi.fn()

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: ref([]),
    getCategoryById: mockGetCategoryById,
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

describe('useCategoryHelpers', () => {
  describe('getCategoryName', () => {
    it('returns category name when category exists', () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      mockGetCategoryById.mockReturnValue(mockCategory)

      const { getCategoryName } = useCategoryHelpers()
      const result = getCategoryName('cat-1')

      expect(result).toBe('Food')
      expect(mockGetCategoryById).toHaveBeenCalledWith('cat-1')
    })

    it('returns Unknown when category does not exist', () => {
      mockGetCategoryById.mockReturnValue(undefined)

      const { getCategoryName } = useCategoryHelpers()
      const result = getCategoryName('non-existent')

      expect(result).toBe('Unknown')
    })
  })

  describe('getCategoryColor', () => {
    it('returns category color when category exists', () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      mockGetCategoryById.mockReturnValue(mockCategory)

      const { getCategoryColor } = useCategoryHelpers()
      const result = getCategoryColor('cat-1')

      expect(result).toBe('#FF5733')
    })

    it('returns default color when category does not exist', () => {
      mockGetCategoryById.mockReturnValue(undefined)

      const { getCategoryColor } = useCategoryHelpers()
      const result = getCategoryColor('non-existent')

      expect(result).toBe('#666')
    })
  })

  describe('getCategoryIcon', () => {
    it('returns category icon when category exists', () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      mockGetCategoryById.mockReturnValue(mockCategory)

      const { getCategoryIcon } = useCategoryHelpers()
      const result = getCategoryIcon('cat-1')

      expect(result).toBe('eva-shopping-bag-outline')
    })

    it('returns default icon when category does not exist', () => {
      mockGetCategoryById.mockReturnValue(undefined)

      const { getCategoryIcon } = useCategoryHelpers()
      const result = getCategoryIcon('non-existent')

      expect(result).toBe('eva-folder-outline')
    })
  })
})
