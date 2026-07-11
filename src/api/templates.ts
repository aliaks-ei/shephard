import type { PostgrestError } from '@supabase/supabase-js'
import type { Json, Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { createDuplicateNameError, isDuplicateNameError } from 'src/utils/database'
import { BaseAPIService } from './base'
import { searchUsersByEmail } from './user'

export type Template = Tables<'templates'>
export type TemplateInsert = TablesInsert<'templates'>
export type TemplateUpdate = TablesUpdate<'templates'>
export type TemplateTransactionInsert = Omit<
  TemplateInsert,
  'id' | 'owner_id' | 'created_at' | 'updated_at'
>
export type TemplateTransactionUpdate = Pick<
  TemplateUpdate,
  'name' | 'duration' | 'currency' | 'total'
>
export type TemplateShare = Tables<'template_shares'>
export type TemplateShareInsert = TablesInsert<'template_shares'>
export type TemplateItem = Tables<'template_items'>
export type TemplateItemInsert = TablesInsert<'template_items'>
export type TemplateWithItems = Template & {
  template_items: Tables<'template_items'>[]
}

export type TemplateItemTransactionInput = {
  id?: string
  name: string
  category_id: string
  amount: number
  is_fixed_payment: boolean
}

export type TemplateWithPermission = Template & {
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

const templateService = new BaseAPIService<
  'templates',
  Template,
  TemplateInsert,
  TemplateUpdate,
  TemplateWithItems,
  TemplateWithPermission
>({
  tableName: 'templates',
  shareTableName: 'template_shares',
  itemsTableName: 'template_items',
  uniqueConstraintName: 'unique_template_name_per_user',
  entityTypeName: 'TEMPLATE',
  shareTableForeignKeyColumn: 'template_id',
})

export async function getTemplates(userId: string): Promise<TemplateWithPermission[]> {
  return templateService.getEntitiesWithPermissions(userId)
}

export async function createTemplate(template: TemplateInsert): Promise<Template> {
  return templateService.create(template)
}

export async function updateTemplate(id: string, updates: TemplateUpdate): Promise<Template> {
  return templateService.update(id, updates)
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function throwTemplateTransactionError(error: PostgrestError): never {
  if (isDuplicateNameError(error, 'unique_template_name_per_user')) {
    throw createDuplicateNameError('TEMPLATE')
  }

  throw error
}

export async function createTemplateWithItems(
  template: TemplateTransactionInsert,
  items: TemplateItemTransactionInput[],
): Promise<TemplateWithItems> {
  const { data, error } = await templateService.supabase.rpc('create_template_with_items', {
    p_template: toJson(template),
    p_items: toJson(items),
  })

  if (error) throwTemplateTransactionError(error)
  return data as unknown as TemplateWithItems
}

export async function updateTemplateWithItems(
  templateId: string,
  updates: TemplateTransactionUpdate,
  items: TemplateItemTransactionInput[],
): Promise<TemplateWithItems> {
  const itemPayload = items.map(({ id: _id, ...item }) => item)
  const { data, error } = await templateService.supabase.rpc('update_template_with_items', {
    p_template_id: templateId,
    p_template: toJson(updates),
    p_items: toJson(itemPayload),
  })

  if (error) throwTemplateTransactionError(error)
  return data as unknown as TemplateWithItems
}

export async function deleteTemplate(id: string): Promise<void> {
  return templateService.delete(id)
}

export async function getTemplateWithItems(
  templateId: string,
  userId: string,
): Promise<TemplateWithItems & { permission_level?: string }> {
  return templateService.getEntityWithItems(
    templateId,
    userId,
    'template_items!template_items_template_id_fkey',
  )
}

export async function getTemplateSharedUsers(templateId: string): Promise<TemplateSharedUser[]> {
  return templateService.getSharedUsers(templateId) as Promise<TemplateSharedUser[]>
}

export async function createTemplateItems(items: TemplateItemInsert[]): Promise<TemplateItem[]> {
  return templateService.createItems(items as Record<string, unknown>[]) as Promise<TemplateItem[]>
}

export async function deleteTemplateItems(ids: string[]): Promise<void> {
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
