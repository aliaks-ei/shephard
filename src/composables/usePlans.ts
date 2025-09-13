import { usePlansStore } from 'src/stores/plans'
import { useListPage } from './useListPage'
import { filterAndSortPlans } from 'src/utils/list-filters'
import type { PlanWithPermission } from 'src/api'

export function usePlans() {
  const plansStore = usePlansStore()

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
      viewRouteNameSingular: 'plan-overview',
      sortOptions,
      defaultSort: 'created_at',
      filterAndSortFn: filterAndSortPlans,
      deleteFn: async (id: string) => {
        await plansStore.removePlan(id)
      },
    },
    () => plansStore.plans,
    () => plansStore.plans.filter((plan) => plan.owner_id === plansStore.userId),
    () => plansStore.plans.filter((plan) => plan.owner_id !== plansStore.userId),
    () => plansStore.isLoading && plansStore.plans.length === 0,
  )
}
