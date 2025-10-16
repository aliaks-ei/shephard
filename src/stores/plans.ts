import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import {
  getPlans,
  getPlanWithItems,
  getPlanSharedUsers,
  createPlan,
  updatePlan,
  deletePlan,
  sharePlan,
  unsharePlan,
  updatePlanSharePermission,
  createPlanItems,
  deletePlanItems,
  batchUpdatePlanItems,
  searchUsersByEmail,
  type PlanInsert,
  type PlanUpdate,
  type PlanWithPermission,
  type PlanItemInsert,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useEntitySharing } from 'src/composables/useEntitySharing'
import { useUserStore } from 'src/stores/user'
import type { ActionResult } from 'src/types'
import { canAddExpensesToPlan } from 'src/utils/plans'
import type { CurrencyCode } from 'src/utils/currency'

export const usePlansStore = defineStore('plans', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const plans = ref<PlanWithPermission[]>([])
  const isLoading = ref(false)

  const userId = computed(() => userStore.userProfile?.id)
  const ownedPlans = computed(() => plans.value.filter((p) => p.owner_id === userId.value))
  const sharedPlans = computed(() => plans.value.filter((p) => p.owner_id !== userId.value))
  const activePlans = computed(() => plans.value.filter((p) => p.status === 'active'))
  const plansForExpenses = computed(() =>
    plans.value.filter((p) => {
      const isOwner = p.owner_id === userId.value
      return canAddExpensesToPlan(p, isOwner)
    }),
  )

  // Entity sharing functionality
  const sharing = useEntitySharing({
    entityNameSingular: 'plan',
    entityNamePlural: 'plans',
    entities: plans,
    userId,
    loadSharedUsersApi: getPlanSharedUsers,
    shareApi: sharePlan,
    unshareApi: unsharePlan,
    updatePermissionApi: updatePlanSharePermission,
    searchUsersApi: searchUsersByEmail,
    updateLocalIsShared: true,
    onAfterShare: async (planId) => {
      await sharing.loadSharedUsers(planId)
    },
    handleSpecificErrors: true,
  })

  async function loadPlans() {
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getPlans(userId.value)
      plans.value = data
    } catch (error) {
      handleError('PLANS.LOAD_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadPlanWithItems(planId: string) {
    if (!userId.value) return null

    isLoading.value = true

    try {
      const data = await getPlanWithItems(planId, userId.value)
      return data
    } catch (error) {
      handleError('PLANS.LOAD_PLAN_FAILED', error, { planId })
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function addPlan(
    planData: Omit<PlanInsert, 'owner_id' | 'currency' | 'status'>,
  ): Promise<ActionResult<PlanWithPermission>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const userCurrency = userStore.preferences.currency as CurrencyCode
      const newPlan = await createPlan({
        ...planData,
        owner_id: userId.value,
        currency: userCurrency,
        status: 'active',
      })

      return { success: true, data: newPlan }
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_PLAN_NAME') {
        handleError('PLANS.DUPLICATE_NAME', error)
      } else {
        handleError('PLANS.CREATE_FAILED', error)
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function editPlan(
    planId: string,
    updates: PlanUpdate,
  ): Promise<ActionResult<PlanWithPermission>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const updatedPlan = await updatePlan(planId, updates)
      const index = plans.value.findIndex((p) => p.id === planId)
      if (index !== -1) {
        plans.value[index] = { ...plans.value[index], ...updatedPlan }
      }

      return { success: true, data: updatedPlan }
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_PLAN_NAME') {
        handleError('PLANS.DUPLICATE_NAME', error)
      } else {
        handleError('PLANS.UPDATE_FAILED', error, { planId })
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function removePlan(planId: string): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      await deletePlan(planId)
      plans.value = plans.value.filter((p) => p.id !== planId)
      return { success: true }
    } catch (error) {
      handleError('PLANS.DELETE_FAILED', error, { planId })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function cancelPlan(planId: string): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    try {
      const result = await editPlan(planId, { status: 'cancelled' } as PlanUpdate)
      return result
    } catch (error) {
      handleError('PLANS.CANCEL_FAILED', error, { planId })
      return { success: false }
    }
  }

  async function savePlanItems(planId: string, items: PlanItemInsert[]): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      await createPlanItems(items)
      return { success: true }
    } catch (error) {
      handleError('PLANS.SAVE_ITEMS_FAILED', error, { planId })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function removePlanItems(itemIds: string[]): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      await deletePlanItems(itemIds)
      return { success: true }
    } catch (error) {
      handleError('PLANS.DELETE_ITEMS_FAILED', error, { itemIds: itemIds.join(', ') })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function updatePlanItems(
    planId: string,
    items: Array<{
      id: string
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }>,
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const itemsWithPlanId = items.map((item) => ({
        ...item,
        plan_id: planId,
      }))

      await batchUpdatePlanItems(itemsWithPlanId)
      return { success: true }
    } catch (error) {
      handleError('PLANS.UPDATE_ITEMS_FAILED', error)
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    plans.value = []
    isLoading.value = false
    sharing.reset()
  }

  return {
    plans,
    isLoading,
    isSharing: sharing.isSharing,
    sharedUsers: sharing.sharedUsers,
    userSearchResults: sharing.userSearchResults,
    isSearchingUsers: sharing.isSearchingUsers,
    userId,
    ownedPlans,
    sharedPlans,
    activePlans,
    plansForExpenses,
    loadPlans,
    loadPlanWithItems,
    addPlan,
    editPlan,
    removePlan,
    cancelPlan,
    loadSharedUsers: sharing.loadSharedUsers,
    sharePlanWithUser: sharing.shareWithUser,
    unsharePlanWithUser: sharing.unshareWithUser,
    updateUserPermission: sharing.updateUserPermission,
    searchUsers: sharing.searchUsers,
    clearUserSearch: sharing.clearUserSearch,
    savePlanItems,
    updatePlanItems,
    removePlanItems,
    reset,
  }
})
