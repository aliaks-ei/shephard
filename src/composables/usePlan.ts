import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import {
  usePlanDetailQuery,
  useCreatePlanWithItemsMutation,
  useUpdatePlanMutation,
  useUpdatePlanWithItemsMutation,
} from 'src/queries/plans'
import { toActionResult } from 'src/queries/mutation-utils'
import { resolveDetailLoadState } from 'src/composables/useDetailPageState'
import { canAddExpensesToPlan, canEditPlan } from 'src/utils/plans'
import type { CurrencyCode, PlanWithItems } from 'src/api'
import type { ActionResult } from 'src/types'
import { useNotificationEvents } from './useNotificationEvents'
import { useNetworkStatus } from './useNetworkStatus'

export function usePlan() {
  const route = useRoute()
  const userStore = useUserStore()
  const { emitNotificationEvent } = useNotificationEvents()
  const { isOnline } = useNetworkStatus()

  const isNewPlan = computed(() => route.name === 'new-plan')
  const routePlanId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
  const userId = computed(() => userStore.userProfile?.id)

  const planDetailQuery = usePlanDetailQuery(routePlanId, userId)
  const createPlanWithItemsMutation = useCreatePlanWithItemsMutation()
  const updatePlanMutation = useUpdatePlanMutation()
  const updatePlanWithItemsMutation = useUpdatePlanWithItemsMutation()

  const currentPlan = computed(
    () =>
      (planDetailQuery.data.value as (PlanWithItems & { permission_level?: string }) | undefined) ??
      null,
  )
  const isPlanLoading = computed(() => !isNewPlan.value && planDetailQuery.isPending.value)
  const isPlanRetrying = computed(
    () => !isNewPlan.value && (planDetailQuery.isFetching?.value ?? false),
  )
  const detailState = computed(() =>
    resolveDetailLoadState({
      isNew: isNewPlan.value,
      isPending: planDetailQuery.isPending.value,
      data: currentPlan.value,
      isError: planDetailQuery.isError?.value ?? false,
      error: planDetailQuery.error?.value,
      isOnline: isOnline.value,
    }),
  )

  const isOwner = computed(() => {
    if (!currentPlan.value || !userStore.userProfile) return false
    return currentPlan.value.owner_id === userStore.userProfile.id
  })

  const isEditMode = computed(() => {
    if (isNewPlan.value) return true
    if (isOwner.value) return true
    return currentPlan.value?.permission_level === 'edit'
  })

  const canEditPlanData = computed(() => {
    if (!currentPlan.value) return false
    return canEditPlan(currentPlan.value, isOwner.value)
  })

  const canAddExpenses = computed(() => {
    if (!currentPlan.value) return false
    return canAddExpensesToPlan(currentPlan.value, isOwner.value)
  })

  const planCurrency = computed((): CurrencyCode => {
    if (isNewPlan.value) {
      return (userStore.preferences.currency as CurrencyCode) || 'EUR'
    }

    return (
      ((currentPlan.value?.currency || userStore.preferences.currency) as CurrencyCode) || 'EUR'
    )
  })

  async function createNewPlanWithItems(
    templateId: string,
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: Array<{
      id?: string
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }>,
  ): Promise<ActionResult<PlanWithItems>> {
    if (!userId.value) return { success: false }

    const userCurrency = userStore.preferences.currency as CurrencyCode
    return toActionResult(() =>
      createPlanWithItemsMutation.mutateAsync({
        plan: {
          template_id: templateId,
          name,
          start_date: startDate,
          end_date: endDate,
          total,
          currency: userCurrency,
          status: 'active',
        },
        items: planItems.map(({ id: _id, ...item }) => item),
      }),
    )
  }

  async function updateExistingPlanWithItems(
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: Array<{
      id?: string
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }>,
  ): Promise<ActionResult<PlanWithItems>> {
    if (!routePlanId.value || !currentPlan.value) return { success: false }

    const planResult = await toActionResult(() =>
      updatePlanWithItemsMutation.mutateAsync({
        id: routePlanId.value!,
        updates: {
          name,
          start_date: startDate,
          end_date: endDate,
          total,
        },
        items: planItems,
      }),
    )

    if (!planResult.success || !planResult.data) return { success: false }

    await emitNotificationEvent({
      type: 'shared_plan_updated',
      entityType: 'plan',
      entityId: planResult.data.id,
    })

    return planResult
  }

  async function loadPlan(): Promise<PlanWithItems | null> {
    if (isNewPlan.value || !routePlanId.value) return null

    const result = await planDetailQuery.refetch()
    return result.data ?? null
  }

  async function cancelCurrentPlan(): Promise<ActionResult> {
    if (!routePlanId.value) return { success: false }

    const result = await toActionResult(() =>
      updatePlanMutation.mutateAsync({
        id: routePlanId.value!,
        updates: { status: 'cancelled' },
      }),
    )

    if (result.success) {
      await emitNotificationEvent({
        type: 'shared_plan_cancelled',
        entityType: 'plan',
        entityId: routePlanId.value,
      })
    }

    return result
  }

  return {
    currentPlan,
    isPlanLoading,
    isPlanRetrying,
    detailState,
    isNewPlan,
    routePlanId,
    isOwner,
    isEditMode,
    canEditPlanData,
    canAddExpenses,
    planCurrency,
    createNewPlanWithItems,
    updateExistingPlanWithItems,
    loadPlan,
    cancelCurrentPlan,
  }
}
