import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import {
  getTemplates,
  getTemplateWithItems,
  getTemplateSharedUsers,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  shareTemplate,
  unshareTemplate,
  updateSharePermission,
  createTemplateItems,
  deleteTemplateItems,
  searchUsersByEmail,
  type TemplateInsert,
  type TemplateUpdate,
  type TemplateWithPermission,
  type TemplateItemInsert,
  type TemplateSharedUser,
  type UserSearchResult,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'
import type { CurrencyCode } from 'src/utils/currency'
import type { ActionResult } from 'src/types'

export const useTemplatesStore = defineStore('templates', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const templates = ref<TemplateWithPermission[]>([])
  const isLoading = ref(false)
  const isSharing = ref(false)
  const sharedUsers = ref<TemplateSharedUser[]>([])
  const userSearchResults = ref<UserSearchResult[]>([])
  const isSearchingUsers = ref(false)

  const userId = computed(() => userStore.userProfile?.id)
  const templatesCount = computed(() => templates.value.length)
  const ownedTemplates = computed(() => templates.value.filter((t) => t.owner_id === userId.value))
  const sharedTemplates = computed(() => templates.value.filter((t) => t.owner_id !== userId.value))

  async function loadTemplates() {
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getTemplates(userId.value)

      templates.value = data
    } catch (error) {
      handleError('TEMPLATES.LOAD_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadTemplateWithItems(templateId: string) {
    if (!userId.value) return null

    isLoading.value = true

    try {
      const data = await getTemplateWithItems(templateId, userId.value)

      return data
    } catch (error) {
      handleError('TEMPLATES.LOAD_TEMPLATE_FAILED', error, { templateId })
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function addTemplate(
    templateData: Omit<TemplateInsert, 'owner_id' | 'currency'>,
  ): Promise<ActionResult<TemplateWithPermission>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const userCurrency = userStore.preferences.currency as CurrencyCode

      const newTemplate = await createTemplate({
        ...templateData,
        owner_id: userId.value,
        currency: userCurrency,
      })

      return { success: true, data: newTemplate }
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_TEMPLATE_NAME') {
        handleError('TEMPLATES.DUPLICATE_NAME', error)
      } else {
        handleError('TEMPLATES.CREATE_FAILED', error)
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function editTemplate(
    templateId: string,
    updates: TemplateUpdate,
  ): Promise<ActionResult<TemplateWithPermission>> {
    isLoading.value = true

    try {
      const updatedTemplate = await updateTemplate(templateId, updates)

      return { success: true, data: updatedTemplate }
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_TEMPLATE_NAME') {
        handleError('TEMPLATES.DUPLICATE_NAME', error, { templateId })
      } else {
        handleError('TEMPLATES.UPDATE_FAILED', error, { templateId })
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function removeTemplate(templateId: string): Promise<ActionResult> {
    isLoading.value = true

    try {
      await deleteTemplate(templateId)

      templates.value = templates.value.filter((t) => t.id !== templateId)
      return { success: true }
    } catch (error) {
      handleError('TEMPLATES.DELETE_FAILED', error, { templateId })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function addItemsToTemplate(items: TemplateItemInsert[]): Promise<ActionResult> {
    try {
      await createTemplateItems(items)

      return { success: true }
    } catch (error) {
      handleError('TEMPLATE_ITEMS.CREATE_FAILED', error)
      return { success: false }
    }
  }

  async function removeItemsFromTemplate(ids: string[]): Promise<ActionResult> {
    try {
      await deleteTemplateItems(ids)
      return { success: true }
    } catch (error) {
      handleError('TEMPLATE_ITEMS.DELETE_FAILED', error)
      return { success: false }
    }
  }

  async function loadTemplateShares(templateId: string): Promise<void> {
    isSharing.value = true

    try {
      const data = await getTemplateSharedUsers(templateId)
      sharedUsers.value = data
    } catch (error) {
      handleError('TEMPLATES.LOAD_SHARES_FAILED', error, { templateId })
    } finally {
      isSharing.value = false
    }
  }

  async function shareTemplateWithUser(
    templateId: string,
    userEmail: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isSharing.value = true

    try {
      await shareTemplate(templateId, userEmail, permission, userId.value)

      await Promise.all([loadTemplateShares(templateId), loadTemplates()])
      return { success: true }
    } catch (error) {
      handleError('TEMPLATES.SHARE_FAILED', error, { templateId, userEmail })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function unshareTemplateWithUser(
    templateId: string,
    targetUserId: string,
  ): Promise<ActionResult> {
    isSharing.value = true

    try {
      await unshareTemplate(templateId, targetUserId)

      sharedUsers.value = sharedUsers.value.filter((user) => user.user_id !== targetUserId)

      await loadTemplates()
      return { success: true }
    } catch (error) {
      handleError('TEMPLATES.UNSHARE_FAILED', error, { templateId, targetUserId })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function updateUserPermission(
    templateId: string,
    targetUserId: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    isSharing.value = true

    try {
      await updateSharePermission(templateId, targetUserId, permission)

      const userIndex = sharedUsers.value.findIndex((user) => user.user_id === targetUserId)
      if (userIndex === -1 || !sharedUsers.value[userIndex]) return { success: false }

      sharedUsers.value[userIndex].permission_level = permission
      return { success: true }
    } catch (error) {
      handleError('TEMPLATES.UPDATE_PERMISSION_FAILED', error, { templateId, targetUserId })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function searchUsers(query: string): Promise<void> {
    if (!query.trim()) {
      userSearchResults.value = []
      return
    }

    isSearchingUsers.value = true

    try {
      const results = await searchUsersByEmail(query)
      userSearchResults.value = results
    } catch (error) {
      handleError('USERS.SEARCH_FAILED', error, { query })
    } finally {
      isSearchingUsers.value = false
    }
  }

  function clearUserSearch() {
    userSearchResults.value = []
  }

  function reset() {
    templates.value = []
    sharedUsers.value = []
    userSearchResults.value = []
    isLoading.value = false
    isSharing.value = false
    isSearchingUsers.value = false
  }

  return {
    isLoading,
    isSharing,
    isSearchingUsers,
    templates,
    sharedUsers,
    userSearchResults,
    templatesCount,
    ownedTemplates,
    sharedTemplates,

    loadTemplates,
    loadTemplateWithItems,
    addTemplate,
    editTemplate,
    removeTemplate,
    addItemsToTemplate,
    removeItemsFromTemplate,
    loadTemplateShares,
    shareTemplateWithUser,
    unshareTemplateWithUser,
    updateUserPermission,
    searchUsers,
    clearUserSearch,
    reset,
  }
})
