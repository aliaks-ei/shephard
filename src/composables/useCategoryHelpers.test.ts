import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useCategoryHelpers } from './useCategoryHelpers'
import { useCategoriesStore } from 'src/stores/categories'

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
})

describe('useCategoryHelpers', () => {
  describe('getCategoryName', () => {
    it('returns category name when category exists', () => {
      const categoriesStore = useCategoriesStore()
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      categoriesStore.getCategoryById = vi.fn(() => mockCategory)

      const { getCategoryName } = useCategoryHelpers()
      const result = getCategoryName('cat-1')

      expect(result).toBe('Food')
      expect(categoriesStore.getCategoryById).toHaveBeenCalledWith('cat-1')
    })

    it('returns Unknown when category does not exist', () => {
      const categoriesStore = useCategoriesStore()
      categoriesStore.getCategoryById = vi.fn(() => undefined)

      const { getCategoryName } = useCategoryHelpers()
      const result = getCategoryName('non-existent')

      expect(result).toBe('Unknown')
    })
  })

  describe('getCategoryColor', () => {
    it('returns category color when category exists', () => {
      const categoriesStore = useCategoriesStore()
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      categoriesStore.getCategoryById = vi.fn(() => mockCategory)

      const { getCategoryColor } = useCategoryHelpers()
      const result = getCategoryColor('cat-1')

      expect(result).toBe('#FF5733')
    })

    it('returns default color when category does not exist', () => {
      const categoriesStore = useCategoriesStore()
      categoriesStore.getCategoryById = vi.fn(() => undefined)

      const { getCategoryColor } = useCategoryHelpers()
      const result = getCategoryColor('non-existent')

      expect(result).toBe('#666')
    })
  })

  describe('getCategoryIcon', () => {
    it('returns category icon when category exists', () => {
      const categoriesStore = useCategoriesStore()
      const mockCategory = {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        templates: [],
      }

      categoriesStore.getCategoryById = vi.fn(() => mockCategory)

      const { getCategoryIcon } = useCategoryHelpers()
      const result = getCategoryIcon('cat-1')

      expect(result).toBe('eva-shopping-bag-outline')
    })

    it('returns default icon when category does not exist', () => {
      const categoriesStore = useCategoriesStore()
      categoriesStore.getCategoryById = vi.fn(() => undefined)

      const { getCategoryIcon } = useCategoryHelpers()
      const result = getCategoryIcon('non-existent')

      expect(result).toBe('eva-folder-outline')
    })
  })
})
