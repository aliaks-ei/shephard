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
  type PlanSharedUser,
  type UserSearchResult,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'
import type { ActionResult } from 'src/types'
import { canAddExpensesToPlan } from 'src/utils/plans'
import type { CurrencyCode } from 'src/utils/currency'

export const usePlansStore = defineStore('plans', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const plans = ref<PlanWithPermission[]>([])
  const isLoading = ref(false)
  const isSharing = ref(false)
  const sharedUsers = ref<PlanSharedUser[]>([])
  const userSearchResults = ref<UserSearchResult[]>([])
  const isSearchingUsers = ref(false)

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

  async function loadSharedUsers(planId: string): Promise<void> {
    isLoading.value = true

    try {
      const users = await getPlanSharedUsers(planId)
      sharedUsers.value = users
    } catch (error) {
      handleError('PLANS.LOAD_SHARED_USERS_FAILED', error, { planId })
    } finally {
      isLoading.value = false
    }
  }

  async function sharePlanWithUser(
    planId: string,
    userEmail: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isSharing.value = true

    try {
      await sharePlan(planId, userEmail, permission, userId.value)

      const planIndex = plans.value.findIndex((p) => p.id === planId)
      if (planIndex !== -1 && plans.value[planIndex]) {
        plans.value[planIndex].is_shared = true
      }

      await loadSharedUsers(planId)
      return { success: true }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not found')) {
        handleError('PLANS.USER_NOT_FOUND', error, { userEmail })
      } else if (error instanceof Error && error.message.includes('already shared')) {
        handleError('PLANS.ALREADY_SHARED', error, { userEmail })
      } else {
        handleError('PLANS.SHARE_FAILED', error, { planId, userEmail })
      }
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function unsharePlanWithUser(planId: string, targetUserId: string): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isSharing.value = true

    try {
      await unsharePlan(planId, targetUserId)

      sharedUsers.value = sharedUsers.value.filter((user) => user.user_id !== targetUserId)

      if (sharedUsers.value.length === 0) {
        const planIndex = plans.value.findIndex((p) => p.id === planId)
        if (planIndex !== -1 && plans.value[planIndex]) {
          plans.value[planIndex].is_shared = false
        }
      }
      return { success: true }
    } catch (error) {
      handleError('PLANS.UNSHARE_FAILED', error, { planId, targetUserId })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function updateUserPermission(
    planId: string,
    targetUserId: string,
    permission: 'view' | 'edit',
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isSharing.value = true

    try {
      await updatePlanSharePermission(planId, targetUserId, permission)

      const userIndex = sharedUsers.value.findIndex((user) => user.user_id === targetUserId)
      if (userIndex !== -1 && sharedUsers.value[userIndex]) {
        sharedUsers.value[userIndex].permission_level = permission
      }
      return { success: true }
    } catch (error) {
      handleError('PLANS.UPDATE_PERMISSION_FAILED', error, { planId, targetUserId, permission })
      return { success: false }
    } finally {
      isSharing.value = false
    }
  }

  async function searchUsers(query: string): Promise<void> {
    if (!query.trim()) {
      clearUserSearch()
      return
    }

    isSearchingUsers.value = true

    try {
      const results = await searchUsersByEmail(query)
      userSearchResults.value = results
    } catch (error) {
      handleError('PLANS.SEARCH_USERS_FAILED', error, { query })
    } finally {
      isSearchingUsers.value = false
    }
  }

  function clearUserSearch() {
    userSearchResults.value = []
    isSearchingUsers.value = false
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
    items: Array<{ id: string; name: string; category_id: string; amount: number }>,
  ): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      // Add plan_id to each item for batch upsert
      const itemsWithPlanId = items.map((item) => ({
        ...item,
        plan_id: planId,
      }))

      // Use batch update for efficiency - single request instead of N requests
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
    sharedUsers.value = []
    userSearchResults.value = []
    isLoading.value = false
    isSharing.value = false
    isSearchingUsers.value = false
  }

  return {
    plans,
    isLoading,
    isSharing,
    sharedUsers,
    userSearchResults,
    isSearchingUsers,
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
    loadSharedUsers,
    sharePlanWithUser,
    unsharePlanWithUser,
    updateUserPermission,
    searchUsers,
    clearUserSearch,
    savePlanItems,
    updatePlanItems,
    removePlanItems,
    reset,
  }
})
