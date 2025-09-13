import { useItemsManager, type CategoryGroup } from './useItemsManager'
import type { TemplateWithItems } from 'src/api'
import type { TemplateItemUI } from 'src/types'

export type TemplateCategoryGroup = CategoryGroup<TemplateItemUI>

export function useTemplateItems() {
  const itemsManager = useItemsManager<TemplateItemUI>({
    itemsPropertyName: 'template_items',
    createItemForSave: (item) => ({
      name: item.name.trim(),
      category_id: item.categoryId,
      amount: item.amount,
    }),
  })

  return {
    templateItems: itemsManager.items,
    totalAmount: itemsManager.totalAmount,
    hasValidItems: itemsManager.hasValidItems,
    hasDuplicateItems: itemsManager.hasDuplicateItems,
    isValidForSave: itemsManager.isValidForSave,
    categoryGroups: itemsManager.categoryGroups,
    addTemplateItem: itemsManager.addItem,
    updateTemplateItem: itemsManager.updateItem,
    removeTemplateItem: itemsManager.removeItem,
    loadTemplateItems: (template: TemplateWithItems) => itemsManager.loadItemsFromEntity(template),
    getTemplateItemsForSave: itemsManager.getItemsForSave,
    getUsedCategoryIds: itemsManager.getUsedCategoryIds,
  }
}
