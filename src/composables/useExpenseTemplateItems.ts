import { useItemsManager, type CategoryGroup } from './useItemsManager'
import type { ExpenseTemplateWithItems } from 'src/api'
import type { ExpenseTemplateItemUI } from 'src/types'

export type ExpenseCategoryGroup = CategoryGroup<ExpenseTemplateItemUI>

export function useExpenseTemplateItems() {
  const itemsManager = useItemsManager<ExpenseTemplateItemUI>({
    itemsPropertyName: 'expense_template_items',
    createItemForSave: (item) => ({
      name: item.name.trim(),
      category_id: item.categoryId,
      amount: item.amount,
    }),
  })

  return {
    expenseTemplateItems: itemsManager.items,
    totalAmount: itemsManager.totalAmount,
    hasValidItems: itemsManager.hasValidItems,
    hasDuplicateItems: itemsManager.hasDuplicateItems,
    isValidForSave: itemsManager.isValidForSave,
    expenseCategoryGroups: itemsManager.categoryGroups,
    addExpenseTemplateItem: itemsManager.addItem,
    updateExpenseTemplateItem: itemsManager.updateItem,
    removeExpenseTemplateItem: itemsManager.removeItem,
    loadExpenseTemplateItems: (template: ExpenseTemplateWithItems) =>
      itemsManager.loadItemsFromEntity(template),
    getExpenseTemplateItemsForSave: itemsManager.getItemsForSave,
    getUsedCategoryIds: itemsManager.getUsedCategoryIds,
  }
}
