export type { GoogleSignInResponse } from './global'
export type {
  BaseItemUI,
  BaseCategoryUI,
  TemplateItemUI,
  TemplateCategoryUI,
  PlanItemUI,
  PlanCategoryUI,
  CategoryBudget,
} from './ui'

export type ActionResult<T = void> = T extends void
  ? { success: boolean }
  : { success: boolean; data?: T }
