import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import {
  getTemplates,
  getTemplateWithCategories,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTemplateCategories,
  deleteTemplateCategories,
  type TemplateInsert,
  type TemplateUpdate,
  type Template,
  type TemplateCategoryInsert,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'

export const useTemplatesStore = defineStore('templates', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const templates = ref<Template[]>([])
  const isLoading = ref(false)

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
      handleError('TEMPLATES.LOAD_FAILED', error, { userId: userId.value })
    } finally {
      isLoading.value = false
    }
  }

  async function loadTemplateWithItems(templateId: string) {
    isLoading.value = true

    try {
      const data = await getTemplateWithCategories(templateId)

      return data
    } catch (error) {
      handleError('TEMPLATES.LOAD_TEMPLATE_FAILED', error, { templateId })
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function addTemplate(templateData: Omit<TemplateInsert, 'owner_id'>) {
    if (!userId.value) return

    isLoading.value = true

    try {
      const newTemplate = await createTemplate({
        ...templateData,
        owner_id: userId.value,
      })

      return newTemplate
    } catch (error) {
      handleError('TEMPLATES.CREATE_FAILED', error, { userId: userId.value })
    } finally {
      isLoading.value = false
    }
  }

  async function editTemplate(templateId: string, updates: TemplateUpdate) {
    isLoading.value = true

    try {
      const updatedTemplate = await updateTemplate(templateId, updates)

      return updatedTemplate
    } catch (error) {
      handleError('TEMPLATES.UPDATE_FAILED', error, { templateId })
    } finally {
      isLoading.value = false
    }
  }

  async function removeTemplate(templateId: string) {
    isLoading.value = true

    try {
      await deleteTemplate(templateId)

      templates.value = templates.value.filter((t) => t.id !== templateId)
    } catch (error) {
      handleError('TEMPLATES.DELETE_FAILED', error, { templateId })
    } finally {
      isLoading.value = false
    }
  }

  async function addCategoriesToTemplate(items: TemplateCategoryInsert[]) {
    try {
      const newItems = await createTemplateCategories(items)

      return newItems
    } catch (error) {
      handleError('TEMPLATE_CATEGORIES.CREATE_FAILED', error)
    }
  }

  async function removeCategoriesFromTemplate(ids: string[]) {
    try {
      await deleteTemplateCategories(ids)
    } catch (error) {
      handleError('TEMPLATE_CATEGORIES.DELETE_FAILED', error)
    }
  }

  function reset() {
    templates.value = []
    isLoading.value = false
  }

  return {
    isLoading,
    templates,
    templatesCount,
    ownedTemplates,
    sharedTemplates,

    loadTemplates,
    loadTemplateWithItems,
    addTemplate,
    editTemplate,
    removeTemplate,
    addCategoriesToTemplate,
    removeCategoriesFromTemplate,
    reset,
  }
})
