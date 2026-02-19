import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import {
  useTemplateDetailQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useCreateTemplateItemsMutation,
  useDeleteTemplateItemsMutation,
} from 'src/queries/templates'
import { toActionResult } from 'src/queries/mutation-utils'
import type { CurrencyCode, TemplateWithItems } from 'src/api'
import type { ActionResult } from 'src/types'

export function useTemplate() {
  const route = useRoute()
  const userStore = useUserStore()

  const isNewTemplate = computed(() => route.name === 'new-template')
  const routeTemplateId = computed(() =>
    typeof route.params.id === 'string' ? route.params.id : null,
  )
  const userId = computed(() => userStore.userProfile?.id)

  const templateDetailQuery = useTemplateDetailQuery(routeTemplateId, userId)
  const createTemplateMutation = useCreateTemplateMutation()
  const updateTemplateMutation = useUpdateTemplateMutation()
  const createItemsMutation = useCreateTemplateItemsMutation()
  const deleteItemsMutation = useDeleteTemplateItemsMutation()

  const currentTemplate = computed(
    () =>
      (templateDetailQuery.data.value as
        | (TemplateWithItems & { permission_level?: string })
        | undefined) ?? null,
  )
  const isTemplateLoading = computed(
    () => templateDetailQuery.isPending.value && !isNewTemplate.value,
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
    currency: CurrencyCode,
    total: number,
    templateItems: {
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }[],
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    const templateResult = await toActionResult(() =>
      createTemplateMutation.mutateAsync({
        name,
        duration,
        total,
        currency,
        owner_id: userId.value!,
      }),
    )

    if (!templateResult.success || !templateResult.data) return { success: false }

    const items = templateItems.map((item) => ({
      ...item,
      template_id: templateResult.data!.id,
    }))

    return toActionResult(() =>
      createItemsMutation.mutateAsync({ templateId: templateResult.data!.id, items }),
    )
  }

  async function updateExistingTemplateWithItems(
    name: string,
    duration: string,
    currency: CurrencyCode,
    total: number,
    templateItems: {
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }[],
  ): Promise<ActionResult> {
    if (!routeTemplateId.value || !currentTemplate.value) return { success: false }

    const templateResult = await toActionResult(() =>
      updateTemplateMutation.mutateAsync({
        id: routeTemplateId.value!,
        updates: { name, duration, currency, total },
      }),
    )

    if (!templateResult.success || !templateResult.data) return { success: false }

    const existingItemIds = currentTemplate.value.template_items.map((item) => item.id)
    const removeResult = await toActionResult(() =>
      deleteItemsMutation.mutateAsync({
        templateId: templateResult.data!.id,
        ids: existingItemIds,
      }),
    )

    if (!removeResult.success) return { success: false }

    const items = templateItems.map((item) => {
      const { id: _id, ...itemWithoutId } = item as typeof item & { id?: string }
      return {
        ...itemWithoutId,
        template_id: templateResult.data!.id,
      }
    })

    if (items.length > 0) {
      return toActionResult(() =>
        createItemsMutation.mutateAsync({ templateId: templateResult.data!.id, items }),
      )
    }

    return { success: true }
  }

  async function loadTemplate(): Promise<TemplateWithItems | null> {
    if (isNewTemplate.value || !routeTemplateId.value) return null

    const result = await templateDetailQuery.refetch()
    return result.data ?? null
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
