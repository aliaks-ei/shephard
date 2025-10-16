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
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useEntitySharing } from 'src/composables/useEntitySharing'
import { useUserStore } from 'src/stores/user'
import type { ActionResult } from 'src/types'

export const useTemplatesStore = defineStore('templates', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const templates = ref<TemplateWithPermission[]>([])
  const isLoading = ref(false)

  const userId = computed(() => userStore.userProfile?.id)
  const templatesCount = computed(() => templates.value.length)
  const ownedTemplates = computed(() => templates.value.filter((t) => t.owner_id === userId.value))
  const sharedTemplates = computed(() => templates.value.filter((t) => t.owner_id !== userId.value))

  // Entity sharing functionality
  const sharing = useEntitySharing({
    entityNameSingular: 'template',
    entityNamePlural: 'templates',
    entities: templates,
    userId,
    loadSharedUsersApi: getTemplateSharedUsers,
    shareApi: shareTemplate,
    unshareApi: unshareTemplate,
    updatePermissionApi: updateSharePermission,
    searchUsersApi: searchUsersByEmail,
    updateLocalIsShared: false,
    onAfterShare: async (templateId) => {
      await Promise.all([sharing.loadSharedUsers(templateId), loadTemplates()])
    },
    onAfterUnshare: async () => {
      await loadTemplates()
    },
    handleSpecificErrors: false,
  })

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
    templateData: Omit<TemplateInsert, 'owner_id'>,
  ): Promise<ActionResult<TemplateWithPermission>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const newTemplate = await createTemplate({
        ...templateData,
        owner_id: userId.value,
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

  function reset() {
    templates.value = []
    isLoading.value = false
    sharing.reset()
  }

  return {
    isLoading,
    isSharing: sharing.isSharing,
    isSearchingUsers: sharing.isSearchingUsers,
    templates,
    sharedUsers: sharing.sharedUsers,
    userSearchResults: sharing.userSearchResults,
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
    loadTemplateShares: sharing.loadSharedUsers,
    shareTemplateWithUser: sharing.shareWithUser,
    unshareTemplateWithUser: sharing.unshareWithUser,
    updateUserPermission: sharing.updateUserPermission,
    searchUsers: sharing.searchUsers,
    clearUserSearch: sharing.clearUserSearch,
    reset,
  }
})
