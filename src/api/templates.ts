import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { BaseAPIService } from './base'
import { searchUsersByEmail } from './user'

export type ExpenseTemplate = Tables<'expense_templates'>
export type ExpenseTemplateInsert = TablesInsert<'expense_templates'>
export type ExpenseTemplateUpdate = TablesUpdate<'expense_templates'>
export type TemplateShare = Tables<'template_shares'>
export type TemplateShareInsert = TablesInsert<'template_shares'>
export type ExpenseTemplateItem = Tables<'expense_template_items'>
export type ExpenseTemplateItemInsert = TablesInsert<'expense_template_items'>
export type ExpenseTemplateWithItems = ExpenseTemplate & {
  expense_template_items: Tables<'expense_template_items'>[]
}

export type ExpenseTemplateWithPermission = ExpenseTemplate & {
  permission_level?: string
  is_shared?: boolean
}

export type TemplateSharedUser = {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

// Create service instance with template configuration
const templateService = new BaseAPIService<
  'expense_templates',
  ExpenseTemplate,
  ExpenseTemplateInsert,
  ExpenseTemplateUpdate,
  ExpenseTemplateWithItems,
  ExpenseTemplateWithPermission
>({
  tableName: 'expense_templates',
  shareTableName: 'template_shares',
  itemsTableName: 'expense_template_items',
  uniqueConstraintName: 'unique_template_name_per_user',
  entityTypeName: 'TEMPLATE',
  shareTableForeignKeyColumn: 'template_id',
})

export async function getExpenseTemplates(
  userId: string,
): Promise<ExpenseTemplateWithPermission[]> {
  return templateService.getEntitiesWithPermissions(userId)
}

export async function createExpenseTemplate(
  template: ExpenseTemplateInsert,
): Promise<ExpenseTemplate> {
  return templateService.create(template)
}

export async function updateExpenseTemplate(
  id: string,
  updates: ExpenseTemplateUpdate,
): Promise<ExpenseTemplate> {
  return templateService.update(id, updates)
}

export async function deleteExpenseTemplate(id: string): Promise<void> {
  return templateService.delete(id)
}

export async function getExpenseTemplateWithItems(
  templateId: string,
  userId: string,
): Promise<(ExpenseTemplateWithItems & { permission_level?: string }) | null> {
  return templateService.getEntityWithItems(
    templateId,
    userId,
    'expense_template_items!expense_template_items_template_id_fkey',
  )
}

export async function getTemplateSharedUsers(templateId: string): Promise<TemplateSharedUser[]> {
  return templateService.getSharedUsers(templateId) as Promise<TemplateSharedUser[]>
}

export async function createExpenseTemplateItems(
  items: ExpenseTemplateItemInsert[],
): Promise<ExpenseTemplateItem[]> {
  return templateService.createItems(items as Record<string, unknown>[]) as Promise<
    ExpenseTemplateItem[]
  >
}

export async function deleteExpenseTemplateItems(ids: string[]): Promise<void> {
  return templateService.deleteItems(ids)
}

export async function shareTemplate(
  templateId: string,
  userEmail: string,
  permission: 'view' | 'edit',
  sharedByUserId: string,
): Promise<void> {
  return templateService.shareEntity(templateId, userEmail, permission, sharedByUserId)
}

export async function unshareTemplate(templateId: string, userId: string): Promise<void> {
  return templateService.unshareEntity(templateId, userId)
}

export async function updateSharePermission(
  templateId: string,
  userId: string,
  permission: 'view' | 'edit',
): Promise<void> {
  return templateService.updateSharePermission(templateId, userId, permission)
}

export { searchUsersByEmail }
