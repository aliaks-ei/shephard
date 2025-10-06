import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import { useTemplatesStore } from 'src/stores/templates'
import type { CurrencyCode, TemplateWithItems } from 'src/api'
import type { ActionResult } from 'src/types'

export function useTemplate() {
  const route = useRoute()
  const userStore = useUserStore()
  const templatesStore = useTemplatesStore()

  const currentTemplate = ref<(TemplateWithItems & { permission_level?: string }) | null>(null)
  const isTemplateLoading = ref(false)

  const isNewTemplate = computed(() => route.name === 'new-template')
  const routeTemplateId = computed(() =>
    typeof route.params.id === 'string' ? route.params.id : null,
  )
  const isOwner = computed(() => {
    if (!currentTemplate.value || !userStore.userProfile) return false
    return currentTemplate.value.owner_id === userStore.userProfile.id
  })

  const isEditMode = computed(() => {
    if (isNewTemplate.value) return true
    if (isOwner.value) return true
    return currentTemplate.value?.permission_level === 'edit'
  })

  const templateCurrency = computed((): CurrencyCode => {
    if (isNewTemplate.value) {
      return (userStore.preferences.currency as CurrencyCode) || 'EUR'
    }

    return (currentTemplate.value?.currency as CurrencyCode) || 'EUR'
  })

  async function createNewTemplateWithItems(
    name: string,
    duration: string,
    total: number,
    templateItems: { name: string; category_id: string; amount: number }[],
  ): Promise<ActionResult> {
    const templateResult = await templatesStore.addTemplate({
      name,
      duration,
      total,
    })

    if (!templateResult.success || !templateResult.data) return { success: false }

    const items = templateItems.map((item) => ({
      ...item,
      template_id: templateResult.data!.id,
    }))

    const itemsResult = await templatesStore.addItemsToTemplate(items)

    return itemsResult
  }

  async function updateExistingTemplateWithItems(
    name: string,
    duration: string,
    total: number,
    templateItems: { name: string; category_id: string; amount: number }[],
  ): Promise<ActionResult> {
    if (!routeTemplateId.value || !currentTemplate.value) return { success: false }

    const templateResult = await templatesStore.editTemplate(routeTemplateId.value, {
      name,
      duration,
      total,
    })

    if (!templateResult.success || !templateResult.data) return { success: false }

    const existingItemIds = currentTemplate.value.template_items.map((item) => item.id)
    const removeResult = await templatesStore.removeItemsFromTemplate(existingItemIds)

    if (!removeResult.success) return { success: false }

    const items = templateItems.map((item) => ({
      ...item,
      template_id: templateResult.data!.id,
    }))

    if (items.length > 0) {
      const addResult = await templatesStore.addItemsToTemplate(items)
      return addResult
    }

    return { success: true }
  }

  async function loadTemplate(): Promise<TemplateWithItems | null> {
    if (isNewTemplate.value || !routeTemplateId.value) return null

    currentTemplate.value = await templatesStore.loadTemplateWithItems(routeTemplateId.value)

    return currentTemplate.value
  }

  return {
    currentTemplate,
    isTemplateLoading,
    isNewTemplate,
    routeTemplateId,
    isOwner,
    isEditMode,
    templateCurrency,
    createNewTemplateWithItems,
    updateExistingTemplateWithItems,
    loadTemplate,
  }
}
