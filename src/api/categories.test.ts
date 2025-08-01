import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategory,
  type ExpenseCategoryInsert,
  type ExpenseCategoryUpdate,
} from './categories'

const createPostgrestError = (message: string, code = '23505'): PostgrestError =>
  ({
    message,
    details: '',
    hint: '',
    code,
  }) as PostgrestError

const mockExpenseCategory: ExpenseCategory = {
  id: 'category-1',
  name: 'Test Category',
  color: '#FF0000',
  owner_id: 'user-1',
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
}

const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
})

describe('getExpenseCategories', () => {
  it('should return categories ordered by name', async () => {
    const categories = [
      { ...mockExpenseCategory, name: 'Category B' },
      { ...mockExpenseCategory, name: 'Category A' },
    ]

    const mockOrder = vi.fn().mockResolvedValue({
      data: categories,
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseCategories('user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_categories')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'user-1')
    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual(categories)
  })

  it('should return empty array when no categories found', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseCategories('user-1')

    expect(result).toEqual([])
  })

  it('should throw error when query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch categories')
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getExpenseCategories('user-1')).rejects.toThrow('Failed to fetch categories')
  })
})

describe('createExpenseCategory', () => {
  it('should create category successfully', async () => {
    const categoryInsert: ExpenseCategoryInsert = {
      name: 'New Category',
      color: '#00FF00',
      owner_id: 'user-1',
    }

    const mockSingle = vi.fn().mockResolvedValue({
      data: mockExpenseCategory,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createExpenseCategory(categoryInsert)

    expect(mockFrom).toHaveBeenCalledWith('expense_categories')
    expect(mockInsert).toHaveBeenCalledWith(categoryInsert)
    expect(result).toEqual(mockExpenseCategory)
  })

  it('should throw DUPLICATE_CATEGORY_NAME error for duplicate name with code 23505', async () => {
    const categoryInsert: ExpenseCategoryInsert = {
      name: 'Duplicate Category',
      color: '#00FF00',
      owner_id: 'user-1',
    }

    const mockError = createPostgrestError('unique_expense_category_name_per_user violation')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseCategory(categoryInsert)).rejects.toThrow('DUPLICATE_CATEGORY_NAME')
  })

  it('should throw DUPLICATE_CATEGORY_NAME error for duplicate name in message', async () => {
    const categoryInsert: ExpenseCategoryInsert = {
      name: 'Duplicate Category',
      color: '#00FF00',
      owner_id: 'user-1',
    }

    const mockError = createPostgrestError(
      'duplicate key value violates unique constraint',
      '42000',
    )
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseCategory(categoryInsert)).rejects.toThrow('DUPLICATE_CATEGORY_NAME')
  })

  it('should throw DUPLICATE_CATEGORY_NAME error for duplicate name in details', async () => {
    const categoryInsert: ExpenseCategoryInsert = {
      name: 'Duplicate Category',
      color: '#00FF00',
      owner_id: 'user-1',
    }

    const mockError = {
      ...createPostgrestError('Some error', '42000'),
      details: 'unique_expense_category_name_per_user constraint violated',
    }
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseCategory(categoryInsert)).rejects.toThrow('DUPLICATE_CATEGORY_NAME')
  })

  it('should throw original error for non-duplicate errors', async () => {
    const categoryInsert: ExpenseCategoryInsert = {
      name: 'Category',
      color: '#00FF00',
      owner_id: 'user-1',
    }

    const mockError = createPostgrestError('Some other error', '42000')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseCategory(categoryInsert)).rejects.toThrow('Some other error')
  })
})

describe('updateExpenseCategory', () => {
  it('should update category successfully', async () => {
    const updates: ExpenseCategoryUpdate = {
      name: 'Updated Category',
      color: '#0000FF',
    }

    const updatedCategory = { ...mockExpenseCategory, ...updates }
    const mockSingle = vi.fn().mockResolvedValue({
      data: updatedCategory,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await updateExpenseCategory('category-1', updates)

    expect(mockFrom).toHaveBeenCalledWith('expense_categories')
    expect(mockUpdate).toHaveBeenCalledWith(updates)
    expect(mockEq).toHaveBeenCalledWith('id', 'category-1')
    expect(result).toEqual(updatedCategory)
  })

  it('should throw DUPLICATE_CATEGORY_NAME error for duplicate name', async () => {
    const updates: ExpenseCategoryUpdate = { name: 'Duplicate Name' }
    const mockError = createPostgrestError('unique_expense_category_name_per_user violation')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(updateExpenseCategory('category-1', updates)).rejects.toThrow(
      'DUPLICATE_CATEGORY_NAME',
    )
  })

  it('should throw original error for non-duplicate errors', async () => {
    const updates: ExpenseCategoryUpdate = { name: 'Updated Name' }
    const mockError = createPostgrestError('Some other error', '42000')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(updateExpenseCategory('category-1', updates)).rejects.toThrow('Some other error')
  })
})

describe('deleteExpenseCategory', () => {
  it('should delete category successfully', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await deleteExpenseCategory('category-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_categories')
    expect(mockEq).toHaveBeenCalledWith('id', 'category-1')
  })

  it('should throw error when delete fails', async () => {
    const mockError = createPostgrestError('Failed to delete category')
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(deleteExpenseCategory('category-1')).rejects.toThrow('Failed to delete category')
  })
})
