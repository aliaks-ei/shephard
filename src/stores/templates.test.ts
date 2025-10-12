import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

import { useTemplatesStore } from './templates'
import { useUserStore } from './user'
import { useError } from 'src/composables/useError'
import * as templatesApi from 'src/api/templates'
import * as userApi from 'src/api/user'
import type {
  Template,
  TemplateWithPermission,
  TemplateInsert,
  TemplateUpdate,
  TemplateItemInsert,
  TemplateSharedUser,
} from 'src/api/templates'
import type { UserSearchResult } from 'src/api/user'
import {
  createMockTemplates,
  createMockTemplateWithItems,
  createMockTemplateWithPermission,
  createMockSharedUsers,
} from 'test/fixtures/templates'
import { createMockUserStoreData, createMockUserSearchResults } from 'test/fixtures/users'

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('./user', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('./auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./preferences', () => ({
  usePreferencesStore: vi.fn(),
}))

vi.mock('src/api/templates', () => ({
  getTemplates: vi.fn(),
  getTemplateWithItems: vi.fn(),
  getTemplateSharedUsers: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  shareTemplate: vi.fn(),
  unshareTemplate: vi.fn(),
  updateSharePermission: vi.fn(),
  createTemplateItems: vi.fn(),
  deleteTemplateItems: vi.fn(),
}))

vi.mock('src/api/user', () => ({
  searchUsersByEmail: vi.fn(),
}))

describe('Templates Store', () => {
  // Using our mock data factories instead of inline objects - much cleaner!
  const mockHandleError = vi.fn()
  const mockUserStoreData = createMockUserStoreData()
  const mockTemplates = createMockTemplates(2)
  const mockTemplateWithItems = createMockTemplateWithItems(1)
  const mockSharedUsers = createMockSharedUsers(1)
  const mockUserSearchResults = createMockUserSearchResults(1)

  let templatesStore: ReturnType<typeof useTemplatesStore>

  const mockTemplateItems: TemplateItemInsert[] = [
    {
      template_id: mockTemplates[0]!.id,
      name: 'Bread',
      category_id: 'cat-1',
      amount: 3.5,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup error handling mock
    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    // Mock user store with our factory data
    vi.mocked(useUserStore).mockReturnValue(
      mockUserStoreData as unknown as ReturnType<typeof useUserStore>,
    )

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    templatesStore = useTemplatesStore()
  })

  describe('State Management', () => {
    it('should initialize with empty state', () => {
      expect(templatesStore.templates).toEqual([])
      expect(templatesStore.sharedUsers).toEqual([])
      expect(templatesStore.userSearchResults).toEqual([])
      expect(templatesStore.isLoading).toBe(false)
      expect(templatesStore.isSharing).toBe(false)
      expect(templatesStore.isSearchingUsers).toBe(false)
    })

    it('should calculate templatesCount correctly', () => {
      templatesStore.templates = mockTemplates
      expect(templatesStore.templatesCount).toBe(2)
    })

    it('should filter ownedTemplates correctly', () => {
      const mixedTemplates = [
        ...mockTemplates,
        createMockTemplateWithPermission({ id: 'template-3', owner_id: 'user-2' }),
      ]
      templatesStore.templates = mixedTemplates
      expect(templatesStore.ownedTemplates).toHaveLength(2)
      expect(templatesStore.ownedTemplates.every((t) => t.owner_id === 'user-1')).toBe(true)
    })

    it('should filter sharedTemplates correctly', () => {
      const mixedTemplates = [
        ...mockTemplates,
        createMockTemplateWithPermission({ id: 'template-3', owner_id: 'user-2' }),
      ]
      templatesStore.templates = mixedTemplates
      expect(templatesStore.sharedTemplates).toHaveLength(1)
      expect(templatesStore.sharedTemplates[0]?.owner_id).not.toBe('user-1')
    })
  })

  describe('loadTemplates', () => {
    it('should load templates successfully', async () => {
      vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)

      await templatesStore.loadTemplates()

      expect(templatesApi.getTemplates).toHaveBeenCalledWith(mockUserStoreData.userProfile.id)
      expect(templatesStore.templates).toEqual(mockTemplates)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle errors when loading templates', async () => {
      const error = new Error('Failed to load')
      vi.mocked(templatesApi.getTemplates).mockRejectedValue(error)

      await templatesStore.loadTemplates()

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.LOAD_FAILED', error)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should not load templates if user is not authenticated', async () => {
      // Create a new Pinia instance and store with null user
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      templatesStore = useTemplatesStore()

      await templatesStore.loadTemplates()

      expect(templatesApi.getTemplates).not.toHaveBeenCalled()
    })

    it('should set loading state correctly', async () => {
      vi.mocked(templatesApi.getTemplates).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(templatesStore.isLoading).toBe(true)
            resolve(mockTemplates)
          }),
      )

      await templatesStore.loadTemplates()

      expect(templatesStore.isLoading).toBe(false)
    })
  })

  describe('loadTemplateWithItems', () => {
    it('should load template with items successfully', async () => {
      vi.mocked(templatesApi.getTemplateWithItems).mockResolvedValue(mockTemplateWithItems)

      const result = await templatesStore.loadTemplateWithItems('template-1')

      expect(templatesApi.getTemplateWithItems).toHaveBeenCalledWith(
        mockTemplates[0]!.id,
        mockUserStoreData.userProfile.id,
      )
      expect(result).toEqual(mockTemplateWithItems)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle errors when loading template with items', async () => {
      const error = new Error('Failed to load template')
      vi.mocked(templatesApi.getTemplateWithItems).mockRejectedValue(error)

      const result = await templatesStore.loadTemplateWithItems('template-1')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.LOAD_TEMPLATE_FAILED', error, {
        templateId: 'template-1',
      })
      expect(result).toBeNull()
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should return null if user is not authenticated', async () => {
      // Create a new Pinia instance and store with null user
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      templatesStore = useTemplatesStore()

      const result = await templatesStore.loadTemplateWithItems('template-1')

      expect(templatesApi.getTemplateWithItems).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe('addTemplate', () => {
    const templateData: Omit<TemplateInsert, 'owner_id' | 'currency'> = {
      name: 'New Template',
      duration: '1 week',
    }

    it('should create template successfully', async () => {
      const newTemplate = { ...mockTemplates[0], id: 'new-template' } as Template
      vi.mocked(templatesApi.createTemplate).mockResolvedValue(newTemplate)

      const result = await templatesStore.addTemplate(templateData)

      expect(templatesApi.createTemplate).toHaveBeenCalledWith({
        ...templateData,
        owner_id: mockUserStoreData.userProfile.id,
        currency: mockUserStoreData.preferences.currency,
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(newTemplate)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle duplicate name errors', async () => {
      const error = new Error('Duplicate name')
      error.name = 'DUPLICATE_TEMPLATE_NAME'
      vi.mocked(templatesApi.createTemplate).mockRejectedValue(error)

      await templatesStore.addTemplate(templateData)

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.DUPLICATE_NAME', error)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(templatesApi.createTemplate).mockRejectedValue(error)

      await templatesStore.addTemplate(templateData)

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.CREATE_FAILED', error)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should not create template if user is not authenticated', async () => {
      // Create a new Pinia instance and store with null user
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      templatesStore = useTemplatesStore()

      await templatesStore.addTemplate(templateData)

      expect(templatesApi.createTemplate).not.toHaveBeenCalled()
    })
  })

  describe('editTemplate', () => {
    const updates: TemplateUpdate = {
      name: 'Updated Template',
      duration: '2 weeks',
    }

    it('should update template successfully', async () => {
      const updatedTemplate = { ...mockTemplates[0], ...updates } as Template
      vi.mocked(templatesApi.updateTemplate).mockResolvedValue(updatedTemplate)

      const result = await templatesStore.editTemplate('template-1', updates)

      expect(templatesApi.updateTemplate).toHaveBeenCalledWith('template-1', updates)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedTemplate)
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle duplicate name errors', async () => {
      const error = new Error('Duplicate name')
      error.name = 'DUPLICATE_TEMPLATE_NAME'
      vi.mocked(templatesApi.updateTemplate).mockRejectedValue(error)

      await templatesStore.editTemplate('template-1', updates)

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.DUPLICATE_NAME', error, {
        templateId: 'template-1',
      })
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(templatesApi.updateTemplate).mockRejectedValue(error)

      await templatesStore.editTemplate('template-1', updates)

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.UPDATE_FAILED', error, {
        templateId: 'template-1',
      })
      expect(templatesStore.isLoading).toBe(false)
    })
  })

  describe('removeTemplate', () => {
    beforeEach(() => {
      templatesStore.templates = [...mockTemplates]
    })

    it('should delete template successfully', async () => {
      vi.mocked(templatesApi.deleteTemplate).mockResolvedValue()

      await templatesStore.removeTemplate('template-1')

      expect(templatesApi.deleteTemplate).toHaveBeenCalledWith('template-1')
      expect(templatesStore.templates).toHaveLength(1)
      expect(templatesStore.templates.find((t) => t.id === 'template-1')).toBeUndefined()
      expect(templatesStore.isLoading).toBe(false)
    })

    it('should handle errors when deleting template', async () => {
      const error = new Error('Failed to delete')
      vi.mocked(templatesApi.deleteTemplate).mockRejectedValue(error)

      await templatesStore.removeTemplate('template-1')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.DELETE_FAILED', error, {
        templateId: 'template-1',
      })
      expect(templatesStore.templates).toHaveLength(2)
      expect(templatesStore.isLoading).toBe(false)
    })
  })

  describe('addItemsToTemplate', () => {
    it('should create template items successfully', async () => {
      const newItems = [
        {
          id: 'item-new',
          template_id: 'template-1',
          name: 'Bread',
          category_id: 'cat-1',
          amount: 3.5,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          is_fixed_payment: true,
        },
      ]
      vi.mocked(templatesApi.createTemplateItems).mockResolvedValue(newItems)

      const result = await templatesStore.addItemsToTemplate(mockTemplateItems)

      expect(templatesApi.createTemplateItems).toHaveBeenCalledWith(mockTemplateItems)
      expect(result.success).toBe(true)
    })

    it('should handle errors when creating template items', async () => {
      const error = new Error('Failed to create items')
      vi.mocked(templatesApi.createTemplateItems).mockRejectedValue(error)

      await templatesStore.addItemsToTemplate(mockTemplateItems)

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATE_ITEMS.CREATE_FAILED', error)
    })
  })

  describe('removeItemsFromTemplate', () => {
    it('should delete template items successfully', async () => {
      vi.mocked(templatesApi.deleteTemplateItems).mockResolvedValue()

      await templatesStore.removeItemsFromTemplate(['item-1', 'item-2'])

      expect(templatesApi.deleteTemplateItems).toHaveBeenCalledWith(['item-1', 'item-2'])
    })

    it('should handle errors when deleting template items', async () => {
      const error = new Error('Failed to delete items')
      vi.mocked(templatesApi.deleteTemplateItems).mockRejectedValue(error)

      await templatesStore.removeItemsFromTemplate(['item-1', 'item-2'])

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATE_ITEMS.DELETE_FAILED', error)
    })
  })

  describe('loadTemplateShares', () => {
    it('should load template shares successfully', async () => {
      vi.mocked(templatesApi.getTemplateSharedUsers).mockResolvedValue(mockSharedUsers)

      await templatesStore.loadTemplateShares('template-1')

      expect(templatesApi.getTemplateSharedUsers).toHaveBeenCalledWith('template-1')
      expect(templatesStore.sharedUsers).toEqual(mockSharedUsers)
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should handle errors when loading template shares', async () => {
      const error = new Error('Failed to load shares')
      vi.mocked(templatesApi.getTemplateSharedUsers).mockRejectedValue(error)

      await templatesStore.loadTemplateShares('template-1')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.LOAD_SHARED_USERS_FAILED', error, {
        entityId: 'template-1',
      })
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should set sharing state correctly', async () => {
      vi.mocked(templatesApi.getTemplateSharedUsers).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(templatesStore.isSharing).toBe(true)
            resolve(mockSharedUsers)
          }),
      )

      await templatesStore.loadTemplateShares('template-1')

      expect(templatesStore.isSharing).toBe(false)
    })
  })

  describe('shareTemplateWithUser', () => {
    beforeEach(() => {
      vi.mocked(templatesApi.shareTemplate).mockResolvedValue()
      vi.mocked(templatesApi.getTemplateSharedUsers).mockResolvedValue(mockSharedUsers)
      vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)
    })

    it('should share template successfully', async () => {
      await templatesStore.shareTemplateWithUser('template-1', 'user@example.com', 'edit')

      expect(templatesApi.shareTemplate).toHaveBeenCalledWith(
        'template-1',
        'user@example.com',
        'edit',
        'user-1',
      )
      expect(templatesApi.getTemplateSharedUsers).toHaveBeenCalledWith('template-1')
      expect(templatesApi.getTemplates).toHaveBeenCalledWith('user-1')
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should handle errors when sharing template', async () => {
      const error = new Error('Failed to share')
      vi.mocked(templatesApi.shareTemplate).mockRejectedValue(error)

      await templatesStore.shareTemplateWithUser('template-1', 'user@example.com', 'edit')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.SHARE_FAILED', error, {
        entityId: 'template-1',
        userEmail: 'user@example.com',
      })
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should not share template if user is not authenticated', async () => {
      // Create a new Pinia instance and store with null user
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      templatesStore = useTemplatesStore()

      await templatesStore.shareTemplateWithUser('template-1', 'user@example.com', 'edit')

      expect(templatesApi.shareTemplate).not.toHaveBeenCalled()
    })
  })

  describe('unshareTemplateWithUser', () => {
    beforeEach(() => {
      templatesStore.sharedUsers = [...mockSharedUsers]
      vi.mocked(templatesApi.unshareTemplate).mockResolvedValue()
      vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)
    })

    it('should unshare template successfully', async () => {
      vi.mocked(templatesApi.getTemplateSharedUsers).mockResolvedValue([])

      await templatesStore.unshareTemplateWithUser('template-1', 'user-456')

      expect(templatesApi.unshareTemplate).toHaveBeenCalledWith('template-1', 'user-456')
      expect(templatesApi.getTemplates).toHaveBeenCalledWith('user-1')
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should handle errors when unsharing template', async () => {
      const error = new Error('Failed to unshare')
      vi.mocked(templatesApi.unshareTemplate).mockRejectedValue(error)

      await templatesStore.unshareTemplateWithUser('template-1', 'user-456')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.UNSHARE_FAILED', error, {
        entityId: 'template-1',
        targetUserId: 'user-456',
      })
      expect(templatesStore.sharedUsers).toHaveLength(1)
      expect(templatesStore.isSharing).toBe(false)
    })
  })

  describe('updateUserPermission', () => {
    beforeEach(() => {
      templatesStore.sharedUsers = [...mockSharedUsers]
      vi.mocked(templatesApi.updateSharePermission).mockResolvedValue()
    })

    it('should update user permission successfully', async () => {
      vi.mocked(templatesApi.getTemplateSharedUsers).mockResolvedValue([
        { ...mockSharedUsers[0]!, permission_level: 'view' },
      ])

      await templatesStore.updateUserPermission('template-1', 'user-456', 'view')

      expect(templatesApi.updateSharePermission).toHaveBeenCalledWith(
        'template-1',
        'user-456',
        'view',
      )
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should handle errors when updating user permission', async () => {
      const error = new Error('Failed to update permission')
      vi.mocked(templatesApi.updateSharePermission).mockRejectedValue(error)

      await templatesStore.updateUserPermission('template-1', 'user-456', 'view')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.UPDATE_PERMISSION_FAILED', error, {
        entityId: 'template-1',
        permission: 'view',
        targetUserId: 'user-456',
      })
      expect(templatesStore.isSharing).toBe(false)
    })

    it('should handle case when user is not found', async () => {
      // Store the original permission level
      const originalPermission = templatesStore.sharedUsers[0]?.permission_level

      await templatesStore.updateUserPermission('template-1', 'non-existent-user', 'view')

      expect(templatesApi.updateSharePermission).toHaveBeenCalledWith(
        'template-1',
        'non-existent-user',
        'view',
      )
      expect(templatesStore.sharedUsers[0]?.permission_level).toBe(originalPermission)
    })
  })

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      vi.mocked(userApi.searchUsersByEmail).mockResolvedValue(mockUserSearchResults)

      await templatesStore.searchUsers('jane@example.com')

      expect(userApi.searchUsersByEmail).toHaveBeenCalledWith('jane@example.com')
      expect(templatesStore.userSearchResults).toEqual(mockUserSearchResults)
      expect(templatesStore.isSearchingUsers).toBe(false)
    })

    it('should handle errors when searching users', async () => {
      const error = new Error('Failed to search')
      vi.mocked(userApi.searchUsersByEmail).mockRejectedValue(error)

      await templatesStore.searchUsers('jane@example.com')

      expect(mockHandleError).toHaveBeenCalledWith('TEMPLATES.SEARCH_USERS_FAILED', error, {
        query: 'jane@example.com',
      })
      expect(templatesStore.isSearchingUsers).toBe(false)
    })

    it('should clear results for empty query', async () => {
      templatesStore.userSearchResults = [...mockUserSearchResults]

      await templatesStore.searchUsers('')

      expect(userApi.searchUsersByEmail).not.toHaveBeenCalled()
      expect(templatesStore.userSearchResults).toEqual([])
    })

    it('should clear results for whitespace-only query', async () => {
      templatesStore.userSearchResults = [...mockUserSearchResults]

      await templatesStore.searchUsers('   ')

      expect(userApi.searchUsersByEmail).not.toHaveBeenCalled()
      expect(templatesStore.userSearchResults).toEqual([])
    })

    it('should set searching state correctly', async () => {
      vi.mocked(userApi.searchUsersByEmail).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(templatesStore.isSearchingUsers).toBe(true)
            resolve(mockUserSearchResults)
          }),
      )

      await templatesStore.searchUsers('jane@example.com')

      expect(templatesStore.isSearchingUsers).toBe(false)
    })
  })

  describe('clearUserSearch', () => {
    it('should clear user search results', () => {
      templatesStore.userSearchResults = [...mockUserSearchResults]

      templatesStore.clearUserSearch()

      expect(templatesStore.userSearchResults).toEqual([])
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      templatesStore.templates = [...mockTemplates]
      templatesStore.sharedUsers = [...mockSharedUsers]
      templatesStore.userSearchResults = [...mockUserSearchResults]
      templatesStore.isLoading = true
      templatesStore.isSharing = true
      templatesStore.isSearchingUsers = true
    })

    it('should reset all state to initial values', () => {
      templatesStore.reset()

      expect(templatesStore.templates).toEqual([])
      expect(templatesStore.sharedUsers).toEqual([])
      expect(templatesStore.userSearchResults).toEqual([])
      expect(templatesStore.isLoading).toBe(false)
      expect(templatesStore.isSharing).toBe(false)
      expect(templatesStore.isSearchingUsers).toBe(false)
    })
  })

  describe('Loading States', () => {
    it('should manage isLoading state during template operations', async () => {
      let resolvePromise: (value: TemplateWithPermission[]) => void
      const promise = new Promise<TemplateWithPermission[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(templatesApi.getTemplates).mockReturnValue(promise)

      const loadPromise = templatesStore.loadTemplates()
      expect(templatesStore.isLoading).toBe(true)

      resolvePromise!(mockTemplates)
      await loadPromise

      expect(templatesStore.isLoading).toBe(false)
    })

    it('should manage isSharing state during sharing operations', async () => {
      let resolvePromise: (value: TemplateSharedUser[]) => void
      const promise = new Promise<TemplateSharedUser[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(templatesApi.getTemplateSharedUsers).mockReturnValue(promise)

      const loadPromise = templatesStore.loadTemplateShares('template-1')
      expect(templatesStore.isSharing).toBe(true)

      resolvePromise!(mockSharedUsers)
      await loadPromise

      expect(templatesStore.isSharing).toBe(false)
    })

    it('should manage isSearchingUsers state during user search', async () => {
      let resolvePromise: (value: UserSearchResult[]) => void
      const promise = new Promise<UserSearchResult[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(userApi.searchUsersByEmail).mockReturnValue(promise)

      const searchPromise = templatesStore.searchUsers('jane@example.com')
      expect(templatesStore.isSearchingUsers).toBe(true)

      resolvePromise!(mockUserSearchResults)
      await searchPromise

      expect(templatesStore.isSearchingUsers).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should always reset loading state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(templatesApi.getTemplates).mockRejectedValue(error)

      await templatesStore.loadTemplates()

      expect(templatesStore.isLoading).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })

    it('should always reset sharing state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(templatesApi.getTemplateSharedUsers).mockRejectedValue(error)

      await templatesStore.loadTemplateShares('template-1')

      expect(templatesStore.isSharing).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })

    it('should always reset searching state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(userApi.searchUsersByEmail).mockRejectedValue(error)

      await templatesStore.searchUsers('jane@example.com')

      expect(templatesStore.isSearchingUsers).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })
  })
})
