/**
 * Base UI item type for both templates and plans
 */
export type BaseItemUI = {
  id: string
  name: string
  categoryId: string
  amount: number
  color: string
}

/**
 * Base category UI type for both templates and plans
 */
export type BaseCategoryUI = {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: BaseItemUI[]
  subtotal: number
}

/**
 * Template-specific item UI (extends base)
 */
export type ExpenseTemplateItemUI = BaseItemUI

/**
 * Plan-specific item UI (extends base)
 */
export type PlanItemUI = BaseItemUI

/**
 * Template-specific category UI (extends base)
 */
export type ExpenseTemplateCategoryUI = BaseCategoryUI & {
  items: ExpenseTemplateItemUI[]
}

/**
 * Plan-specific category UI (extends base)
 */
export type PlanCategoryUI = BaseCategoryUI & {
  items: PlanItemUI[]
}
