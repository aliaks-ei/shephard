import { computed, type ComputedRef, type Ref } from 'vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'

export type TemplateActionHandlers = {
  onAddCategory: () => void
  onSave: () => void
  onShare: () => void
  onDelete: () => void
  onExport: () => void
}

export type TemplateActionsContext = {
  isNewTemplate: Ref<boolean> | ComputedRef<boolean>
  isEditMode: Ref<boolean> | ComputedRef<boolean>
  handlers: TemplateActionHandlers
}

export function useTemplateActions(context: TemplateActionsContext) {
  const actionBarActions = computed<ActionBarAction[]>(() => [
    {
      key: 'add-category',
      icon: 'eva-plus-outline',
      label: 'Category',
      color: 'primary',
      priority: 'primary',
      visible: context.isEditMode.value,
      handler: context.handlers.onAddCategory,
    },
    {
      key: 'save',
      icon: 'eva-save-outline',
      label: context.isNewTemplate.value ? 'Create' : 'Save',
      color: context.isNewTemplate.value ? 'primary' : 'positive',
      priority: 'primary',
      visible: context.isEditMode.value,
      handler: context.handlers.onSave,
    },
    {
      key: 'export',
      icon: 'eva-download-outline',
      label: 'Export',
      color: 'info',
      priority: 'secondary',
      visible: !context.isNewTemplate.value,
      handler: context.handlers.onExport,
    },
    {
      key: 'share',
      icon: 'eva-share-outline',
      label: 'Share',
      color: 'info',
      priority: 'secondary',
      visible: !context.isNewTemplate.value && context.isEditMode.value,
      handler: context.handlers.onShare,
    },
    {
      key: 'delete',
      icon: 'eva-trash-2-outline',
      label: 'Delete',
      color: 'negative',
      priority: 'secondary',
      visible: !context.isNewTemplate.value && context.isEditMode.value,
      handler: context.handlers.onDelete,
    },
  ])

  const actionsVisible = computed(() => {
    return actionBarActions.value.some((action) => action.visible !== false)
  })

  return {
    actionBarActions,
    actionsVisible,
  }
}
