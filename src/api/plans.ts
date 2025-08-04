import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { isDuplicateNameError, createDuplicateNameError } from 'src/utils/database'

export type Plan = Tables<'plans'>
export type PlanInsert = TablesInsert<'plans'>
export type PlanUpdate = TablesUpdate<'plans'>
export type PlanShare = Tables<'plan_shares'>
export type PlanShareInsert = TablesInsert<'plan_shares'>
export type PlanItem = Tables<'plan_items'>
export type PlanItemInsert = TablesInsert<'plan_items'>
export type PlanWithItems = Plan & {
  plan_items: Tables<'plan_items'>[]
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

export async function getPlans(userId: string): Promise<PlanWithPermission[]> {
  // Get owned plans with sharing status in a single query
  const { data: ownedPlans, error: ownedError } = await supabase
    .from('plans')
    .select(
      `
      *,
      plan_shares!left(id)
    `,
    )
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (ownedError) throw ownedError

  // Transform owned plans to include is_shared flag
  const ownedPlansWithShares = (ownedPlans || []).map((plan) => ({
    ...plan,
    is_shared: plan.plan_shares && plan.plan_shares.length > 0,
    plan_shares: undefined, // Remove the join data from final result
  })) as PlanWithPermission[]

  const { data: sharedPlansData, error: sharedError } = await supabase
    .from('plan_shares')
    .select(
      `
      permission_level,
      plans (*)
    `,
    )
    .eq('shared_with_user_id', userId)

  if (sharedError) throw sharedError

  const sharedPlans = (sharedPlansData || []).map((share) => ({
    ...share.plans,
    permission_level: share.permission_level,
  })) as PlanWithPermission[]

  const allPlans = [...ownedPlansWithShares, ...sharedPlans]

  return allPlans.sort(
    (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime(),
  )
}

export async function createPlan(plan: PlanInsert): Promise<Plan> {
  const { data, error } = await supabase.from('plans').insert(plan).select().single()

  if (error) {
    if (isDuplicateNameError(error, 'unique_plan_name_per_user')) {
      throw createDuplicateNameError('PLAN')
    }

    throw error
  }

  return data
}

export async function updatePlan(id: string, updates: PlanUpdate): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (isDuplicateNameError(error, 'unique_plan_name_per_user')) {
      throw createDuplicateNameError('PLAN')
    }

    throw error
  }

  return data
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('plans').delete().eq('id', id)

  if (error) throw error
}

export async function getPlanWithItems(
  planId: string,
  userId: string,
): Promise<(PlanWithItems & { permission_level?: string }) | null> {
  const { data: plan, error } = await supabase
    .from('plans')
    .select(
      `
      *,
      plan_items!plan_items_plan_id_fkey (*)
    `,
    )
    .eq('id', planId)
    .maybeSingle()

  if (error) throw error
  if (!plan) return null

  // If user is the owner, no need to check permissions
  if (plan.owner_id === userId) {
    return plan
  }

  // Check if plan is shared with this user and get permission level
  const { data: share, error: shareError } = await supabase
    .from('plan_shares')
    .select('permission_level')
    .eq('plan_id', planId)
    .eq('shared_with_user_id', userId)
    .maybeSingle()

  if (shareError) throw shareError

  // If not shared with user, they shouldn't have access
  if (!share) {
    throw new Error('Plan not found or access denied')
  }

  return {
    ...plan,
    permission_level: share.permission_level,
  }
}

export async function getPlanSharedUsers(planId: string): Promise<PlanSharedUser[]> {
  // Get plan shares first
  const { data: shares, error: sharesError } = await supabase
    .from('plan_shares')
    .select('shared_with_user_id, permission_level, created_at')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })

  if (sharesError) throw sharesError

  if (!shares || shares.length === 0) {
    return []
  }

  // Get user details for all shared users
  const userIds = shares.map((share) => share.shared_with_user_id)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds)

  if (usersError) throw usersError

  return shares.map((share) => {
    const user = users?.find((u) => u.id === share.shared_with_user_id)
    return {
      user_id: share.shared_with_user_id,
      user_name: user?.name || '',
      user_email: user?.email || '',
      permission_level: share.permission_level,
      shared_at: share.created_at || '',
    }
  })
}

export async function createPlanItems(items: PlanItemInsert[]): Promise<PlanItem[]> {
  const { data, error } = await supabase.from('plan_items').insert(items).select()

  if (error) throw error
  return data
}

export async function deletePlanItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from('plan_items').delete().in('id', ids)

  if (error) throw error
}

export async function sharePlan(
  planId: string,
  userEmail: string,
  permission: 'view' | 'edit',
  sharedByUserId: string,
): Promise<void> {
  // Get user ID from email
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', userEmail)
    .maybeSingle()

  if (usersError) throw usersError
  if (!users) {
    throw new Error(`User not found: ${userEmail}`)
  }

  // Check if already shared
  const { data: existingShare, error: shareCheckError } = await supabase
    .from('plan_shares')
    .select('id')
    .eq('plan_id', planId)
    .eq('shared_with_user_id', users.id)
    .maybeSingle()

  if (shareCheckError) throw shareCheckError
  if (existingShare) {
    throw new Error(`Plan is already shared with ${userEmail}`)
  }

  // Create new share
  const { error: insertError } = await supabase.from('plan_shares').insert({
    plan_id: planId,
    shared_with_user_id: users.id,
    shared_by_user_id: sharedByUserId,
    permission_level: permission,
  })

  if (insertError) throw insertError
}

export async function unsharePlan(planId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('plan_shares')
    .delete()
    .eq('plan_id', planId)
    .eq('shared_with_user_id', userId)

  if (error) throw error
}

export async function updatePlanSharePermission(
  planId: string,
  userId: string,
  permission: 'view' | 'edit',
): Promise<void> {
  const { error } = await supabase
    .from('plan_shares')
    .update({ permission_level: permission })
    .eq('plan_id', planId)
    .eq('shared_with_user_id', userId)

  if (error) throw error
}
