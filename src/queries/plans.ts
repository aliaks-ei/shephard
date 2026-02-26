import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getPlans,
  getPlanWithItems,
  createPlan,
  updatePlan,
  deletePlan,
  createPlanItems,
  deletePlanItems,
  batchUpdatePlanItems,
  getPlanItems,
  type PlanInsert,
  type PlanUpdate,
  type PlanWithPermission,
  type PlanItemInsert,
} from 'src/api'
import { updatePlanItemCompletion, updatePlanItemsCompletion } from 'src/api/plans'
import { useUserStore } from 'src/stores/user'
import { queryKeys } from './query-keys'
import { createSpecificErrorHandler, createMutationErrorHandler } from './query-error-handler'
import { canAddExpensesToPlan } from 'src/utils/plans'

const LIST_STALE_TIME_MS = 30_000
const DETAIL_STALE_TIME_MS = 15_000
const QUERY_CACHE_TIME_MS = 5 * 60_000

export function usePlansQuery(userId: MaybeRefOrGetter<string | undefined>) {
  const query = useQuery({
    queryKey: computed(() => queryKeys.plans.list(toValue(userId) ?? '')),
    queryFn: () => getPlans(toValue(userId)!),
    enabled: computed(() => !!toValue(userId)),
    staleTime: LIST_STALE_TIME_MS,
    gcTime: QUERY_CACHE_TIME_MS,
    meta: { errorKey: 'PLANS.LOAD_FAILED' as const },
  })

  const plans = computed((): PlanWithPermission[] => query.data.value ?? [])
  const ownedPlans = computed(() => plans.value.filter((p) => p.owner_id === toValue(userId)))
  const sharedPlans = computed(() => plans.value.filter((p) => p.owner_id !== toValue(userId)))
  const activePlans = computed(() => plans.value.filter((p) => p.status === 'active'))
  const plansForExpenses = computed(() =>
    plans.value.filter((p) => {
      const isOwner = p.owner_id === toValue(userId)
      return canAddExpensesToPlan(p, isOwner)
    }),
  )

  return {
    ...query,
    plans,
    ownedPlans,
    sharedPlans,
    activePlans,
    plansForExpenses,
  }
}

export function usePlanDetailQuery(
  planId: MaybeRefOrGetter<string | null>,
  userId: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    queryKey: computed(() => queryKeys.plans.detail(toValue(planId) ?? '', toValue(userId) ?? '')),
    queryFn: () => getPlanWithItems(toValue(planId)!, toValue(userId)!),
    enabled: computed(() => !!toValue(planId) && !!toValue(userId)),
    staleTime: DETAIL_STALE_TIME_MS,
    gcTime: QUERY_CACHE_TIME_MS,
    meta: { errorKey: 'PLANS.LOAD_PLAN_FAILED' as const },
  })
}

export function usePlanItemsQuery(planId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.plans.items(toValue(planId) ?? '')),
    queryFn: () => getPlanItems(toValue(planId)!),
    enabled: computed(() => !!toValue(planId)),
    staleTime: DETAIL_STALE_TIME_MS,
    gcTime: QUERY_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_PLAN_ITEMS_FAILED' as const },
  })
}

function invalidatePlanQueries(queryClient: ReturnType<typeof useQueryClient>, planId?: string) {
  const userStore = useUserStore()
  const userId = userStore.userProfile?.id ?? ''

  queryClient.invalidateQueries({ queryKey: queryKeys.plans.list(userId) })
  if (planId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.detail(planId, userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.items(planId) })
  }
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plan: PlanInsert) => createPlan(plan),
    onSuccess: () => {
      invalidatePlanQueries(queryClient)
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) => e.name === 'DUPLICATE_PLAN_NAME',
          key: 'PLANS.DUPLICATE_NAME',
        },
      ],
      'PLANS.CREATE_FAILED',
    ),
  })
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { id: string; updates: PlanUpdate }) => updatePlan(vars.id, vars.updates),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.id)
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) => e.name === 'DUPLICATE_PLAN_NAME',
          key: 'PLANS.DUPLICATE_NAME',
        },
      ],
      'PLANS.UPDATE_FAILED',
    ),
  })
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => deletePlan(planId),
    onSuccess: () => {
      invalidatePlanQueries(queryClient)
    },
    onError: createMutationErrorHandler('PLANS.DELETE_FAILED'),
  })
}

export function useSavePlanItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { planId: string; items: PlanItemInsert[] }) => createPlanItems(vars.items),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.planId)
    },
    onError: createMutationErrorHandler('PLANS.SAVE_ITEMS_FAILED'),
  })
}

export function useUpdatePlanItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: {
      planId: string
      items: Array<{
        id: string
        plan_id: string
        name: string
        category_id: string
        amount: number
        is_fixed_payment: boolean
      }>
    }) => batchUpdatePlanItems(vars.items),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.planId)
    },
    onError: createMutationErrorHandler('PLANS.UPDATE_ITEMS_FAILED'),
  })
}

export function useDeletePlanItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { planId: string; itemIds: string[] }) => deletePlanItems(vars.itemIds),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.planId)
    },
    onError: createMutationErrorHandler('PLANS.DELETE_ITEMS_FAILED'),
  })
}

export function useUpdatePlanItemCompletionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { itemId: string; isCompleted: boolean; planId: string }) =>
      updatePlanItemCompletion(vars.itemId, vars.isCompleted),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.planId)
    },
    onError: createMutationErrorHandler('PLANS.UPDATE_ITEMS_FAILED'),
  })
}

export function useUpdatePlanItemsCompletionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { itemIds: string[]; isCompleted: boolean; planId: string }) =>
      updatePlanItemsCompletion(vars.itemIds, vars.isCompleted),
    onSuccess: (_data, vars) => {
      invalidatePlanQueries(queryClient, vars.planId)
    },
    onError: createMutationErrorHandler('PLANS.UPDATE_ITEMS_FAILED'),
  })
}
