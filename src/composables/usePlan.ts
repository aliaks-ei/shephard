import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useUserStore } from 'src/stores/user'
import { usePlansStore } from 'src/stores/plans'
import { canEditPlan } from 'src/utils/plans'
import type { CurrencyCode, PlanWithItems } from 'src/api'

export function usePlan() {
  const route = useRoute()
  const userStore = useUserStore()
  const plansStore = usePlansStore()

  const currentPlan = ref<(PlanWithItems & { permission_level?: string }) | null>(null)
  const isPlanLoading = ref(false)

  const isNewPlan = computed(() => route.name === 'new-plan')
  const routePlanId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
  const isOwner = computed(() => {
    if (!currentPlan.value || !userStore.userProfile) return false
    return currentPlan.value.owner_id === userStore.userProfile.id
  })

  const isReadOnlyMode = computed(() => {
    if (isNewPlan.value) return false
    if (isOwner.value) return false
    return currentPlan.value?.permission_level === 'view'
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
      return userStore.preferences.currency as CurrencyCode
    }

    return currentPlan.value?.currency as CurrencyCode
  })

  async function createNewPlanWithItems(
    templateId: string,
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: { name: string; category_id: string; amount: number }[],
  ): Promise<boolean> {
    const plan = await plansStore.addPlan({
      template_id: templateId,
      name,
      start_date: startDate,
      end_date: endDate,
      total,
    })

    if (!plan) return false

    const items = planItems.map((item) => ({
      ...item,
      plan_id: plan.id,
    }))

    await plansStore.savePlanItems(plan.id, items)

    return true
  }

  async function updateExistingPlanWithItems(
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: { name: string; category_id: string; amount: number }[],
  ): Promise<boolean> {
    if (!routePlanId.value || !currentPlan.value) return false

    const plan = await plansStore.editPlan(routePlanId.value, {
      name,
      start_date: startDate,
      end_date: endDate,
      total,
    })

    if (!plan) return false

    const existingItemIds = currentPlan.value.plan_items.map((item) => item.id)
    await plansStore.removePlanItems(existingItemIds)

    const items = planItems.map((item) => ({
      ...item,
      plan_id: plan.id,
    }))

    if (items.length > 0) {
      await plansStore.savePlanItems(plan.id, items)
    }

    return true
  }

  async function loadPlan(): Promise<PlanWithItems | null> {
    if (isNewPlan.value || !routePlanId.value) return null

    currentPlan.value = await plansStore.loadPlanWithItems(routePlanId.value)

    return currentPlan.value
  }

  async function cancelCurrentPlan(): Promise<void> {
    if (!routePlanId.value) return

    await plansStore.cancelPlan(routePlanId.value)

    if (currentPlan.value) {
      currentPlan.value.status = 'cancelled'
    }
  }

  return {
    currentPlan,
    isPlanLoading,
    isNewPlan,
    routePlanId,
    isOwner,
    isReadOnlyMode,
    isEditMode,
    canEditPlanData,
    planCurrency,
    createNewPlanWithItems,
    updateExistingPlanWithItems,
    loadPlan,
    cancelCurrentPlan,
  }
}
