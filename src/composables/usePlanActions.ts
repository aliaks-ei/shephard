import { computed, type Ref, type ComputedRef } from 'vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import type { PlanWithItems } from 'src/api'
import { getPlanStatus } from 'src/utils/plans'

export type PlanActionHandlers = {
  onSave: () => void
  onShare: () => void
  onCancel: () => void
  onDelete: () => void
  onAddExpense: () => void
  onSwitchToEdit: () => void
}

export type PlanActionsContext = {
  isNewPlan: Ref<boolean> | ComputedRef<boolean>
  isOwner: Ref<boolean> | ComputedRef<boolean>
  isEditMode: Ref<boolean> | ComputedRef<boolean>
  canEditPlanData: Ref<boolean> | ComputedRef<boolean>
  currentPlan: Ref<PlanWithItems | null> | ComputedRef<PlanWithItems | null>
  currentTab: Ref<string>
  handlers: PlanActionHandlers
}

export function usePlanActions(context: PlanActionsContext) {
  const planStatus = computed(() => {
    if (!context.currentPlan.value) {
      return null
    }
    return getPlanStatus(context.currentPlan.value)
  })

  const canShowCancel = computed(
    () =>
      !context.isNewPlan.value &&
      !!context.currentPlan.value &&
      planStatus.value === 'active' &&
      context.isEditMode.value,
  )

  const canShowDelete = computed(
    () =>
      !context.isNewPlan.value &&
      !!context.currentPlan.value &&
      (planStatus.value === 'pending' ||
        planStatus.value === 'completed' ||
        planStatus.value === 'cancelled') &&
      context.isEditMode.value,
  )

  const sharedSecondaryActions = computed<ActionBarAction[]>(() => [
    {
      key: 'share',
      icon: 'eva-share-outline',
      label: 'Share',
      color: 'info',
      priority: 'secondary',
      visible: !context.isNewPlan.value && context.isEditMode.value,
      handler: context.handlers.onShare,
    },
    {
      key: 'cancel',
      icon: 'eva-close-circle-outline',
      label: 'Cancel',
      color: 'negative',
      priority: 'secondary',
      visible: canShowCancel.value,
      handler: context.handlers.onCancel,
    },
    {
      key: 'delete',
      icon: 'eva-trash-2-outline',
      label: 'Delete',
      color: 'negative',
      priority: 'secondary',
      visible: canShowDelete.value,
      handler: context.handlers.onDelete,
    },
  ])

  const editActions = computed<ActionBarAction[]>(() => [
    {
      key: 'save',
      icon: 'eva-save-outline',
      label: context.isNewPlan.value ? 'Create' : 'Save',
      color: context.isNewPlan.value ? 'primary' : 'positive',
      priority: 'primary',
      handler: context.handlers.onSave,
    },
    ...sharedSecondaryActions.value,
  ])

  const overviewActions = computed<ActionBarAction[]>(() => [
    {
      key: 'add-expense',
      icon: 'eva-plus-circle-outline',
      label: 'Add Expense',
      color: 'primary',
      priority: 'primary',
      visible: context.isEditMode.value,
      handler: context.handlers.onAddExpense,
    },
    {
      key: 'edit',
      icon: 'eva-edit-outline',
      label: 'Edit',
      color: 'info',
      priority: 'primary',
      visible: context.isEditMode.value && context.canEditPlanData.value,
      handler: context.handlers.onSwitchToEdit,
    },
    ...sharedSecondaryActions.value,
  ])

  const itemsActions = overviewActions

  const actionBarActions = computed<ActionBarAction[]>(() => {
    if (context.isNewPlan.value) {
      return editActions.value
    }
    if (context.currentTab.value === 'overview') {
      return overviewActions.value
    }
    if (context.currentTab.value === 'items' && context.isEditMode.value) {
      return itemsActions.value
    }
    return editActions.value
  })

  const actionsVisible = computed(() => {
    return actionBarActions.value.some((action) => action.visible !== false)
  })

  return {
    actionBarActions,
    actionsVisible,
  }
}
