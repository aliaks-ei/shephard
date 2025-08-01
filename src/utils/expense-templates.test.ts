import { describe, it, expect } from 'vitest'
import type { ExpenseTemplateWithPermission } from 'src/api'
import {
  getPermissionText,
  getPermissionColor,
  getPermissionIcon,
  filterAndSortTemplates,
} from './expense-templates'

describe('expense-templates utils', () => {
  describe('getPermissionText', () => {
    it('should return "view only" for view permission', () => {
      expect(getPermissionText('view')).toBe('view only')
    })

    it('should return "can edit" for edit permission', () => {
      expect(getPermissionText('edit')).toBe('can edit')
    })

    it('should return "unknown" for invalid permission', () => {
      expect(getPermissionText('invalid')).toBe('unknown')
    })

    it('should return "unknown" for empty string', () => {
      expect(getPermissionText('')).toBe('unknown')
    })
  })

  describe('getPermissionColor', () => {
    it('should return "warning" for view permission', () => {
      expect(getPermissionColor('view')).toBe('warning')
    })

    it('should return "positive" for edit permission', () => {
      expect(getPermissionColor('edit')).toBe('positive')
    })

    it('should return "grey" for invalid permission', () => {
      expect(getPermissionColor('invalid')).toBe('grey')
    })

    it('should return "grey" for empty string', () => {
      expect(getPermissionColor('')).toBe('grey')
    })
  })

  describe('getPermissionIcon', () => {
    it('should return "eva-eye-outline" for view permission', () => {
      expect(getPermissionIcon('view')).toBe('eva-eye-outline')
    })

    it('should return "eva-edit-outline" for edit permission', () => {
      expect(getPermissionIcon('edit')).toBe('eva-edit-outline')
    })

    it('should return "eva-question-mark-outline" for invalid permission', () => {
      expect(getPermissionIcon('invalid')).toBe('eva-question-mark-outline')
    })

    it('should return "eva-question-mark-outline" for empty string', () => {
      expect(getPermissionIcon('')).toBe('eva-question-mark-outline')
    })
  })

  describe('filterAndSortTemplates', () => {
    const mockTemplates: ExpenseTemplateWithPermission[] = [
      {
        id: '1',
        name: 'Groceries',
        duration: 'weekly',
        total: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        currency: 'USD',
        owner_id: 'user1',
        permission_level: 'edit',
      },
      {
        id: '2',
        name: 'Rent Payment',
        duration: 'monthly',
        total: 1200,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        currency: 'USD',
        owner_id: 'user2',
        permission_level: 'view',
      },
      {
        id: '3',
        name: 'Coffee Shop',
        duration: 'daily',
        total: 5,
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z',
        currency: 'USD',
        owner_id: 'user1',
        permission_level: 'edit',
      },
      {
        id: '4',
        name: 'Utilities',
        duration: 'monthly',
        total: null,
        created_at: null,
        updated_at: null,
        currency: null,
        owner_id: 'user3',
        permission_level: 'view',
      },
    ]

    describe('filtering by search query', () => {
      it('should return all templates when search query is empty', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'name')
        expect(result).toHaveLength(4)
      })

      it('should filter templates by name (case insensitive)', () => {
        const result = filterAndSortTemplates(mockTemplates, 'COFFEE', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Coffee Shop')
      })

      it('should filter templates by duration (case insensitive)', () => {
        const result = filterAndSortTemplates(mockTemplates, 'WEEKLY', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Groceries')
      })

      it('should filter templates by partial name match', () => {
        const result = filterAndSortTemplates(mockTemplates, 'rent', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Rent Payment')
      })

      it('should return empty array when no templates match search query', () => {
        const result = filterAndSortTemplates(mockTemplates, 'nonexistent', 'name')
        expect(result).toHaveLength(0)
      })

      it('should handle templates with null duration when searching', () => {
        const result = filterAndSortTemplates(mockTemplates, 'utilities', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Utilities')
      })
    })

    describe('sorting', () => {
      it('should sort by name (default)', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'name')
        expect(result.map((t) => t.name)).toEqual([
          'Coffee Shop',
          'Groceries',
          'Rent Payment',
          'Utilities',
        ])
      })

      it('should sort by total (descending)', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'total')
        expect(result.map((t) => t.total)).toEqual([1200, 100, 5, null])
      })

      it('should sort by duration (ascending)', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'duration')
        expect(result.map((t) => t.duration)).toEqual(['daily', 'monthly', 'monthly', 'weekly'])
      })

      it('should sort by created_at (descending)', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'created_at')
        expect(result.map((t) => t.created_at)).toEqual([
          '2024-02-01T00:00:00Z',
          '2024-01-15T00:00:00Z',
          '2024-01-01T00:00:00Z',
          null,
        ])
      })

      it('should handle null values in sorting', () => {
        const templatesWithNulls: ExpenseTemplateWithPermission[] = [
          {
            id: '1',
            name: '',
            duration: '',
            total: null,
            created_at: null,
            updated_at: null,
            currency: null,
            owner_id: 'user1',
            permission_level: 'edit',
          },
          {
            id: '2',
            name: 'Valid Name',
            duration: 'monthly',
            total: 100,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            currency: 'USD',
            owner_id: 'user2',
            permission_level: 'view',
          },
        ]

        const resultByName = filterAndSortTemplates(templatesWithNulls, '', 'name')
        expect(resultByName[0]?.name).toBe('')
        expect(resultByName[1]?.name).toBe('Valid Name')

        const resultByTotal = filterAndSortTemplates(templatesWithNulls, '', 'total')
        expect(resultByTotal[0]?.total).toBe(100)
        expect(resultByTotal[1]?.total).toBe(null)
      })

      it('should fall back to name sorting for unknown sort field', () => {
        const result = filterAndSortTemplates(mockTemplates, '', 'unknown_field')
        expect(result.map((t) => t.name)).toEqual([
          'Coffee Shop',
          'Groceries',
          'Rent Payment',
          'Utilities',
        ])
      })
    })

    describe('combined filtering and sorting', () => {
      it('should filter and sort templates correctly', () => {
        const templatesWithDuplicates: ExpenseTemplateWithPermission[] = [
          ...mockTemplates,
          {
            id: '5',
            name: 'Another Coffee',
            duration: 'daily',
            total: 8,
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
            currency: 'USD',
            owner_id: 'user4',
            permission_level: 'edit',
          },
        ]

        const result = filterAndSortTemplates(templatesWithDuplicates, 'coffee', 'total')
        expect(result).toHaveLength(2)
        expect(result[0]?.name).toBe('Another Coffee')
        expect(result[1]?.name).toBe('Coffee Shop')
      })
    })

    it('should not mutate original array', () => {
      const originalTemplates = [...mockTemplates]
      filterAndSortTemplates(mockTemplates, 'coffee', 'total')
      expect(mockTemplates).toEqual(originalTemplates)
    })
  })
})
