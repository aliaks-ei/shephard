import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import { getCategories, type Category } from './categories'

const createPostgrestError = (message: string, code = '23505'): PostgrestError =>
  ({
    message,
    details: '',
    hint: '',
    code,
  }) as PostgrestError

const mockCategory: Category = {
  id: 'category-1',
  name: 'Groceries',
  color: '#22c55e',
  icon: 'eva-pricetags-outline',
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
}

const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
})

describe('getCategories', () => {
  it('should return all predefined categories ordered by name', async () => {
    const categories = [
      { ...mockCategory, name: 'Transportation', color: '#6366f1' },
      { ...mockCategory, name: 'Groceries', color: '#22c55e' },
      { ...mockCategory, name: 'Entertainment', color: '#e879f9' },
    ]

    const mockOrder = vi.fn().mockResolvedValue({
      data: categories,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getCategories()

    expect(mockFrom).toHaveBeenCalledWith('categories')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual(categories)
  })

  it('should return empty array when no categories found', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getCategories()

    expect(result).toEqual([])
  })

  it('should throw error when query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch categories')
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getCategories()).rejects.toThrow('Failed to fetch categories')
  })
})
