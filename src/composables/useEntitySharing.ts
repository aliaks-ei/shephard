import { ref, type Ref, type ComputedRef } from 'vue'
import { useError } from 'src/composables/useError'
import type { ActionResult } from 'src/types'
import type { ErrorMessageKey } from 'src/config/error-messages'

export interface SharedUser {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

export interface UserSearchResult {
  id: string
  name: string | null
  email: string
}

export interface ShareableEntity {
  id: string
  is_shared?: boolean
  [key: string]: unknown
}

export interface EntitySharingConfig<TEntity extends ShareableEntity> {
  entityNameSingular: string
  entityNamePlural: string
  entities: Ref<TEntity[]>
  userId: ComputedRef<string | undefined>
  loadSharedUsersApi: (entityId: string) => Promise<SharedUser[]>
  shareApi: (
    entityId: string,
    userEmail: string,
    permission: 'view' | 'edit',
    sharedByUserId: string,
  ) => Promise<void>
  unshareApi: (entityId: string, userId: string) => Promise<void>
  updatePermissionApi: (
    entityId: string,
    userId: string,
    permission: 'view' | 'edit',
  ) => Promise<void>
  searchUsersApi: (query: string) => Promise<UserSearchResult[]>
  updateLocalIsShared?: boolean
  onAfterShare?: (entityId: string) => Promise<void>
  onAfterUnshare?: (entityId: string) => Promise<void>
  handleSpecificErrors?: boolean
}

export function useEntitySharing<TEntity extends ShareableEntity>(
  config: EntitySharingConfig<TEntity>,
) {
  const { handleError } = useError()

  const sharedUsers = ref<SharedUser[]>([])
  const userSearchResults = ref<UserSearchResult[]>([])
  const isSharing = ref(false)
  const isSearchingUsers = ref(false)

  const errorPrefix = config.entityNamePlural.toUpperCase()

  async function loadSharedUsers(entityId: string): Promise<void> {
    isSharing.value = true

    try {
      const users = await config.loadSharedUsersApi(entityId)
      sharedUsers.value = users
    } catch (error) {
      handleError(`${errorPrefix}.LOAD_SHARED_USERS_FAILED` as ErrorMessageKey, error, {
        entityId,
      })
    } finally {
      isSharing.value = false
    }
  }

  async function shareWithUser(
    entityId: string,
    userEmail: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    if (!config.userId.value) return { success: false }

    isSharing.value = true

    try {
      await config.shareApi(entityId, userEmail, permission, config.userId.value)

      // Update local is_shared flag if configured
      if (config.updateLocalIsShared) {
        const entityIndex = config.entities.value.findIndex((e) => e.id === entityId)
        if (entityIndex !== -1 && config.entities.value[entityIndex]) {
          config.entities.value[entityIndex].is_shared = true
        }
      }

      // Call after-share callback if provided
      if (config.onAfterShare) {
        await config.onAfterShare(entityId)
      }

      return { success: true }
    } catch (error) {
      // Handle specific error types if configured (for plans)
      if (config.handleSpecificErrors && error instanceof Error) {
        if (error.message.includes('User not found')) {
          handleError(`${errorPrefix}.USER_NOT_FOUND` as ErrorMessageKey, error, { userEmail })
        } else if (error.message.includes('already shared')) {
          handleError(`${errorPrefix}.ALREADY_SHARED` as ErrorMessageKey, error, { userEmail })
        } else {
          handleError(`${errorPrefix}.SHARE_FAILED` as ErrorMessageKey, error, {
            entityId,
            userEmail,
          })
        }
      } else {
        handleError(`${errorPrefix}.SHARE_FAILED` as ErrorMessageKey, error, {
          entityId,
          userEmail,
        })
      }
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function unshareWithUser(entityId: string, targetUserId: string): Promise<ActionResult> {
    if (!config.userId.value && config.updateLocalIsShared) return { success: false }

    isSharing.value = true

    try {
      await config.unshareApi(entityId, targetUserId)

      sharedUsers.value = sharedUsers.value.filter((user) => user.user_id !== targetUserId)

      if (config.updateLocalIsShared && sharedUsers.value.length === 0) {
        const entityIndex = config.entities.value.findIndex((e) => e.id === entityId)
        if (entityIndex !== -1 && config.entities.value[entityIndex]) {
          config.entities.value[entityIndex].is_shared = false
        }
      }

      if (config.onAfterUnshare) {
        await config.onAfterUnshare(entityId)
      }

      return { success: true }
    } catch (error) {
      handleError(`${errorPrefix}.UNSHARE_FAILED` as ErrorMessageKey, error, {
        entityId,
        targetUserId,
      })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function updateUserPermission(
    entityId: string,
    targetUserId: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    isSharing.value = true

    try {
      await config.updatePermissionApi(entityId, targetUserId, permission)

      // Update local state
      const userIndex = sharedUsers.value.findIndex((user) => user.user_id === targetUserId)
      if (userIndex === -1 || !sharedUsers.value[userIndex]) return { success: false }

      sharedUsers.value[userIndex].permission_level = permission
      return { success: true }
    } catch (error) {
      handleError(`${errorPrefix}.UPDATE_PERMISSION_FAILED` as ErrorMessageKey, error, {
        entityId,
        targetUserId,
        permission,
      })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function searchUsers(query: string): Promise<void> {
    if (!query.trim()) {
      clearUserSearch()
      return
    }

    isSearchingUsers.value = true

    try {
      const results = await config.searchUsersApi(query)
      userSearchResults.value = results
    } catch (error) {
      handleError(`${errorPrefix}.SEARCH_USERS_FAILED` as ErrorMessageKey, error, { query })
    } finally {
      isSearchingUsers.value = false
    }
  }

  function clearUserSearch() {
    userSearchResults.value = []
    isSearchingUsers.value = false
  }

  function reset() {
    sharedUsers.value = []
    userSearchResults.value = []
    isSharing.value = false
    isSearchingUsers.value = false
  }

  return {
    sharedUsers,
    userSearchResults,
    isSharing,
    isSearchingUsers,
    loadSharedUsers,
    shareWithUser,
    unshareWithUser,
    updateUserPermission,
    searchUsers,
    clearUserSearch,
    reset,
  }
}
