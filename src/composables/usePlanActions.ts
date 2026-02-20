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
  const editActions = computed<ActionBarAction[]>(() => [
    {
      key: 'save',
      icon: 'eva-save-outline',
      label: context.isNewPlan.value ? 'Create' : 'Save',
      color: context.isNewPlan.value ? 'primary' : 'positive',
      priority: 'primary',
      handler: context.handlers.onSave,
    },
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
      visible:
        !context.isNewPlan.value &&
        !!context.currentPlan.value &&
        getPlanStatus(context.currentPlan.value) === 'active' &&
        context.isEditMode.value,
      handler: context.handlers.onCancel,
    },
    {
      key: 'delete',
      icon: 'eva-trash-2-outline',
      label: 'Delete',
      color: 'negative',
      priority: 'secondary',
      visible:
        !context.isNewPlan.value &&
        !!context.currentPlan.value &&
        (getPlanStatus(context.currentPlan.value) === 'pending' ||
          getPlanStatus(context.currentPlan.value) === 'completed' ||
          getPlanStatus(context.currentPlan.value) === 'cancelled') &&
        context.isEditMode.value,
      handler: context.handlers.onDelete,
    },
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
    {
      key: 'share',
      icon: 'eva-share-outline',
      label: 'Share',
      color: 'info',
      priority: 'secondary',
      visible: context.isEditMode.value,
      handler: context.handlers.onShare,
    },
  ])

  const itemsActions = computed<ActionBarAction[]>(() => [
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
    {
      key: 'share',
      icon: 'eva-share-outline',
      label: 'Share',
      color: 'info',
      priority: 'secondary',
      visible: context.isEditMode.value,
      handler: context.handlers.onShare,
    },
  ])

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
    return (
      (context.isEditMode.value &&
        (context.isNewPlan.value ||
          context.canEditPlanData.value ||
          (!context.canEditPlanData.value && context.currentTab.value === 'edit'))) ||
      (!context.isNewPlan.value &&
        (context.currentTab.value === 'overview' ||
          (context.currentTab.value === 'items' && context.isEditMode.value) ||
          (context.currentTab.value === 'edit' && context.isEditMode.value)))
    )
  })

  return {
    actionBarActions,
    actionsVisible,
  }
}
