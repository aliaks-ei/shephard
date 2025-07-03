import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import {
  getExpenseTemplates,
  getExpenseTemplateWithItems,
  getTemplateSharedUsers,
  createExpenseTemplate,
  updateExpenseTemplate,
  deleteExpenseTemplate,
  shareTemplate,
  unshareTemplate,
  updateSharePermission,
  createExpenseTemplateItems,
  deleteExpenseTemplateItems,
  searchUsersByEmail,
  type ExpenseTemplateInsert,
  type ExpenseTemplateUpdate,
  type ExpenseTemplateWithPermission,
  type ExpenseTemplateItemInsert,
  type TemplateSharedUser,
  type UserSearchResult,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'
import type { CurrencyCode } from 'src/utils/currency'

export const useTemplatesStore = defineStore('templates', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const templates = ref<ExpenseTemplateWithPermission[]>([])
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
      const data = await getExpenseTemplates(userId.value)

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
      const data = await getExpenseTemplateWithItems(templateId, userId.value)

      return data
    } catch (error) {
      handleError('TEMPLATES.LOAD_TEMPLATE_FAILED', error, { templateId })
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function addTemplate(templateData: Omit<ExpenseTemplateInsert, 'owner_id' | 'currency'>) {
    if (!userId.value) return

    isLoading.value = true

    try {
      // Get user's preferred currency for new templates
      const userCurrency = userStore.preferences.currency as CurrencyCode

      const newTemplate = await createExpenseTemplate({
        ...templateData,
        owner_id: userId.value,
        currency: userCurrency,
      })

      return newTemplate
    } catch (error) {
      // Handle specific duplicate name error
      if (error instanceof Error && error.name === 'DUPLICATE_TEMPLATE_NAME') {
        handleError('TEMPLATES.DUPLICATE_NAME', error)
      } else {
        handleError('TEMPLATES.CREATE_FAILED', error)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function editTemplate(templateId: string, updates: ExpenseTemplateUpdate) {
    isLoading.value = true

    try {
      const updatedTemplate = await updateExpenseTemplate(templateId, updates)

      return updatedTemplate
    } catch (error) {
      // Handle specific duplicate name error
      if (error instanceof Error && error.name === 'DUPLICATE_TEMPLATE_NAME') {
        handleError('TEMPLATES.DUPLICATE_NAME', error, { templateId })
      } else {
        handleError('TEMPLATES.UPDATE_FAILED', error, { templateId })
      }
    } finally {
      isLoading.value = false
    }
  }

  async function removeTemplate(templateId: string) {
    isLoading.value = true

    try {
      await deleteExpenseTemplate(templateId)

      templates.value = templates.value.filter((t) => t.id !== templateId)
    } catch (error) {
      handleError('TEMPLATES.DELETE_FAILED', error, { templateId })
    } finally {
      isLoading.value = false
    }
  }

  async function addItemsToTemplate(items: ExpenseTemplateItemInsert[]) {
    try {
      const newItems = await createExpenseTemplateItems(items)

      return newItems
    } catch (error) {
      handleError('TEMPLATE_ITEMS.CREATE_FAILED', error)
    }
  }

  async function removeItemsFromTemplate(ids: string[]) {
    try {
      await deleteExpenseTemplateItems(ids)
    } catch (error) {
      handleError('TEMPLATE_ITEMS.DELETE_FAILED', error)
    }
  }

  async function loadTemplateShares(templateId: string) {
    isSharing.value = true

    try {
      const data = await getTemplateSharedUsers(templateId)
      sharedUsers.value = data
      return data
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
  ) {
    if (!userId.value) return

    isSharing.value = true

    try {
      await shareTemplate(templateId, userEmail, permission, userId.value)

      await Promise.all([loadTemplateShares(templateId), loadTemplates()])
    } catch (error) {
      handleError('TEMPLATES.SHARE_FAILED', error, { templateId, userEmail })
    } finally {
      isSharing.value = false
    }
  }

  async function unshareTemplateWithUser(templateId: string, targetUserId: string) {
    isSharing.value = true

    try {
      await unshareTemplate(templateId, targetUserId)

      // Remove from local state
      sharedUsers.value = sharedUsers.value.filter((user) => user.user_id !== targetUserId)

      // Refresh templates to update share counts
      await loadTemplates()
    } catch (error) {
      handleError('TEMPLATES.UNSHARE_FAILED', error, { templateId, targetUserId })
    } finally {
      isSharing.value = false
    }
  }

  async function updateUserPermission(
    templateId: string,
    targetUserId: string,
    permission: 'view' | 'edit',
  ) {
    isSharing.value = true

    try {
      await updateSharePermission(templateId, targetUserId, permission)

      const userIndex = sharedUsers.value.findIndex((user) => user.user_id === targetUserId)
      if (userIndex === -1 || !sharedUsers.value[userIndex]) return

      sharedUsers.value[userIndex].permission_level = permission
    } catch (error) {
      handleError('TEMPLATES.UPDATE_PERMISSION_FAILED', error, { templateId, targetUserId })
    } finally {
      isSharing.value = false
    }
  }

  async function searchUsers(query: string) {
    if (!query.trim()) {
      userSearchResults.value = []
      return []
    }

    isSearchingUsers.value = true

    try {
      const results = await searchUsersByEmail(query)
      userSearchResults.value = results
      return results
    } catch (error) {
      handleError('USERS.SEARCH_FAILED', error, { query })
      return []
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
