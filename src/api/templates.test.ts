import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
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

    const mockOwnedOrder = vi.fn().mockResolvedValue({
      data: [ownedTemplate],
      error: null,
    })
    const mockOwnedEq = vi.fn().mockReturnValue({ order: mockOwnedOrder })
    const mockOwnedSelect = vi.fn().mockReturnValue({ eq: mockOwnedEq })

    const mockSharedEq = vi.fn().mockResolvedValue({
      data: [{ permission_level: 'view', expense_templates: sharedTemplate }],
      error: null,
    })
    const mockSharedSelect = vi.fn().mockReturnValue({ eq: mockSharedEq })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockOwnedSelect })
      .mockReturnValueOnce({ select: mockSharedSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseTemplates('user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockOwnedSelect).toHaveBeenCalledWith(`
      *,
      template_shares!left(id)
    `)
    expect(mockOwnedEq).toHaveBeenCalledWith('owner_id', 'user-1')
    expect(mockSharedSelect).toHaveBeenCalledWith(`
      permission_level,
      expense_templates (*)
    `)
    expect(mockSharedEq).toHaveBeenCalledWith('shared_with_user_id', 'user-1')

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
    const mockOwnedOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOwnedEq = vi.fn().mockReturnValue({ order: mockOwnedOrder })
    const mockOwnedSelect = vi.fn().mockReturnValue({ eq: mockOwnedEq })

    const mockSharedEq = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockSharedSelect = vi.fn().mockReturnValue({ eq: mockSharedEq })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockOwnedSelect })
      .mockReturnValueOnce({ select: mockSharedSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseTemplates('user-1')

    expect(result).toEqual([])
  })

  it('should throw error when owned templates query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch owned templates')
    const mockOwnedOrder = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockOwnedEq = vi.fn().mockReturnValue({ order: mockOwnedOrder })
    const mockOwnedSelect = vi.fn().mockReturnValue({ eq: mockOwnedEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockOwnedSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getExpenseTemplates('user-1')).rejects.toThrow('Failed to fetch owned templates')
  })

  it('should throw error when shared templates query fails', async () => {
    const mockOwnedOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOwnedEq = vi.fn().mockReturnValue({ order: mockOwnedOrder })
    const mockOwnedSelect = vi.fn().mockReturnValue({ eq: mockOwnedEq })

    const mockError = createPostgrestError('Failed to fetch shared templates')
    const mockSharedEq = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockSharedSelect = vi.fn().mockReturnValue({ eq: mockSharedEq })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockOwnedSelect })
      .mockReturnValueOnce({ select: mockSharedSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getExpenseTemplates('user-1')).rejects.toThrow('Failed to fetch shared templates')
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
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpenseTemplate(templateInsert)).rejects.toThrow('DUPLICATE_TEMPLATE_NAME')
  })

  it('should throw original error for non-duplicate errors', async () => {
    const templateInsert: ExpenseTemplateInsert = {
      name: 'Template',
      duration: 'monthly',
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

    await expect(createExpenseTemplate(templateInsert)).rejects.toThrow('Some other error')
  })
})

describe('updateExpenseTemplate', () => {
  it('should update template successfully', async () => {
    const updates: ExpenseTemplateUpdate = {
      name: 'Updated Template',
      duration: 'monthly',
    }

    const updatedTemplate = { ...mockExpenseTemplate, ...updates }
    const mockSingle = vi.fn().mockResolvedValue({
      data: updatedTemplate,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await updateExpenseTemplate('template-1', updates)

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockUpdate).toHaveBeenCalledWith(updates)
    expect(mockEq).toHaveBeenCalledWith('id', 'template-1')
    expect(result).toEqual(updatedTemplate)
  })

  it('should throw DUPLICATE_TEMPLATE_NAME error for duplicate name', async () => {
    const updates: ExpenseTemplateUpdate = { name: 'Duplicate Name' }
    const mockError = createPostgrestError('unique_template_name_per_user violation')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(updateExpenseTemplate('template-1', updates)).rejects.toThrow(
      'DUPLICATE_TEMPLATE_NAME',
    )
  })
})

describe('deleteExpenseTemplate', () => {
  it('should delete template successfully', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await deleteExpenseTemplate('template-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockEq).toHaveBeenCalledWith('id', 'template-1')
  })

  it('should throw error when delete fails', async () => {
    const mockError = createPostgrestError('Failed to delete template')
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(deleteExpenseTemplate('template-1')).rejects.toThrow('Failed to delete template')
  })
})

describe('getExpenseTemplateWithItems', () => {
  it('should return template with items for owner', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      expense_template_items: [mockExpenseTemplateItem],
    }

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: templateWithItems,
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockSelect).toHaveBeenCalledWith(`
      *,
      expense_template_items!expense_template_items_template_id_fkey (*)
    `)
    expect(mockEq).toHaveBeenCalledWith('id', 'template-1')
    expect(result).toEqual(templateWithItems)
  })

  it('should return template with permission level for shared user', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      owner_id: 'user-2',
      expense_template_items: [mockExpenseTemplateItem],
    }

    const mockTemplateMaybeSingle = vi.fn().mockResolvedValue({
      data: templateWithItems,
      error: null,
    })
    const mockTemplateEq = vi.fn().mockReturnValue({ maybeSingle: mockTemplateMaybeSingle })
    const mockTemplateSelect = vi.fn().mockReturnValue({ eq: mockTemplateEq })

    const mockShareMaybeSingle = vi.fn().mockResolvedValue({
      data: { permission_level: 'view' },
      error: null,
    })
    const mockShareEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareMaybeSingle })
    const mockShareEq1 = vi.fn().mockReturnValue({ eq: mockShareEq2 })
    const mockShareSelect = vi.fn().mockReturnValue({ eq: mockShareEq1 })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockTemplateSelect })
      .mockReturnValueOnce({ select: mockShareSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('expense_templates')
    expect(mockFrom).toHaveBeenCalledWith('template_shares')
    expect(mockShareSelect).toHaveBeenCalledWith('permission_level')
    expect(mockShareEq1).toHaveBeenCalledWith('template_id', 'template-1')
    expect(mockShareEq2).toHaveBeenCalledWith('shared_with_user_id', 'user-1')
    expect(result).toEqual({
      ...templateWithItems,
      permission_level: 'view',
    })
  })

  it('should return null when template not found', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpenseTemplateWithItems('template-1', 'user-1')

    expect(result).toBeNull()
  })

  it('should throw error when template not shared with user', async () => {
    const templateWithItems: ExpenseTemplateWithItems = {
      ...mockExpenseTemplate,
      owner_id: 'user-2',
      expense_template_items: [mockExpenseTemplateItem],
    }

    const mockTemplateMaybeSingle = vi.fn().mockResolvedValue({
      data: templateWithItems,
      error: null,
    })
    const mockTemplateEq = vi.fn().mockReturnValue({ maybeSingle: mockTemplateMaybeSingle })
    const mockTemplateSelect = vi.fn().mockReturnValue({ eq: mockTemplateEq })

    const mockShareMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockShareEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareMaybeSingle })
    const mockShareEq1 = vi.fn().mockReturnValue({ eq: mockShareEq2 })
    const mockShareSelect = vi.fn().mockReturnValue({ eq: mockShareEq1 })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockTemplateSelect })
      .mockReturnValueOnce({ select: mockShareSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getExpenseTemplateWithItems('template-1', 'user-1')).rejects.toThrow(
      'Template not found or access denied',
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
      'Template is already shared with john@example.com',
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
