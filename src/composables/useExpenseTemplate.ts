import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import { useTemplatesStore } from 'src/stores/templates'
import type { CurrencyCode, ExpenseTemplateWithItems } from 'src/api'

export function useExpenseTemplate() {
  const route = useRoute()
  const userStore = useUserStore()
  const templatesStore = useTemplatesStore()

  const currentTemplate = ref<(ExpenseTemplateWithItems & { permission_level?: string }) | null>(
    null,
  )
  const isTemplateLoading = ref(false)

  const isNewTemplate = computed(() => route.name === 'new-template')
  const routeTemplateId = computed(() =>
    typeof route.params.id === 'string' ? route.params.id : null,
  )
  const isOwner = computed(() => {
    if (!currentTemplate.value || !userStore.userProfile) return false
    return currentTemplate.value.owner_id === userStore.userProfile.id
  })

  const isReadOnlyMode = computed(() => {
    if (isNewTemplate.value) return false
    if (isOwner.value) return false
    return currentTemplate.value?.permission_level === 'view'
  })

  const isEditMode = computed(() => {
    if (isNewTemplate.value) return true
    if (isOwner.value) return true
    return currentTemplate.value?.permission_level === 'edit'
  })

  const templateCurrency = computed((): CurrencyCode => {
    if (isNewTemplate.value) {
      return userStore.preferences.currency as CurrencyCode
    }

    return currentTemplate.value?.currency as CurrencyCode
  })

  async function createNewTemplateWithItems(
    name: string,
    duration: string,
    total: number,
    templateItems: { name: string; category_id: string; amount: number }[],
  ): Promise<boolean> {
    const template = await templatesStore.addTemplate({
      name,
      duration,
      total,
    })

    if (!template) return false

    const items = templateItems.map((item) => ({
      ...item,
      template_id: template.id,
    }))

    await templatesStore.addItemsToTemplate(items)

    return true
  }

  async function updateExistingTemplateWithItems(
    name: string,
    duration: string,
    total: number,
    templateItems: { name: string; category_id: string; amount: number }[],
  ): Promise<boolean> {
    if (!routeTemplateId.value || !currentTemplate.value) return false

    const template = await templatesStore.editTemplate(routeTemplateId.value, {
      name,
      duration,
      total,
    })

    if (!template) return false

    const existingItemIds = currentTemplate.value.expense_template_items.map((item) => item.id)
    await templatesStore.removeItemsFromTemplate(existingItemIds)

    const items = templateItems.map((item) => ({
      ...item,
      template_id: template.id,
    }))

    if (items.length > 0) {
      await templatesStore.addItemsToTemplate(items)
    }

    return true
  }

  async function loadTemplate(): Promise<ExpenseTemplateWithItems | null> {
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
    isReadOnlyMode,
    isEditMode,
    templateCurrency,
    createNewTemplateWithItems,
    updateExistingTemplateWithItems,
    loadTemplate,
  }
}
