import type { CategoryWithStats } from 'src/api/categories'

/**
 * Creates a mock category with stats and optional overrides
 */
export const createMockCategory = (
  overrides: Partial<CategoryWithStats> = {},
): CategoryWithStats => ({
  id: 'cat-1',
  name: 'Food',
  color: '#FF5722',
  icon: 'eva-pricetags-outline',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  templates: [],
  ...overrides,
})

/**
 * Creates multiple mock categories with predefined variety
 */
export const createMockCategories = (count: number = 3): CategoryWithStats[] => {
  const categoryData = [
    { id: 'cat-1', name: 'Food', color: '#FF5722' },
    { id: 'cat-2', name: 'Transport', color: '#2196F3' },
    { id: 'cat-3', name: 'Entertainment', color: '#4CAF50' },
    { id: 'cat-4', name: 'Shopping', color: '#9C27B0' },
    { id: 'cat-5', name: 'Bills', color: '#FF9800' },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockCategory({
      ...(categoryData[i] || {
        id: `cat-${i + 1}`,
        name: `Category ${i + 1}`,
        color: '#000000',
      }),
    }),
  )
}
