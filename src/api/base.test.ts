import { vi, beforeEach, it, expect, describe } from 'vitest'
import { BaseAPIService } from './base'
import type { EntityConfig } from './base'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

// Mock database utilities
vi.mock('src/utils/database', () => ({
  isDuplicateNameError: vi.fn(),
  createDuplicateNameError: vi.fn(),
}))

import { supabase } from 'src/lib/supabase/client'
import { isDuplicateNameError, createDuplicateNameError } from 'src/utils/database'

const mockSupabase = vi.mocked(supabase, true)
const mockFrom = vi.fn()
const mockIsDuplicateNameError = vi.mocked(isDuplicateNameError)
const mockCreateDuplicateNameError = vi.mocked(createDuplicateNameError)

type TestEntity = Tables<'templates'>
type TestEntityInsert = TablesInsert<'templates'>
type TestEntityUpdate = TablesUpdate<'templates'>

// Mock test data
const mockEntityConfig: EntityConfig<'templates'> = {
  tableName: 'templates',
  shareTableName: 'template_shares',
  itemsTableName: 'template_items',
  uniqueConstraintName: 'unique_template_name_per_user',
  entityTypeName: 'TEMPLATE',
}

const mockEntity: TestEntity = {
  id: 'template-1',
  name: 'Test Template',
  duration: 'monthly',
  owner_id: 'user-1',
  currency: 'USD',
  total: 100.0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockEntityInsert: TestEntityInsert = {
  name: 'New Template',
  duration: 'weekly',
  owner_id: 'user-1',
}

const mockEntityUpdate: TestEntityUpdate = {
  name: 'Updated Template',
  total: 200.0,
}

let service: BaseAPIService<'templates', TestEntity, TestEntityInsert, TestEntityUpdate>

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.from = mockFrom
  service = new BaseAPIService(mockEntityConfig)
})

describe('BaseAPIService - CRUD Operations', () => {
  it('create should successfully create an entity', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEntity, error: null }),
    }
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockQuery),
    } as never)

    const result = await service.create(mockEntityInsert)

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(result).toEqual(mockEntity)
  })

  it('create should throw duplicate name error when constraint violation occurs', async () => {
    const mockError = { code: '23505', message: 'duplicate key' }
    const duplicateError = new Error('DUPLICATE_TEMPLATE_NAME')

    mockIsDuplicateNameError.mockReturnValue(true)
    mockCreateDuplicateNameError.mockReturnValue(duplicateError)

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(service.create(mockEntityInsert)).rejects.toThrow('DUPLICATE_TEMPLATE_NAME')
    expect(mockIsDuplicateNameError).toHaveBeenCalledWith(
      mockError,
      'unique_template_name_per_user',
    )
    expect(mockCreateDuplicateNameError).toHaveBeenCalledWith('TEMPLATE')
  })

  it('create should throw generic error when other database error occurs', async () => {
    const mockError = { code: '42P01', message: 'relation does not exist' }

    mockIsDuplicateNameError.mockReturnValue(false)

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(service.create(mockEntityInsert)).rejects.toThrow()
  })

  it('update should successfully update an entity', async () => {
    const updatedEntity = { ...mockEntity, ...mockEntityUpdate }
    const mockQuery = {
      match: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedEntity, error: null }),
    }
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockQuery),
    } as never)

    const result = await service.update('template-1', mockEntityUpdate)

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(mockQuery.match).toHaveBeenCalledWith({ id: 'template-1' })
    expect(result).toEqual(updatedEntity)
  })

  it('update should throw duplicate name error when constraint violation occurs', async () => {
    const mockError = { code: '23505', message: 'duplicate key' }
    const duplicateError = new Error('DUPLICATE_TEMPLATE_NAME')

    mockIsDuplicateNameError.mockReturnValue(true)
    mockCreateDuplicateNameError.mockReturnValue(duplicateError)

    const mockQuery = {
      match: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(service.update('template-1', mockEntityUpdate)).rejects.toThrow(
      'DUPLICATE_TEMPLATE_NAME',
    )
    expect(mockIsDuplicateNameError).toHaveBeenCalledWith(
      mockError,
      'unique_template_name_per_user',
    )
  })

  it('delete should successfully delete an entity', async () => {
    const mockQuery = {
      match: vi.fn().mockResolvedValue({ error: null }),
    }
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await service.delete('template-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(mockQuery.match).toHaveBeenCalledWith({ id: 'template-1' })
  })

  it('delete should throw error when database error occurs', async () => {
    const mockError = { code: '23503', message: 'foreign key violation' }
    const mockQuery = {
      match: vi.fn().mockResolvedValue({ error: mockError }),
    }
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockQuery),
    } as never)

    await expect(service.delete('template-1')).rejects.toThrow()
  })

  it('findById should return entity when found', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockEntity, error: null }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    const result = await service.findById('template-1')

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(mockQuery.select).toHaveBeenCalledWith('*')
    expect(mockQuery.match).toHaveBeenCalledWith({ id: 'template-1' })
    expect(result).toEqual(mockEntity)
  })

  it('findById should return null when entity not found', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    const result = await service.findById('nonexistent-id')

    expect(result).toBeNull()
  })

  it('findById should throw error when database error occurs', async () => {
    const mockError = { code: '42P01', message: 'relation does not exist' }
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    await expect(service.findById('template-1')).rejects.toThrow()
  })
})

describe('BaseAPIService - Permission-based Operations', () => {
  it('getEntitiesWithPermissions should throw error when sharing not supported', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    await expect(serviceWithoutSharing.getEntitiesWithPermissions('user-1')).rejects.toThrow(
      'Sharing is not supported for this entity',
    )
  })

  it('getEntitiesWithPermissions should return owned and shared entities', async () => {
    const ownedEntity = { ...mockEntity, template_shares: [{ id: 'share-1' }] }
    const sharedEntity = { ...mockEntity, id: 'template-2', name: 'Shared Template' }

    // Mock owned entities query
    const ownedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [ownedEntity], error: null }),
    }

    // Mock shared entities query
    const sharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({
        data: [{ permission_level: 'view', templates: sharedEntity }],
        error: null,
      }),
    }

    mockFrom
      .mockReturnValueOnce(ownedQuery as never) // First call for owned entities
      .mockReturnValueOnce(sharedQuery as never) // Second call for shared entities

    const result = await service.getEntitiesWithPermissions('user-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ ...mockEntity, is_shared: true })
    expect(result[1]).toEqual({ ...sharedEntity, permission_level: 'view' })
  })

  it('getEntitiesWithPermissions should handle entities with no shares', async () => {
    const ownedEntity = { ...mockEntity, template_shares: [] }

    const ownedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [ownedEntity], error: null }),
    }

    const sharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockFrom.mockReturnValueOnce(ownedQuery as never).mockReturnValueOnce(sharedQuery as never)

    const result = await service.getEntitiesWithPermissions('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ ...mockEntity, is_shared: false })
  })

  it('getEntitiesWithPermissions should throw error when owned entities query fails', async () => {
    const mockError = { code: '42P01', message: 'relation does not exist' }
    const ownedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }

    mockFrom.mockReturnValueOnce(ownedQuery as never)

    await expect(service.getEntitiesWithPermissions('user-1')).rejects.toThrow()
  })

  it('getEntitiesWithPermissions should throw error when shared entities query fails', async () => {
    const ownedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const mockError = { code: '42P01', message: 'relation does not exist' }
    const sharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }

    mockFrom.mockReturnValueOnce(ownedQuery as never).mockReturnValueOnce(sharedQuery as never)

    await expect(service.getEntitiesWithPermissions('user-1')).rejects.toThrow()
  })

  it('getEntitiesWithPermissions should use custom entity column name', async () => {
    const ownedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const sharedQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockFrom.mockReturnValueOnce(ownedQuery as never).mockReturnValueOnce(sharedQuery as never)

    await service.getEntitiesWithPermissions('user-1', 'custom_column')

    expect(sharedQuery.select).toHaveBeenCalledWith('permission_level, custom_column (*)')
  })
})

describe('BaseAPIService - Entity with Items Operations', () => {
  it('getEntityWithItems should return entity with items for owner', async () => {
    const entityWithItems = { ...mockEntity, template_items: [] }
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: entityWithItems, error: null }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    const result = await service.getEntityWithItems('template-1', 'user-1', 'template_items')

    expect(mockFrom).toHaveBeenCalledWith('templates')
    expect(mockQuery.select).toHaveBeenCalledWith('*, template_items (*)')
    expect(result).toEqual(entityWithItems)
  })

  it('getEntityWithItems should return null when entity not found', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    const result = await service.getEntityWithItems('nonexistent-id', 'user-1', 'template_items')

    expect(result).toBeNull()
  })

  it('getEntityWithItems should return entity with permission for shared user', async () => {
    const entityWithItems = { ...mockEntity, owner_id: 'other-user' }
    const shareData = { permission_level: 'edit' }

    const entityQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: entityWithItems, error: null }),
    }

    const shareQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: shareData, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(entityQuery as never) // First call for entity
      .mockReturnValueOnce(shareQuery as never) // Second call for share check

    const result = await service.getEntityWithItems('template-1', 'user-1', 'template_items')

    expect(result).toEqual({ ...entityWithItems, permission_level: 'edit' })
  })

  it('getEntityWithItems should throw error when sharing not supported and user not owner', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    const entityWithItems = { ...mockEntity, owner_id: 'other-user' }
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: entityWithItems, error: null }),
    }
    mockFrom.mockReturnValue(mockQuery as never)

    await expect(
      serviceWithoutSharing.getEntityWithItems('template-1', 'user-1', 'template_items'),
    ).rejects.toThrow('Sharing is not supported for this entity')
  })

  it('getEntityWithItems should throw access denied error when entity not shared with user', async () => {
    const entityWithItems = { ...mockEntity, owner_id: 'other-user' }

    const entityQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: entityWithItems, error: null }),
    }

    const shareQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom.mockReturnValueOnce(entityQuery as never).mockReturnValueOnce(shareQuery as never)

    await expect(
      service.getEntityWithItems('template-1', 'user-1', 'template_items'),
    ).rejects.toThrow('template not found or access denied')
  })

  it('getEntityWithItems should throw error when share query fails', async () => {
    const entityWithItems = { ...mockEntity, owner_id: 'other-user' }
    const mockError = { code: '42P01', message: 'relation does not exist' }

    const entityQuery = {
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: entityWithItems, error: null }),
    }

    const shareQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }

    mockFrom.mockReturnValueOnce(entityQuery as never).mockReturnValueOnce(shareQuery as never)

    await expect(
      service.getEntityWithItems('template-1', 'user-1', 'template_items'),
    ).rejects.toThrow()
  })
})

describe('BaseAPIService - Sharing Operations', () => {
  it('getSharedUsers should throw error when sharing not supported', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      tableName: 'unsupported_table' as never,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    await expect(serviceWithoutSharing.getSharedUsers('template-1')).rejects.toThrow(
      'Sharing is not supported for this entity',
    )
  })

  it('getSharedUsers should return empty array when no shares exist (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })

    const result = await service.getSharedUsers('template-1')

    expect(result).toEqual([])
  })

  it('getSharedUsers should return shared users with details (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'user-2',
          user_name: 'Shared User',
          user_email: 'shared@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const result = await service.getSharedUsers('template-1')

    expect(result).toEqual([
      {
        user_id: 'user-2',
        user_name: 'Shared User',
        user_email: 'shared@example.com',
        permission_level: 'view',
        shared_at: '2024-01-01T00:00:00Z',
      },
    ])
  })

  it('getSharedUsers should handle RPC returning incomplete user details', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'user-2',
          user_name: '',
          user_email: '',
          permission_level: 'view',
          shared_at: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const result = await service.getSharedUsers('template-1')

    expect(result).toEqual([
      {
        user_id: 'user-2',
        user_name: '',
        user_email: '',
        permission_level: 'view',
        shared_at: '2024-01-01T00:00:00Z',
      },
    ])
  })

  it('shareEntity should throw error when sharing not supported', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    await expect(
      serviceWithoutSharing.shareEntity('template-1', 'user@example.com', 'view', 'owner-id'),
    ).rejects.toThrow('Sharing is not supported for this entity')
  })

  it('shareEntity should throw error when user not found (RPC)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })

    await expect(
      service.shareEntity('template-1', 'nonexistent@example.com', 'view', 'owner-id'),
    ).rejects.toThrow('User not found: nonexistent@example.com')
  })

  it('shareEntity should throw error when entity already shared with user', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ id: 'user-2', email: 'shared@example.com', name: 'Shared User' }],
      error: null,
    })

    const shareCheckQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-share' }, error: null }),
    }

    shareCheckQuery.eq.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-share' }, error: null }),
      }),
    })

    mockFrom.mockReturnValueOnce(shareCheckQuery as never)

    await expect(
      service.shareEntity('template-1', 'shared@example.com', 'view', 'owner-id'),
    ).rejects.toThrow('TEMPLATE is already shared with shared@example.com')
  })

  it('shareEntity should successfully create share', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ id: 'user-2', email: 'shared@example.com', name: 'Shared User' }],
      error: null,
    })

    const shareCheckQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    shareCheckQuery.eq.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const insertQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }

    mockFrom.mockReturnValueOnce(shareCheckQuery as never).mockReturnValueOnce(insertQuery as never)

    await service.shareEntity('template-1', 'shared@example.com', 'edit', 'owner-id')

    expect(insertQuery.insert).toHaveBeenCalledWith({
      template_id: 'template-1',
      shared_with_user_id: 'user-2',
      shared_by_user_id: 'owner-id',
      permission_level: 'edit',
    })
  })

  it('unshareEntity should throw error when sharing not supported', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    await expect(serviceWithoutSharing.unshareEntity('template-1', 'user-2')).rejects.toThrow(
      'Sharing is not supported for this entity',
    )
  })

  it('unshareEntity should successfully remove share', async () => {
    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    deleteQuery.delete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    mockFrom.mockReturnValue(deleteQuery as never)

    await service.unshareEntity('template-1', 'user-2')

    expect(deleteQuery.delete).toHaveBeenCalled()
  })

  it('updateSharePermission should throw error when sharing not supported', async () => {
    const configWithoutSharing = {
      ...mockEntityConfig,
      shareTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutSharing = new BaseAPIService(configWithoutSharing)

    await expect(
      serviceWithoutSharing.updateSharePermission('template-1', 'user-2', 'edit'),
    ).rejects.toThrow('Sharing is not supported for this entity')
  })

  it('updateSharePermission should successfully update permission', async () => {
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    updateQuery.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    mockFrom.mockReturnValue(updateQuery as never)

    await service.updateSharePermission('template-1', 'user-2', 'edit')

    expect(updateQuery.update).toHaveBeenCalledWith({ permission_level: 'edit' })
  })
})

describe('BaseAPIService - Items Operations', () => {
  const mockItems = [
    { name: 'Item 1', amount: 100, category_id: 'cat-1', template_id: 'template-1' },
    { name: 'Item 2', amount: 200, category_id: 'cat-2', template_id: 'template-1' },
  ]

  const mockCreatedItems = [
    { id: 'item-1', name: 'Item 1', amount: 100, category_id: 'cat-1', template_id: 'template-1' },
    { id: 'item-2', name: 'Item 2', amount: 200, category_id: 'cat-2', template_id: 'template-1' },
  ]

  it('createItems should throw error when items table not configured', async () => {
    const configWithoutItems = {
      ...mockEntityConfig,
      itemsTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutItems = new BaseAPIService(configWithoutItems)

    await expect(serviceWithoutItems.createItems(mockItems)).rejects.toThrow(
      'Items table not configured for this entity type',
    )
  })

  it('createItems should successfully create items', async () => {
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: mockCreatedItems, error: null }),
    }
    insertQuery.insert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockCreatedItems, error: null }),
    })
    mockFrom.mockReturnValue(insertQuery as never)

    const result = await service.createItems(mockItems)

    expect(insertQuery.insert).toHaveBeenCalledWith(mockItems)
    expect(result).toEqual(mockCreatedItems)
  })

  it('createItems should throw error when database error occurs', async () => {
    const mockError = { code: '23503', message: 'foreign key violation' }
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    mockFrom.mockReturnValue(insertQuery as never)

    await expect(service.createItems(mockItems)).rejects.toThrow()
  })

  it('deleteItems should throw error when items table not configured', async () => {
    const configWithoutItems = {
      ...mockEntityConfig,
      itemsTableName: undefined,
    } as unknown as EntityConfig<'templates'>
    const serviceWithoutItems = new BaseAPIService(configWithoutItems)

    await expect(serviceWithoutItems.deleteItems(['item-1', 'item-2'])).rejects.toThrow(
      'Items table not configured for this entity type',
    )
  })

  it('deleteItems should successfully delete items', async () => {
    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    }
    deleteQuery.delete.mockReturnValue({
      in: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockReturnValue(deleteQuery as never)

    await service.deleteItems(['item-1', 'item-2'])

    expect(deleteQuery.delete).toHaveBeenCalled()
  })

  it('deleteItems should throw error when database error occurs', async () => {
    const mockError = { code: '23503', message: 'foreign key violation' }
    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: mockError }),
    }
    mockFrom.mockReturnValue(deleteQuery as never)

    await expect(service.deleteItems(['item-1', 'item-2'])).rejects.toThrow()
  })
})
