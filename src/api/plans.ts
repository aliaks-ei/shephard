import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { BaseAPIService } from './base'
import { searchUsersByEmail } from './user'

export type Plan = Tables<'plans'>
export type PlanInsert = TablesInsert<'plans'>
export type PlanUpdate = TablesUpdate<'plans'>
export type PlanShare = Tables<'plan_shares'>
export type PlanShareInsert = TablesInsert<'plan_shares'>
export type PlanItem = Tables<'plan_items'>
export type PlanItemInsert = TablesInsert<'plan_items'>
export type PlanWithItems = Plan & {
  plan_items: PlanItem[]
}

export type PlanWithPermission = Plan & {
  permission_level?: string
  is_shared?: boolean
}

export type PlanSharedUser = {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

const planService = new BaseAPIService<
  'plans',
  Plan,
  PlanInsert,
  PlanUpdate,
  PlanWithItems,
  PlanWithPermission
>({
  tableName: 'plans',
  shareTableName: 'plan_shares',
  itemsTableName: 'plan_items',
  uniqueConstraintName: 'unique_plan_name_per_user',
  entityTypeName: 'PLAN',
  shareTableForeignKeyColumn: 'plan_id',
})

export async function getPlans(userId: string): Promise<PlanWithPermission[]> {
  return planService.getEntitiesWithPermissions(userId)
}

export async function createPlan(plan: PlanInsert): Promise<Plan> {
  return planService.create(plan)
}

export async function updatePlan(id: string, updates: PlanUpdate): Promise<Plan> {
  return planService.update(id, updates)
}

export async function deletePlan(id: string): Promise<void> {
  return planService.delete(id)
}

export async function getPlanWithItems(
  planId: string,
  userId: string,
): Promise<(PlanWithItems & { permission_level?: string }) | null> {
  return planService.getEntityWithItems(planId, userId, 'plan_items!plan_items_plan_id_fkey')
}

export async function getPlanSharedUsers(planId: string): Promise<PlanSharedUser[]> {
  return planService.getSharedUsers(planId) as Promise<PlanSharedUser[]>
}

export async function createPlanItems(items: PlanItemInsert[]): Promise<PlanItem[]> {
  return planService.createItems(items as Record<string, unknown>[]) as Promise<PlanItem[]>
}

export async function deletePlanItems(ids: string[]): Promise<void> {
  return planService.deleteItems(ids)
}

export async function sharePlan(
  planId: string,
  userEmail: string,
  permission: 'view' | 'edit',
  sharedByUserId: string,
): Promise<void> {
  return planService.shareEntity(planId, userEmail, permission, sharedByUserId)
}

export async function unsharePlan(planId: string, userId: string): Promise<void> {
  return planService.unshareEntity(planId, userId)
}

export async function updatePlanSharePermission(
  planId: string,
  userId: string,
  permission: 'view' | 'edit',
): Promise<void> {
  return planService.updateSharePermission(planId, userId, permission)
}

export async function getPlanItems(planId: string): Promise<PlanItem[]> {
  const { data, error } = await planService.supabase
    .from('plan_items')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data || []
}

export async function updatePlanItemCompletion(
  itemId: string,
  isCompleted: boolean,
): Promise<void> {
  const { error } = await planService.supabase
    .from('plan_items')
    .update({ is_completed: isCompleted })
    .eq('id', itemId)

  if (error) throw error
}

export async function updatePlanItemsCompletion(
  itemIds: string[],
  isCompleted: boolean,
): Promise<void> {
  if (itemIds.length === 0) {
    return
  }

  const { error } = await planService.supabase
    .from('plan_items')
    .update({ is_completed: isCompleted })
    .in('id', itemIds)

  if (error) throw error
}

export async function updatePlanItem(
  itemId: string,
  updates: { name?: string; category_id?: string; amount?: number },
): Promise<PlanItem> {
  const { data, error } = await planService.supabase
    .from('plan_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function batchUpdatePlanItems(
  items: Array<{ id: string; plan_id: string; name: string; category_id: string; amount: number }>,
): Promise<PlanItem[]> {
  const { data, error } = await planService.supabase
    .from('plan_items')
    .upsert(items, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    .select()

  if (error) throw error

  return data || []
}

export async function getPlanItemsByCategory(
  planId: string,
  categoryId: string,
): Promise<PlanItem[]> {
  const allItems = await getPlanItems(planId)
  return allItems.filter((item) => item.category_id === categoryId)
}

export { searchUsersByEmail }
