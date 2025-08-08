import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import { isDuplicateNameError, createDuplicateNameError } from 'src/utils/database'
import {
  getExpenseTemplates,
  createExpenseTemplate,
  updateExpenseTemplate,
  deleteExpenseTemplate,
  getExpenseTemplateWithItems,
  getTemplateSharedUsers,
  createExpenseTemplateItems,
  deleteExpenseTemplateItems,
  shareTemplate,
  unshareTemplate,
  updateSharePermission,
  type ExpenseTemplate,
  type ExpenseTemplateInsert,
  type ExpenseTemplateUpdate,
  type ExpenseTemplateWithItems,
  type ExpenseTemplateItem,
  type ExpenseTemplateItemInsert,
} from './templates'

vi.mock('src/utils/database', () => ({
  isDuplicateNameError: vi.fn(),
  createDuplicateNameError: vi.fn(),
}))

const createPostgrestError = (message: string, code = '23505'): PostgrestError =>
  ({
    message,
    details: '',
    hint: '',
    code,
  }) as PostgrestError

const mockExpenseTemplate: ExpenseTemplate = {
  id: 'template-1',
  name: 'Test Template',
  owner_id: 'user-1',
  currency: 'EUR',
  duration: 'monthly',
  total: 100,
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
}

const mockExpenseTemplateItem: ExpenseTemplateItem = {
  id: 'item-1',
  template_id: 'template-1',
  name: 'Test Item',
  category_id: 'category-1',
  amount: 100,
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
}

const mockSupabase = vi.mocked(supabase, true)
const mockFrom = vi.fn()
const mockIsDuplicateNameError = vi.mocked(isDuplicateNameError)
const mockCreateDuplicateNameError = vi.mocked(createDuplicateNameError)

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
  mockSupabase.from = mockFrom
})

describe('getExpenseTemplates', () => {
  it('should return owned and shared templates combined and sorted', async () => {
    const ownedTemplate = {
      ...mockExpenseTemplate,
      template_shares: [{ id: 'share-1' }],
    }
    const sharedTemplate = {
      ...mockExpenseTemplate,
      id: 'template-2',
      name: 'Shared Template',
      owner_id: 'user-2',
    }

    // Mock the first query for owned templates
    const mockOwnedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [ownedTemplate],
        error: null,
      }),
    }

    // Mock the second query for shared templates
    const mockSharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({
        data: [{ permission_level: 'view', expense_templates: sharedTemplate }],
        error: null,
      }),
    }

    mockFrom.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

    const result = await getExpenseTemplates('user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockFrom).toHaveBeenCalledWith('template_shares')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      ...ownedTemplate,
      is_shared: true,
      template_shares: undefined,
    })
    expect(result[1]).toEqual({
      ...sharedTemplate,
      permission_level: 'view',
    })
  })

  it('should return empty array when no templates found', async () => {
    // Mock the first query for owned templates
    const mockOwnedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    // Mock the second query for shared templates
    const mockSharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    mockFrom.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

    const result = await getExpenseTemplates('user-1')

    expect(result).toEqual([])
  })

  it('should throw error when owned templates query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch owned templates')
    const mockOwnedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    }

    mockFrom.mockReturnValue(mockOwnedQuery)

    await expect(getExpenseTemplates('user-1')).rejects.toEqual(mockError)
  })

  it('should throw error when shared templates query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch shared templates')

    // Mock successful owned templates query
    const mockOwnedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    // Mock failed shared templates query
    const mockSharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    }

    mockFrom.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

    await expect(getExpenseTemplates('user-1')).rejects.toEqual(mockError)
  })
})

describe('createExpenseTemplate', () => {
  it('should create template successfully', async () => {
    const templateInsert: ExpenseTemplateInsert = {
      name: 'New Template',
      duration: 'monthly',
      owner_id: 'user-1',
    }

    const mockSingle = vi.fn().mockResolvedValue({
      data: mockExpenseTemplate,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createExpenseTemplate(templateInsert)

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockInsert).toHaveBeenCalledWith(templateInsert)
    expect(result).toEqual(mockExpenseTemplate)
  })

  it('should throw DUPLICATE_TEMPLATE_NAME error for duplicate name', async () => {
    const templateInsert: ExpenseTemplateInsert = {
      name: 'Duplicate Template',
      duration: 'monthly',
      owner_id: 'user-1',
    }

    const mockError = createPostgrestError('unique_template_name_per_user violation')
    const mockDuplicateError = new Error('DUPLICATE_TEMPLATE_NAME')
    mockIsDuplicateNameError.mockReturnValue(true)
    mockCreateDuplicateNameError.mockReturnValue(mockDuplicateError)

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    }

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(createExpenseTemplate(templateInsert)).rejects.toEqual(mockDuplicateError)
    expect(mockIsDuplicateNameError).toHaveBeenCalledWith(
      mockError,
      'unique_template_name_per_user',
    )
    expect(mockCreateDuplicateNameError).toHaveBeenCalledWith('TEMPLATE')
  })

  it('should throw original error for non-duplicate errors', async () => {
    const templateInsert: ExpenseTemplateInsert = {
      name: 'Template',
      duration: 'monthly',
      owner_id: 'user-1',
    }

    const mockError = createPostgrestError('Some other error', '42000')
    mockIsDuplicateNameError.mockReturnValue(false)

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    }

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(createExpenseTemplate(templateInsert)).rejects.toEqual(mockError)
  })
})

describe('updateExpenseTemplate', () => {
  it('should update template successfully', async () => {
    const updates: ExpenseTemplateUpdate = {
      name: 'Updated Template',
      duration: 'monthly',
    }

    const updatedTemplate = { ...mockExpenseTemplate, ...updates }
    const mockQuery = {
      match: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedTemplate,
        error: null,
      }),
    }

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockQuery),
    } as never)

    const result = await updateExpenseTemplate('template-1', updates)

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(result).toEqual(updatedTemplate)
  })

  it('should throw DUPLICATE_TEMPLATE_NAME error for duplicate name', async () => {
    const updates: ExpenseTemplateUpdate = { name: 'Duplicate Name' }
    const mockError = createPostgrestError('unique_template_name_per_user violation')
    const mockDuplicateError = new Error('DUPLICATE_TEMPLATE_NAME')
    mockIsDuplicateNameError.mockReturnValue(true)
    mockCreateDuplicateNameError.mockReturnValue(mockDuplicateError)

    const mockQuery = {
      match: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    }

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(updateExpenseTemplate('template-1', updates)).rejects.toEqual(mockDuplicateError)
  })
})

describe('deleteExpenseTemplate', () => {
  it('should delete template successfully', async () => {
    const mockQuery = {
      match: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await deleteExpenseTemplate('template-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
  })

  it('should throw error when delete fails', async () => {
    const mockError = createPostgrestError('Failed to delete template')
    const mockQuery = {
      match: vi.fn().mockResolvedValue({
        error: mockError,
      }),
    }

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(deleteExpenseTemplate('template-1')).rejects.toEqual(mockError)
  })
})

describe('getExpenseTemplateWithItems', () => {
  it('should return template with items for owner', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      expense_template_items: [mockExpenseTemplateItem],
    }

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: templateWithItems,
        error: null,
      }),
    }

    mockFrom.mockReturnValue(mockQuery)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(result).toEqual(templateWithItems)
  })

  it('should return template with permission level for shared user', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      owner_id: 'user-2',
      expense_template_items: [mockExpenseTemplateItem],
    }

    // Mock template query
    const mockTemplateQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: templateWithItems,
        error: null,
      }),
    }

    // Mock share query
    const mockShareQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { permission_level: 'view' },
        error: null,
      }),
    }

    mockFrom.mockReturnValueOnce(mockTemplateQuery).mockReturnValueOnce(mockShareQuery)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(result).toEqual({
      ...templateWithItems,
      permission_level: 'view',
    })
  })

  it('should return null when template not found', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockFrom.mockReturnValue(mockQuery)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(result).toBeNull()
  })

  it('should throw error when template not shared with user', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      owner_id: 'user-2',
      expense_template_items: [mockExpenseTemplateItem],
    }

    // Mock template query
    const mockTemplateQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: templateWithItems,
        error: null,
      }),
    }

    // Mock share query - no share found
    const mockShareQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockFrom.mockReturnValueOnce(mockTemplateQuery).mockReturnValueOnce(mockShareQuery)

    await expect(getExpenseTemplateWithItems('template-1', 'user-1')).rejects.toThrow(
      'template not found or access denied',
    )
  })
})

describe('getTemplateSharedUsers', () => {
  it('should return shared users with details', async () => {
    const shares = [
      {
        shared_with_user_id: 'user-2',
        permission_level: 'view',
        created_at: '2023-01-01T12:00:00Z',
      },
    ]
    const users = [
      {
        id: 'user-2',
        name: 'John Doe',
        email: 'john@example.com',
      },
    ]

    const mockSharesOrder = vi.fn().mockResolvedValue({
      data: shares,
      error: null,
    })
    const mockSharesEq = vi.fn().mockReturnValue({ order: mockSharesOrder })
    const mockSharesSelect = vi.fn().mockReturnValue({ eq: mockSharesEq })

    const mockUsersIn = vi.fn().mockResolvedValue({
      data: users,
      error: null,
    })
    const mockUsersSelect = vi.fn().mockReturnValue({ in: mockUsersIn })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockSharesSelect })
      .mockReturnValueOnce({ select: mockUsersSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getTemplateSharedUsers('template-1')

    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockFrom).toHaveBeenCalledWith('users')
    expect(mockSharesSelect).toHaveBeenCalledWith(
      'shared_with_user_id, permission_level, created_at',
    )
    expect(mockSharesEq).toHaveBeenCalledWith('template_id', 'template-1')
    expect(mockUsersSelect).toHaveBeenCalledWith('id, name, email')
    expect(mockUsersIn).toHaveBeenCalledWith('id', ['user-2'])

    expect(result).toEqual([
      {
        user_id: 'user-2',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        permission_level: 'view',
        shared_at: '2023-01-01T12:00:00Z',
      },
    ])
  })

  it('should return empty array when no shares exist', async () => {
    const mockSharesOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockSharesEq = vi.fn().mockReturnValue({ order: mockSharesOrder })
    const mockSharesSelect = vi.fn().mockReturnValue({ eq: mockSharesEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSharesSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getTemplateSharedUsers('template-1')

    expect(result).toEqual([])
  })
})

describe('createExpenseTemplateItems', () => {
  it('should create template items successfully', async () => {
    const items: ExpenseTemplateItemInsert[] = [
      {
        template_id: 'template-1',
        name: 'Item 1',
        category_id: 'category-1',
        amount: 100,
      },
    ]

    const mockSelect = vi.fn().mockResolvedValue({
      data: [mockExpenseTemplateItem],
      error: null,
    })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createExpenseTemplateItems(items)

    expect(mockFrom).toHaveBeenCalledWith('expense_template_items')
    expect(mockInsert).toHaveBeenCalledWith(items)
    expect(result).toEqual([mockExpenseTemplateItem])
  })

  it('should throw error when creation fails', async () => {
    const items: ExpenseTemplateItemInsert[] = [
      {
        template_id: 'template-1',
        name: 'Item 1',
        category_id: 'category-1',
        amount: 100,
      },
    ]

    const mockError = createPostgrestError('Failed to create items')
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseTemplateItems(items)).rejects.toThrow('Failed to create items')
  })
})

describe('deleteExpenseTemplateItems', () => {
  it('should delete template items successfully', async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await deleteExpenseTemplateItems(['item-1', 'item-2'])

    expect(mockFrom).toHaveBeenCalledWith('expense_template_items')
    expect(mockIn).toHaveBeenCalledWith('id', ['item-1', 'item-2'])
  })

  it('should throw error when deletion fails', async () => {
    const mockError = createPostgrestError('Failed to delete items')
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(deleteExpenseTemplateItems(['item-1', 'item-2'])).rejects.toThrow(
      'Failed to delete items',
    )
  })
})

describe('shareTemplate', () => {
  it('should share template successfully', async () => {
    const user = { id: 'user-2', email: 'john@example.com' }

    const mockUserMaybeSingle = vi.fn().mockResolvedValue({
      data: user,
      error: null,
    })
    const mockUserEq = vi.fn().mockReturnValue({ maybeSingle: mockUserMaybeSingle })
    const mockUserSelect = vi.fn().mockReturnValue({ eq: mockUserEq })

    const mockShareCheckMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockShareCheckEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareCheckMaybeSingle })
    const mockShareCheckEq1 = vi.fn().mockReturnValue({ eq: mockShareCheckEq2 })
    const mockShareCheckSelect = vi.fn().mockReturnValue({ eq: mockShareCheckEq1 })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockUserSelect })
      .mockReturnValueOnce({ select: mockShareCheckSelect })
      .mockReturnValueOnce({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await shareTemplate('template-1', 'john@example.com', 'view', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('users')
    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockUserSelect).toHaveBeenCalledWith('id, email')
    expect(mockUserEq).toHaveBeenCalledWith('email', 'john@example.com')
    expect(mockInsert).toHaveBeenCalledWith({
      template_id: 'template-1',
      shared_with_user_id: 'user-2',
      shared_by_user_id: 'user-1',
      permission_level: 'view',
    })
  })

  it('should throw error when user not found', async () => {
    const mockUserMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockUserEq = vi.fn().mockReturnValue({ maybeSingle: mockUserMaybeSingle })
    const mockUserSelect = vi.fn().mockReturnValue({ eq: mockUserEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockUserSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(
      shareTemplate('template-1', 'notfound@example.com', 'view', 'user-1'),
    ).rejects.toThrow('User not found: notfound@example.com')
  })

  it('should throw error when template already shared', async () => {
    const user = { id: 'user-2', email: 'john@example.com' }

    const mockUserMaybeSingle = vi.fn().mockResolvedValue({
      data: user,
      error: null,
    })
    const mockUserEq = vi.fn().mockReturnValue({ maybeSingle: mockUserMaybeSingle })
    const mockUserSelect = vi.fn().mockReturnValue({ eq: mockUserEq })

    const mockShareCheckMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'share-1' },
      error: null,
    })
    const mockShareCheckEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareCheckMaybeSingle })
    const mockShareCheckEq1 = vi.fn().mockReturnValue({ eq: mockShareCheckEq2 })
    const mockShareCheckSelect = vi.fn().mockReturnValue({ eq: mockShareCheckEq1 })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockUserSelect })
      .mockReturnValueOnce({ select: mockShareCheckSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(shareTemplate('template-1', 'john@example.com', 'view', 'user-1')).rejects.toThrow(
      'TEMPLATE is already shared with john@example.com',
    )
  })
})

describe('unshareTemplate', () => {
  it('should unshare template successfully', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await unshareTemplate('template-1', 'user-2')

    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockEq1).toHaveBeenCalledWith('template_id', 'template-1')
    expect(mockEq2).toHaveBeenCalledWith('shared_with_user_id', 'user-2')
  })

  it('should throw error when unshare fails', async () => {
    const mockError = createPostgrestError('Failed to unshare template')
    const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(unshareTemplate('template-1', 'user-2')).rejects.toThrow(
      'Failed to unshare template',
    )
  })
})

describe('updateSharePermission', () => {
  it('should update share permission successfully', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await updateSharePermission('template-1', 'user-2', 'edit')

    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockUpdate).toHaveBeenCalledWith({ permission_level: 'edit' })
    expect(mockEq1).toHaveBeenCalledWith('template_id', 'template-1')
    expect(mockEq2).toHaveBeenCalledWith('shared_with_user_id', 'user-2')
  })

  it('should throw error when update fails', async () => {
    const mockError = createPostgrestError('Failed to update permission')
    const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(updateSharePermission('template-1', 'user-2', 'edit')).rejects.toThrow(
      'Failed to update permission',
    )
  })
})
