import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import {
  useTemplateDetailQuery,
  useCreateTemplateWithItemsMutation,
  useUpdateTemplateWithItemsMutation,
} from 'src/queries/templates'
import { toActionResult } from 'src/queries/mutation-utils'
import { resolveDetailLoadState } from 'src/composables/useDetailPageState'
import type { CurrencyCode, TemplateWithItems } from 'src/api'
import type { ActionResult } from 'src/types'
import { useNotificationEvents } from './useNotificationEvents'
import { useNetworkStatus } from './useNetworkStatus'

export function useTemplate() {
  const route = useRoute()
  const userStore = useUserStore()
  const { emitNotificationEvent } = useNotificationEvents()
  const { isOnline } = useNetworkStatus()

  const isNewTemplate = computed(() => route.name === 'new-template')
  const routeTemplateId = computed(() =>
    typeof route.params.id === 'string' ? route.params.id : null,
  )
  const userId = computed(() => userStore.userProfile?.id)

  const templateDetailQuery = useTemplateDetailQuery(routeTemplateId, userId)
  const createTemplateWithItemsMutation = useCreateTemplateWithItemsMutation()
  const updateTemplateWithItemsMutation = useUpdateTemplateWithItemsMutation()

  const currentTemplate = computed(
    () =>
      (templateDetailQuery.data.value as
        | (TemplateWithItems & { permission_level?: string })
        | undefined) ?? null,
  )
  const isTemplateLoading = computed(
    () => templateDetailQuery.isPending.value && !isNewTemplate.value,
  )
  const isTemplateRetrying = computed(
    () => !isNewTemplate.value && (templateDetailQuery.isFetching?.value ?? false),
  )
  const detailState = computed(() =>
    resolveDetailLoadState({
      isNew: isNewTemplate.value,
      isPending: templateDetailQuery.isPending.value,
      data: currentTemplate.value,
      isError: templateDetailQuery.isError?.value ?? false,
      error: templateDetailQuery.error?.value,
      isOnline: isOnline.value,
    }),
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

    return toActionResult(() =>
      createTemplateWithItemsMutation.mutateAsync({
        template: {
          name,
          duration,
          total,
          currency,
        },
        items: templateItems,
      }),
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
      updateTemplateWithItemsMutation.mutateAsync({
        id: routeTemplateId.value!,
        updates: { name, duration, currency, total },
        items: templateItems,
      }),
    )

    if (!templateResult.success || !templateResult.data) return { success: false }

    await emitNotificationEvent({
      type: 'shared_template_updated',
      entityType: 'template',
      entityId: templateResult.data.id,
    })

    return templateResult
  }

  async function loadTemplate(): Promise<TemplateWithItems | null> {
    if (isNewTemplate.value || !routeTemplateId.value) return null

    const result = await templateDetailQuery.refetch()
    return result.data ?? null
  }

  return {
    currentTemplate,
    isTemplateLoading,
    isTemplateRetrying,
    detailState,
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
