import { computed } from 'vue'
import { usePlansQuery, useDeletePlanMutation } from 'src/queries/plans'
import { useUserStore } from 'src/stores/user'
import { useListPage } from './useListPage'
import { filterAndSortPlans } from 'src/utils/list-filters'
import type { PlanWithPermission } from 'src/api'

export function usePlans() {
  const userStore = useUserStore()
  const userId = computed(() => userStore.userProfile?.id)
  const { plans, isPending } = usePlansQuery(userId)
  const deletePlanMutation = useDeletePlanMutation()

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Total Amount', value: 'total' },
    { label: 'Start Date', value: 'start_date' },
    { label: 'Created Date', value: 'created_at' },
  ]

  return useListPage<PlanWithPermission>(
    {
      entityName: 'Plan',
      entityNamePlural: 'Plans',
      newRouteNameSingular: 'new-plan',
      viewRouteNameSingular: 'plan',
      sortOptions,
      defaultSort: 'created_at',
      filterAndSortFn: filterAndSortPlans,
      deleteFn: async (id: string) => {
        try {
          await deletePlanMutation.mutateAsync(id)
          return { success: true }
        } catch {
          return { success: false }
        }
      },
    },
    () => plans.value,
    () => plans.value.filter((plan) => plan.owner_id === userId.value),
    () => plans.value.filter((plan) => plan.owner_id !== userId.value),
    () => isPending.value && plans.value.length === 0,
  )
}
