import { computed } from 'vue'
import { usePlansQuery, useDeletePlanMutation, useUpdatePlanMutation } from 'src/queries/plans'
import { useUserStore } from 'src/stores/user'
import { useListPage } from './useListPage'
import { filterAndSortPlans } from 'src/utils/list-filters'
import { getPlanSharedUsers, type PlanWithPermission } from 'src/api'
import { useNotificationEvents } from './useNotificationEvents'

export function usePlans() {
  const userStore = useUserStore()
  const userId = computed(() => userStore.userProfile?.id)
  const { plans, isPending } = usePlansQuery(userId)
  const deletePlanMutation = useDeletePlanMutation()
  const updatePlanMutation = useUpdatePlanMutation()
  const { emitNotificationEvent, emitRemovalNotification } = useNotificationEvents()

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Total Amount', value: 'total' },
    { label: 'Start Date', value: 'start_date' },
    { label: 'Created Date', value: 'created_at' },
  ]

  async function cancelPlan(plan: PlanWithPermission): Promise<void> {
    await updatePlanMutation.mutateAsync({
      id: plan.id,
      updates: { status: 'cancelled' },
    })

    await emitNotificationEvent({
      type: 'shared_plan_cancelled',
      entityType: 'plan',
      entityId: plan.id,
    })
  }

  return {
    ...useListPage<PlanWithPermission>(
      {
        entityName: 'Plan',
        entityNamePlural: 'Plans',
        newRouteNameSingular: 'new-plan',
        viewRouteNameSingular: 'plan',
        sortOptions,
        defaultSort: 'created_at',
        filterAndSortFn: filterAndSortPlans,
        deleteFn: async (plan: PlanWithPermission) => {
          try {
            await emitRemovalNotification('plan', plan.id, plan.name, () =>
              getPlanSharedUsers(plan.id),
            )

            await deletePlanMutation.mutateAsync(plan.id)
            return { success: true }
          } catch {
            return { success: false }
          }
        },
      },
      () => plans.value,
      () => isPending.value && plans.value.length === 0,
    ),
    cancelPlan,
  }
}
