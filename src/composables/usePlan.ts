import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import {
  usePlanDetailQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useSavePlanItemsMutation,
  useUpdatePlanItemsMutation,
  useDeletePlanItemsMutation,
} from 'src/queries/plans'
import { toActionResult } from 'src/queries/mutation-utils'
import { canEditPlan } from 'src/utils/plans'
import type { CurrencyCode, PlanWithItems } from 'src/api'
import type { ActionResult } from 'src/types'

export function usePlan() {
  const route = useRoute()
  const userStore = useUserStore()

  const isNewPlan = computed(() => route.name === 'new-plan')
  const routePlanId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
  const userId = computed(() => userStore.userProfile?.id)

  const planDetailQuery = usePlanDetailQuery(routePlanId, userId)
  const createPlanMutation = useCreatePlanMutation()
  const updatePlanMutation = useUpdatePlanMutation()
  const savePlanItemsMutation = useSavePlanItemsMutation()
  const updatePlanItemsMutation = useUpdatePlanItemsMutation()
  const deletePlanItemsMutation = useDeletePlanItemsMutation()

  const currentPlan = computed(
    () =>
      (planDetailQuery.data.value as (PlanWithItems & { permission_level?: string }) | undefined) ??
      null,
  )
  const isPlanLoading = computed(() => !isNewPlan.value && planDetailQuery.isPending.value)

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
    const planResult = await toActionResult(() =>
      createPlanMutation.mutateAsync({
        template_id: templateId,
        name,
        start_date: startDate,
        end_date: endDate,
        total,
        owner_id: userId.value!,
        currency: userCurrency,
        status: 'active',
      }),
    )

    if (!planResult.success || !planResult.data) return { success: false }

    const items = planItems.map((item) => ({
      name: item.name,
      category_id: item.category_id,
      amount: item.amount,
      is_fixed_payment: item.is_fixed_payment,
      plan_id: planResult.data!.id,
    }))

    const itemsResult = await toActionResult(() =>
      savePlanItemsMutation.mutateAsync({ planId: planResult.data!.id, items }),
    )

    if (!itemsResult.success) return { success: false }

    return { success: true, data: planResult.data as PlanWithItems }
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
      updatePlanMutation.mutateAsync({
        id: routePlanId.value!,
        updates: {
          name,
          start_date: startDate,
          end_date: endDate,
          total,
        },
      }),
    )

    if (!planResult.success || !planResult.data) return { success: false }

    const itemsToUpdate = planItems.filter((item) => item.id)
    const itemsToCreate = planItems.filter((item) => !item.id)

    const newItemIds = new Set(itemsToUpdate.map((item) => item.id))
    const itemsToDelete = currentPlan.value.plan_items
      .filter((existingItem) => !newItemIds.has(existingItem.id))
      .map((item) => item.id)

    const operations: Array<Promise<ActionResult>> = []

    if (itemsToUpdate.length > 0) {
      operations.push(
        toActionResult(() =>
          updatePlanItemsMutation.mutateAsync({
            planId: planResult.data!.id,
            items: itemsToUpdate.map((item) => ({
              id: item.id!,
              plan_id: planResult.data!.id,
              name: item.name,
              category_id: item.category_id,
              amount: item.amount,
              is_fixed_payment: item.is_fixed_payment,
            })),
          }),
        ),
      )
    }

    if (itemsToCreate.length > 0) {
      const newItems = itemsToCreate.map((item) => ({
        name: item.name,
        category_id: item.category_id,
        amount: item.amount,
        is_fixed_payment: item.is_fixed_payment,
        plan_id: planResult.data!.id,
      }))
      operations.push(
        toActionResult(() =>
          savePlanItemsMutation.mutateAsync({ planId: planResult.data!.id, items: newItems }),
        ),
      )
    }

    if (itemsToDelete.length > 0) {
      operations.push(
        toActionResult(() =>
          deletePlanItemsMutation.mutateAsync({
            planId: planResult.data!.id,
            itemIds: itemsToDelete,
          }),
        ),
      )
    }

    const results = await Promise.all(operations)

    if (results.some((result) => !result.success)) {
      return { success: false }
    }

    const refreshed = await loadPlan()
    if (!refreshed) return { success: false }

    return { success: true, data: refreshed }
  }

  async function loadPlan(): Promise<PlanWithItems | null> {
    if (isNewPlan.value || !routePlanId.value) return null

    const result = await planDetailQuery.refetch()
    return result.data ?? null
  }

  async function cancelCurrentPlan(): Promise<ActionResult> {
    if (!routePlanId.value) return { success: false }

    return toActionResult(() =>
      updatePlanMutation.mutateAsync({
        id: routePlanId.value!,
        updates: { status: 'cancelled' },
      }),
    )
  }

  return {
    currentPlan,
    isPlanLoading,
    isNewPlan,
    routePlanId,
    isOwner,
    isEditMode,
    canEditPlanData,
    planCurrency,
    createNewPlanWithItems,
    updateExistingPlanWithItems,
    loadPlan,
    cancelCurrentPlan,
  }
}
