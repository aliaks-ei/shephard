import { useItemsManager, type CategoryGroup, type ItemForSave } from './useItemsManager'
import type { PlanWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'

export type PlanCategoryGroup = CategoryGroup<PlanItemUI>
export type { ItemForSave }

export function usePlanItems() {
  const itemsManager = useItemsManager<PlanItemUI>({
    itemsPropertyName: 'plan_items',
    createItemForSave: (item) => ({
      name: item.name.trim(),
      category_id: item.categoryId,
      amount: item.amount,
    }),
  })

  return {
    planItems: itemsManager.items,
    totalAmount: itemsManager.totalAmount,
    hasValidItems: itemsManager.hasValidItems,
    hasDuplicateItems: itemsManager.hasDuplicateItems,
    isValidForSave: itemsManager.isValidForSave,
    planCategoryGroups: itemsManager.categoryGroups,
    addPlanItem: itemsManager.addItem,
    updatePlanItem: itemsManager.updateItem,
    removePlanItem: itemsManager.removeItem,
    loadPlanItems: (plan: PlanWithItems) => itemsManager.loadItemsFromEntity(plan),
    loadPlanItemsFromTemplate: itemsManager.loadItemsFromTemplate,
    getPlanItemsForSave: itemsManager.getItemsForSave,
    getUsedCategoryIds: itemsManager.getUsedCategoryIds,
    clearPlanItems: itemsManager.clearItems,
  }
}
