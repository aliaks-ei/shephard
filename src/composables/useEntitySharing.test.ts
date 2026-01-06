import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import {
  useEntitySharing,
  type EntitySharingConfig,
  type ShareableEntity,
} from './useEntitySharing'

const mockShowError = vi.fn()
vi.mock('src/composables/useBanner', () => ({
  useBanner: () => ({
    showSuccess: vi.fn(),
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    banners: ref([]),
    dismissBanner: vi.fn(),
    clearAllBanners: vi.fn(),
  }),
}))

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  mockShowError.mockClear()
})

describe('useEntitySharing', () => {
  const createConfig = (
    overrides?: Partial<EntitySharingConfig<ShareableEntity>>,
  ): EntitySharingConfig<ShareableEntity> => ({
    entityNameSingular: 'plan',
    entityNamePlural: 'plans',
    entities: ref([
      { id: 'entity-1', is_shared: false },
      { id: 'entity-2', is_shared: true },
    ]),
    userId: computed(() => 'user-1'),
    loadSharedUsersApi: vi.fn().mockResolvedValue([]),
    shareApi: vi.fn().mockResolvedValue(undefined),
    unshareApi: vi.fn().mockResolvedValue(undefined),
    updatePermissionApi: vi.fn().mockResolvedValue(undefined),
    searchUsersApi: vi.fn().mockResolvedValue([]),
    ...overrides,
  })

  describe('loadSharedUsers', () => {
    it('loads shared users successfully', async () => {
      const mockUsers = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]
      const config = createConfig({
        loadSharedUsersApi: vi.fn().mockResolvedValue(mockUsers),
      })

      const { loadSharedUsers, sharedUsers, isSharing } = useEntitySharing(config)

      expect(isSharing.value).toBe(false)
      const promise = loadSharedUsers('entity-1')
      expect(isSharing.value).toBe(true)
      await promise

      expect(sharedUsers.value).toEqual(mockUsers)
      expect(isSharing.value).toBe(false)
      expect(config.loadSharedUsersApi).toHaveBeenCalledWith('entity-1')
    })

    it('handles error when loading shared users fails', async () => {
      const config = createConfig({
        loadSharedUsersApi: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      const { loadSharedUsers, isSharing } = useEntitySharing(config)

      await loadSharedUsers('entity-1')

      expect(isSharing.value).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('shareWithUser', () => {
    it('shares entity with user successfully', async () => {
      const config = createConfig({
        shareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { shareWithUser } = useEntitySharing(config)

      const result = await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(result.success).toBe(true)
      expect(config.shareApi).toHaveBeenCalledWith('entity-1', 'user@example.com', 'view', 'user-1')
    })

    it('updates local is_shared flag when configured', async () => {
      const entities = ref([{ id: 'entity-1', is_shared: false }])
      const config = createConfig({
        entities,
        updateLocalIsShared: true,
        shareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { shareWithUser } = useEntitySharing(config)

      await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(entities.value[0]?.is_shared).toBe(true)
    })

    it('calls onAfterShare callback when provided', async () => {
      const onAfterShare = vi.fn().mockResolvedValue(undefined)
      const config = createConfig({
        onAfterShare,
        shareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { shareWithUser } = useEntitySharing(config)

      await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(onAfterShare).toHaveBeenCalledWith('entity-1')
    })

    it('returns failure when user ID is not available', async () => {
      const config = createConfig({
        userId: computed(() => undefined),
      })

      const { shareWithUser } = useEntitySharing(config)

      const result = await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(result.success).toBe(false)
    })

    it('handles specific error types when configured', async () => {
      const config = createConfig({
        handleSpecificErrors: true,
        shareApi: vi.fn().mockRejectedValue(new Error('User not found')),
      })

      const { shareWithUser } = useEntitySharing(config)

      const result = await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(result.success).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })

    it('handles already shared error when configured', async () => {
      const config = createConfig({
        handleSpecificErrors: true,
        shareApi: vi.fn().mockRejectedValue(new Error('already shared')),
      })

      const { shareWithUser } = useEntitySharing(config)

      const result = await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(result.success).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })

    it('handles generic error when sharing fails', async () => {
      const config = createConfig({
        shareApi: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      const { shareWithUser } = useEntitySharing(config)

      const result = await shareWithUser('entity-1', 'user@example.com', 'view')

      expect(result.success).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('unshareWithUser', () => {
    it('unshares entity with user successfully', async () => {
      const config = createConfig({
        unshareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { unshareWithUser, sharedUsers } = useEntitySharing(config)
      sharedUsers.value = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]

      const result = await unshareWithUser('entity-1', 'user-2')

      expect(result.success).toBe(true)
      expect(sharedUsers.value).toEqual([])
      expect(config.unshareApi).toHaveBeenCalledWith('entity-1', 'user-2')
    })

    it('updates local is_shared flag when last user is removed', async () => {
      const entities = ref([{ id: 'entity-1', is_shared: true }])
      const config = createConfig({
        entities,
        updateLocalIsShared: true,
        unshareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { unshareWithUser, sharedUsers } = useEntitySharing(config)
      sharedUsers.value = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]

      await unshareWithUser('entity-1', 'user-2')

      expect(entities.value[0]?.is_shared).toBe(false)
    })

    it('calls onAfterUnshare callback when provided', async () => {
      const onAfterUnshare = vi.fn().mockResolvedValue(undefined)
      const config = createConfig({
        onAfterUnshare,
        unshareApi: vi.fn().mockResolvedValue(undefined),
      })

      const { unshareWithUser } = useEntitySharing(config)

      await unshareWithUser('entity-1', 'user-2')

      expect(onAfterUnshare).toHaveBeenCalledWith('entity-1')
    })

    it('returns failure when user ID is not available and updateLocalIsShared is true', async () => {
      const config = createConfig({
        userId: computed(() => undefined),
        updateLocalIsShared: true,
      })

      const { unshareWithUser } = useEntitySharing(config)

      const result = await unshareWithUser('entity-1', 'user-2')

      expect(result.success).toBe(false)
    })

    it('handles error when unsharing fails', async () => {
      const config = createConfig({
        unshareApi: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      const { unshareWithUser } = useEntitySharing(config)

      const result = await unshareWithUser('entity-1', 'user-2')

      expect(result.success).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('updateUserPermission', () => {
    it('updates user permission successfully', async () => {
      const config = createConfig({
        updatePermissionApi: vi.fn().mockResolvedValue(undefined),
      })

      const { updateUserPermission, sharedUsers } = useEntitySharing(config)
      sharedUsers.value = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]

      const result = await updateUserPermission('entity-1', 'user-2', 'edit')

      expect(result.success).toBe(true)
      expect(sharedUsers.value[0]?.permission_level).toBe('edit')
      expect(config.updatePermissionApi).toHaveBeenCalledWith('entity-1', 'user-2', 'edit')
    })

    it('returns failure when user not found in shared users', async () => {
      const config = createConfig({
        updatePermissionApi: vi.fn().mockResolvedValue(undefined),
      })

      const { updateUserPermission, sharedUsers } = useEntitySharing(config)
      sharedUsers.value = []

      const result = await updateUserPermission('entity-1', 'user-2', 'edit')

      expect(result.success).toBe(false)
    })

    it('handles error when updating permission fails', async () => {
      const config = createConfig({
        updatePermissionApi: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      const { updateUserPermission, sharedUsers } = useEntitySharing(config)
      sharedUsers.value = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]

      const result = await updateUserPermission('entity-1', 'user-2', 'edit')

      expect(result.success).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('searchUsers', () => {
    it('searches users successfully', async () => {
      const mockResults = [
        {
          id: 'user-2',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ]
      const config = createConfig({
        searchUsersApi: vi.fn().mockResolvedValue(mockResults),
      })

      const { searchUsers, userSearchResults } = useEntitySharing(config)

      await searchUsers('john')

      expect(userSearchResults.value).toEqual(mockResults)
      expect(config.searchUsersApi).toHaveBeenCalledWith('john')
    })

    it('clears results when query is empty', async () => {
      const config = createConfig()

      const { searchUsers, userSearchResults } = useEntitySharing(config)
      userSearchResults.value = [
        {
          id: 'user-2',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ]

      await searchUsers('')

      expect(userSearchResults.value).toEqual([])
    })

    it('handles error when searching users fails', async () => {
      const config = createConfig({
        searchUsersApi: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      const { searchUsers } = useEntitySharing(config)

      await searchUsers('john')

      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('clearUserSearch', () => {
    it('clears user search results', () => {
      const config = createConfig()

      const { clearUserSearch, userSearchResults, isSearchingUsers } = useEntitySharing(config)
      userSearchResults.value = [
        {
          id: 'user-2',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ]
      isSearchingUsers.value = true

      clearUserSearch()

      expect(userSearchResults.value).toEqual([])
      expect(isSearchingUsers.value).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const config = createConfig()

      const { reset, sharedUsers, userSearchResults, isSharing, isSearchingUsers } =
        useEntitySharing(config)

      sharedUsers.value = [
        {
          user_id: 'user-2',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01',
        },
      ]
      userSearchResults.value = [
        {
          id: 'user-2',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ]
      isSharing.value = true
      isSearchingUsers.value = true

      reset()

      expect(sharedUsers.value).toEqual([])
      expect(userSearchResults.value).toEqual([])
      expect(isSharing.value).toBe(false)
      expect(isSearchingUsers.value).toBe(false)
    })
  })
})
