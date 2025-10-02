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
  const currentTab = computed(() => {
    if (route.name === 'plan-overview') return 'overview'
    if (route.name === 'plan-items') return 'items'
    if (route.name === 'plan-edit') return 'edit'
    return 'overview' // default
  })
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
      return userStore.preferences.currency as CurrencyCode
    }

    return (currentPlan.value?.currency || userStore.preferences.currency) as CurrencyCode
  })

  async function createNewPlanWithItems(
    templateId: string,
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: Array<{ id?: string; name: string; category_id: string; amount: number }>,
  ): Promise<PlanWithItems | null> {
    const plan = await plansStore.addPlan({
      template_id: templateId,
      name,
      start_date: startDate,
      end_date: endDate,
      total,
    })

    if (!plan) return null

    const items = planItems.map((item) => ({
      name: item.name,
      category_id: item.category_id,
      amount: item.amount,
      plan_id: plan.id,
    }))

    await plansStore.savePlanItems(plan.id, items)

    // Load the full plan with items and update currentPlan
    currentPlan.value = await plansStore.loadPlanWithItems(plan.id)

    return currentPlan.value
  }

  async function updateExistingPlanWithItems(
    name: string,
    startDate: string,
    endDate: string,
    total: number,
    planItems: Array<{ id?: string; name: string; category_id: string; amount: number }>,
  ): Promise<PlanWithItems | null> {
    if (!routePlanId.value || !currentPlan.value) return null

    const plan = await plansStore.editPlan(routePlanId.value, {
      name,
      start_date: startDate,
      end_date: endDate,
      total,
    })

    if (!plan) return null

    // Separate items into existing (to update) and new (to create)
    const itemsToUpdate = planItems.filter((item) => item.id)
    const itemsToCreate = planItems.filter((item) => !item.id)

    // Find items to delete (items that existed before but are no longer in planItems)
    const newItemIds = new Set(itemsToUpdate.map((item) => item.id))
    const itemsToDelete = currentPlan.value.plan_items
      .filter((existingItem) => !newItemIds.has(existingItem.id))
      .map((item) => item.id)

    // Execute all operations
    const operations: Promise<unknown>[] = []

    // Update existing items
    if (itemsToUpdate.length > 0) {
      operations.push(
        plansStore.updatePlanItems(
          plan.id,
          itemsToUpdate as Array<{ id: string; name: string; category_id: string; amount: number }>,
        ),
      )
    }

    // Create new items
    if (itemsToCreate.length > 0) {
      const newItems = itemsToCreate.map((item) => ({
        name: item.name,
        category_id: item.category_id,
        amount: item.amount,
        plan_id: plan.id,
      }))
      operations.push(plansStore.savePlanItems(plan.id, newItems))
    }

    // Delete removed items
    if (itemsToDelete.length > 0) {
      operations.push(plansStore.removePlanItems(itemsToDelete))
    }

    // Wait for all operations to complete
    await Promise.all(operations)

    // Reload the plan to get fresh data
    await loadPlan()

    return currentPlan.value
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
    currentTab,
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
