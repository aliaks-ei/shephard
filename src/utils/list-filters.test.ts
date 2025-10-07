import { describe, it, expect } from 'vitest'
import { filterAndSortItems, filterAndSortTemplates, filterAndSortPlans } from './list-filters'

describe('list-filters utils', () => {
  describe('filterAndSortItems', () => {
    const mockItems = [
      {
        id: '1',
        name: 'Apple',
        total: 100,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Banana',
        total: 200,
        created_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '3',
        name: 'Cherry',
        total: 50,
        created_at: '2024-02-01T00:00:00Z',
      },
    ]

    describe('filtering by search query', () => {
      it('should return all items when search query is empty', () => {
        const result = filterAndSortItems(mockItems, '', 'name')
        expect(result).toHaveLength(3)
      })

      it('should filter items by name (case insensitive)', () => {
        const result = filterAndSortItems(mockItems, 'APPLE', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Apple')
      })

      it('should filter items by partial name match', () => {
        const result = filterAndSortItems(mockItems, 'an', 'name')
        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe('Banana')
      })

      it('should return empty array when no items match search query', () => {
        const result = filterAndSortItems(mockItems, 'nonexistent', 'name')
        expect(result).toHaveLength(0)
      })

      it('should filter using custom searchable fields', () => {
        const result = filterAndSortItems(mockItems, '100', 'name', ['name'])
        expect(result).toHaveLength(0)
      })
    })

    describe('sorting', () => {
      it('should sort by name (ascending)', () => {
        const result = filterAndSortItems(mockItems, '', 'name')
        expect(result.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry'])
      })

      it('should sort by total (descending)', () => {
        const result = filterAndSortItems(mockItems, '', 'total')
        expect(result.map((i) => i.total)).toEqual([200, 100, 50])
      })

      it('should sort by created_at (descending)', () => {
        const result = filterAndSortItems(mockItems, '', 'created_at')
        expect(result.map((i) => i.created_at)).toEqual([
          '2024-02-01T00:00:00Z',
          '2024-01-15T00:00:00Z',
          '2024-01-01T00:00:00Z',
        ])
      })

      it('should default to name sorting for unknown sort field', () => {
        const result = filterAndSortItems(mockItems, '', 'unknown_field')
        expect(result.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry'])
      })

      it('should handle null values in sorting', () => {
        const itemsWithNulls = [
          { id: '1', name: 'Item 1', total: null, created_at: null },
          { id: '2', name: 'Item 2', total: 100, created_at: '2024-01-01T00:00:00Z' },
        ]

        const resultByTotal = filterAndSortItems(itemsWithNulls, '', 'total')
        expect(resultByTotal[0]?.total).toBe(100)
        expect(resultByTotal[1]?.total).toBe(null)
      })
    })

    it('should not mutate original array', () => {
      const originalItems = [...mockItems]
      filterAndSortItems(mockItems, 'apple', 'total')
      expect(mockItems).toEqual(originalItems)
    })
  })

  describe('filterAndSortTemplates', () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Weekly Groceries',
        duration: 'weekly',
        total: 100,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Monthly Rent',
        duration: 'monthly',
        total: 1200,
        created_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '3',
        name: 'Daily Coffee',
        duration: 'daily',
        total: 5,
        created_at: '2024-02-01T00:00:00Z',
      },
    ]

    it('should filter by name', () => {
      const result = filterAndSortTemplates(mockTemplates, 'coffee', 'name')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Daily Coffee')
    })

    it('should filter by duration', () => {
      const result = filterAndSortTemplates(mockTemplates, 'weekly', 'name')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Weekly Groceries')
    })

    it('should sort by duration', () => {
      const result = filterAndSortTemplates(mockTemplates, '', 'duration')
      expect(result.map((t) => t.duration)).toEqual(['daily', 'monthly', 'weekly'])
    })

    it('should handle items without duration when filtering', () => {
      type TemplateWithOptionalDuration = {
        id: string
        name: string
        duration?: string
        total: number
        created_at: string
      }

      const templatesWithMissingDuration: TemplateWithOptionalDuration[] = [
        ...mockTemplates,
        {
          id: '4',
          name: 'No Duration',
          total: 50,
          created_at: '2024-01-20T00:00:00Z',
        },
      ]

      const result = filterAndSortTemplates(templatesWithMissingDuration, 'no duration', 'name')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('No Duration')
    })
  })

  describe('filterAndSortPlans', () => {
    const mockPlans = [
      {
        id: '1',
        name: 'Q1 Budget',
        start_date: '2024-01-01',
        total: 5000,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Q2 Budget',
        start_date: '2024-04-01',
        total: 6000,
        created_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '3',
        name: 'Q3 Budget',
        start_date: '2024-07-01',
        total: 5500,
        created_at: '2024-02-01T00:00:00Z',
      },
    ]

    it('should filter plans by name only', () => {
      const result = filterAndSortPlans(mockPlans, 'Q2', 'name')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Q2 Budget')
    })

    it('should sort by start_date (descending)', () => {
      const result = filterAndSortPlans(mockPlans, '', 'start_date')
      expect(result.map((p) => p.start_date)).toEqual(['2024-07-01', '2024-04-01', '2024-01-01'])
    })

    it('should sort by name as default', () => {
      const result = filterAndSortPlans(mockPlans, '', 'name')
      expect(result.map((p) => p.name)).toEqual(['Q1 Budget', 'Q2 Budget', 'Q3 Budget'])
    })

    it('should filter and sort combined', () => {
      const result = filterAndSortPlans(mockPlans, 'budget', 'start_date')
      expect(result).toHaveLength(3)
      expect(result[0]?.name).toBe('Q3 Budget')
    })
  })
})
