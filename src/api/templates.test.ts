import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import { isDuplicateNameError, createDuplicateNameError } from 'src/utils/database'
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateWithItems,
  getTemplateSharedUsers,
  createTemplateItems,
  deleteTemplateItems,
  shareTemplate,
  unshareTemplate,
  updateSharePermission,
  type TemplateInsert,
  type TemplateUpdate,
  type TemplateWithItems,
  type TemplateItemInsert,
} from './templates'
import { createMockTemplate, createMockTemplateItem } from 'test/fixtures'

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

const mockTemplate = createMockTemplate({
  currency: 'EUR',
  duration: 'monthly',
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
})

const mockTemplateItem = createMockTemplateItem({
  name: 'Test Item',
  category_id: 'category-1',
  amount: 100,
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
})

const mockSupabase = vi.mocked(supabase, true)
const mockFrom = vi.fn()
const mockIsDuplicateNameError = vi.mocked(isDuplicateNameError)
const mockCreateDuplicateNameError = vi.mocked(createDuplicateNameError)

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
  mockSupabase.from = mockFrom
})

describe('getTemplates', () => {
  it('should return owned and shared templates combined and sorted', async () => {
    const ownedTemplate = {
      ...mockTemplate,
      template_shares: [{ id: 'share-1' }],
    }
    const sharedTemplate = {
      ...mockTemplate,
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
        data: [{ permission_level: 'view', templates: sharedTemplate }],
        error: null,
      }),
    }

    mockFrom.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

    const result = await getTemplates('user-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
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

    const result = await getTemplates('user-1')

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

    await expect(getTemplates('user-1')).rejects.toEqual(mockError)
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

    await expect(getTemplates('user-1')).rejects.toEqual(mockError)
  })
})

describe('createTemplate', () => {
  it('should create template successfully', async () => {
    const templateInsert: TemplateInsert = {
      name: 'New Template',
      duration: 'monthly',
      owner_id: 'user-1',
    }

    const mockSingle = vi.fn().mockResolvedValue({
      data: mockTemplate,
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createTemplate(templateInsert)

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(mockInsert).toHaveBeenCalledWith(templateInsert)
    expect(result).toEqual(mockTemplate)
  })

  it('should throw DUPLICATE_TEMPLATE_NAME error for duplicate name', async () => {
    const templateInsert: TemplateInsert = {
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

    await expect(createTemplate(templateInsert)).rejects.toEqual(mockDuplicateError)
    expect(mockIsDuplicateNameError).toHaveBeenCalledWith(
      mockError,
      'unique_template_name_per_user',
    )
    expect(mockCreateDuplicateNameError).toHaveBeenCalledWith('TEMPLATE')
  })

  it('should throw original error for non-duplicate errors', async () => {
    const templateInsert: TemplateInsert = {
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

    await expect(createTemplate(templateInsert)).rejects.toEqual(mockError)
  })
})

describe('updateTemplate', () => {
  it('should update template successfully', async () => {
    const updates: TemplateUpdate = {
      name: 'Updated Template',
      duration: 'monthly',
    }

    const updatedTemplate = { ...mockTemplate, ...updates }
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

    const result = await updateTemplate('template-1', updates)

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(result).toEqual(updatedTemplate)
  })

  it('should throw DUPLICATE_TEMPLATE_NAME error for duplicate name', async () => {
    const updates: TemplateUpdate = { name: 'Duplicate Name' }
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

    await expect(updateTemplate('template-1', updates)).rejects.toEqual(mockDuplicateError)
  })
})

describe('deleteTemplate', () => {
  it('should delete template successfully', async () => {
    const mockQuery = {
      match: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await deleteTemplate('template-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
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

    await expect(deleteTemplate('template-1')).rejects.toEqual(mockError)
  })
})

describe('getTemplateWithItems', () => {
  it('should return template with items for owner', async () => {
    const templateWithItems: TemplateWithItems = {
      ...mockTemplate,
      template_items: [mockTemplateItem],
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

    const result = await getTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(result).toEqual(templateWithItems)
  })

  it('should return template with permission level for shared user', async () => {
    const templateWithItems: TemplateWithItems = {
      ...mockTemplate,
      owner_id: 'user-2',
      template_items: [mockTemplateItem],
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

    const result = await getTemplateWithItems('template-1', 'user-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
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

    const result = await getTemplateWithItems('template-1', 'user-1')

    expect(result).toBeNull()
  })

  it('should throw error when template not shared with user', async () => {
    const templateWithItems: TemplateWithItems = {
      ...mockTemplate,
      owner_id: 'user-2',
      template_items: [mockTemplateItem],
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

    await expect(getTemplateWithItems('template-1', 'user-1')).rejects.toThrow(
      'template not found or access denied',
    )
  })
})

describe('getTemplateSharedUsers', () => {
  it('should return shared users with details (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2023-01-01T12:00:00Z',
        },
      ],
      error: null,
    })

    const result = await getTemplateSharedUsers('template-1')

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

  it('should return empty array when no shares exist (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })
    const result = await getTemplateSharedUsers('template-1')
    expect(result).toEqual([])
  })
})

describe('createTemplateItems', () => {
  it('should create template items successfully', async () => {
    const items: TemplateItemInsert[] = [
      {
        template_id: 'template-1',
        name: 'Item 1',
        category_id: 'category-1',
        amount: 100,
      },
    ]

    const mockSelect = vi.fn().mockResolvedValue({
      data: [mockTemplateItem],
      error: null,
    })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createTemplateItems(items)

    expect(mockFrom).toHaveBeenCalledWith('template_items')
    expect(mockInsert).toHaveBeenCalledWith(items)
    expect(result).toEqual([mockTemplateItem])
  })

  it('should throw error when creation fails', async () => {
    const items: TemplateItemInsert[] = [
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

    await expect(createTemplateItems(items)).rejects.toThrow('Failed to create items')
  })
})

describe('deleteTemplateItems', () => {
  it('should delete template items successfully', async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await deleteTemplateItems(['item-1', 'item-2'])

    expect(mockFrom).toHaveBeenCalledWith('template_items')
    expect(mockIn).toHaveBeenCalledWith('id', ['item-1', 'item-2'])
  })

  it('should throw error when deletion fails', async () => {
    const mockError = createPostgrestError('Failed to delete items')
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn })
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(deleteTemplateItems(['item-1', 'item-2'])).rejects.toThrow(
      'Failed to delete items',
    )
  })
})

describe('shareTemplate', () => {
  it('should share template successfully (RPC user search)', async () => {
    const user = { id: 'user-2', email: 'john@example.com' }
    mockSupabase.rpc.mockResolvedValueOnce({ data: [user], error: null })

    const mockShareCheckMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockShareCheckEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareCheckMaybeSingle })
    const mockShareCheckEq1 = vi.fn().mockReturnValue({ eq: mockShareCheckEq2 })
    const mockShareCheckSelect = vi.fn().mockReturnValue({ eq: mockShareCheckEq1 })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({ select: mockShareCheckSelect })
      .mockReturnValueOnce({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await shareTemplate('template-1', 'john@example.com', 'view', 'user-1')

    expect(mockInsert).toHaveBeenCalledWith({
      template_id: 'template-1',
      shared_with_user_id: 'user-2',
      shared_by_user_id: 'user-1',
      permission_level: 'view',
    })
  })

  it('should throw error when user not found (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })
    await expect(
      shareTemplate('template-1', 'notfound@example.com', 'view', 'user-1'),
    ).rejects.toThrow('User not found: notfound@example.com')
  })

  it('should throw error when template already shared (RPC user search)', async () => {
    const user = { id: 'user-2', email: 'john@example.com' }
    mockSupabase.rpc.mockResolvedValueOnce({ data: [user], error: null })

    const mockShareCheckMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'share-1' }, error: null })
    const mockShareCheckEq2 = vi.fn().mockReturnValue({ maybeSingle: mockShareCheckMaybeSingle })
    const mockShareCheckEq1 = vi.fn().mockReturnValue({ eq: mockShareCheckEq2 })
    const mockShareCheckSelect = vi.fn().mockReturnValue({ eq: mockShareCheckEq1 })

    const mockFrom = vi.fn().mockReturnValueOnce({ select: mockShareCheckSelect })

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
