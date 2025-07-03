import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

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
  share_count?: number
}

export type TemplateSharedUser = {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

export type ExpenseTemplateItemUI = {
  id: string
  name: string
  categoryId: string
  amount: number
  color: string
}

export type ExpenseTemplateCategoryUI = {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: ExpenseTemplateItemUI[]
  subtotal: number
}

const isDuplicateNameError = (error: PostgrestError) =>
  (error.code === '23505' && error.message.includes('unique_template_name_per_user')) ||
  (error.message && error.message.includes('unique_template_name_per_user')) ||
  (error.message && error.message.includes('duplicate key value violates unique constraint'))

export async function getTemplateShareCount(templateId: string): Promise<number> {
  const { count, error } = await supabase
    .from('template_shares')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)

  if (error) throw error
  return count || 0
}

export async function getExpenseTemplates(
  userId: string,
): Promise<ExpenseTemplateWithPermission[]> {
  const { data: ownedTemplates, error: ownedError } = await supabase
    .from('expense_templates')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (ownedError) throw ownedError

  // Get share counts for owned templates efficiently
  const ownedTemplatesWithShares = await Promise.all(
    (ownedTemplates || []).map(async (template) => {
      const { count, error: countError } = await supabase
        .from('template_shares')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', template.id)

      if (countError) {
        console.warn('Failed to get share count for template:', template.id, countError)
        return { ...template, share_count: 0 } as ExpenseTemplateWithPermission
      }

      return { ...template, share_count: count || 0 } as ExpenseTemplateWithPermission
    }),
  )

  const { data: sharedTemplatesData, error: sharedError } = await supabase
    .from('template_shares')
    .select(
      `
      permission_level,
      expense_templates (*)
    `,
    )
    .eq('shared_with_user_id', userId)

  if (sharedError) throw sharedError

  const sharedTemplates = (sharedTemplatesData || []).map((share) => ({
    ...share.expense_templates,
    permission_level: share.permission_level,
  })) as ExpenseTemplateWithPermission[]

  const allTemplates = [...ownedTemplatesWithShares, ...sharedTemplates]

  return allTemplates.sort(
    (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime(),
  )
}

export async function createExpenseTemplate(
  template: ExpenseTemplateInsert,
): Promise<ExpenseTemplate> {
  const { data, error } = await supabase
    .from('expense_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    if (isDuplicateNameError(error)) {
      const duplicateError = new Error('DUPLICATE_TEMPLATE_NAME')
      duplicateError.name = 'DUPLICATE_TEMPLATE_NAME'
      throw duplicateError
    }

    throw error
  }

  return data
}

export async function updateExpenseTemplate(
  id: string,
  updates: ExpenseTemplateUpdate,
): Promise<ExpenseTemplate> {
  const { data, error } = await supabase
    .from('expense_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (isDuplicateNameError(error)) {
      const duplicateError = new Error('DUPLICATE_TEMPLATE_NAME')
      duplicateError.name = 'DUPLICATE_TEMPLATE_NAME'
      throw duplicateError
    }

    throw error
  }

  return data
}

export async function deleteExpenseTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('expense_templates').delete().eq('id', id)

  if (error) throw error
}

export async function getExpenseTemplateWithItems(
  templateId: string,
  userId: string,
): Promise<(ExpenseTemplateWithItems & { permission_level?: string }) | null> {
  const { data: template, error } = await supabase
    .from('expense_templates')
    .select(
      `
      *,
      expense_template_items!expense_template_items_template_id_fkey (*)
    `,
    )
    .eq('id', templateId)
    .maybeSingle()

  if (error) throw error
  if (!template) return null

  // If user is the owner, no need to check permissions
  if (template.owner_id === userId) {
    return template
  }

  // Check if template is shared with this user and get permission level
  const { data: share, error: shareError } = await supabase
    .from('template_shares')
    .select('permission_level')
    .eq('template_id', templateId)
    .eq('shared_with_user_id', userId)
    .maybeSingle()

  if (shareError) throw shareError

  // If not shared with user, they shouldn't have access
  if (!share) {
    throw new Error('Template not found or access denied')
  }

  return {
    ...template,
    permission_level: share.permission_level,
  }
}

export async function getTemplateSharedUsers(templateId: string): Promise<TemplateSharedUser[]> {
  // Get template shares first
  const { data: shares, error: sharesError } = await supabase
    .from('template_shares')
    .select('shared_with_user_id, permission_level, created_at')
    .eq('template_id', templateId)
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

export async function updateTemplateSharing(
  templateId: string,
  userEmails: string[],
  permissionLevel: string,
  sharedByUserId: string,
): Promise<void> {
  // Get user IDs from emails
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('email', userEmails)

  if (usersError) throw usersError

  const userIds = (users || []).map((user) => user.id)
  const foundEmails = (users || []).map((user) => user.email)

  // Check if any emails were not found
  const notFoundEmails = userEmails.filter((email) => !foundEmails.includes(email))
  if (notFoundEmails.length > 0) {
    throw new Error(`Users not found: ${notFoundEmails.join(', ')}`)
  }

  // Get current shares for this template
  const { data: currentShares, error: sharesError } = await supabase
    .from('template_shares')
    .select('id, shared_with_user_id')
    .eq('template_id', templateId)

  if (sharesError) throw sharesError

  const currentUserIds = (currentShares || []).map((share) => share.shared_with_user_id)

  // Determine which shares to add and remove
  const toAdd = userIds.filter((userId) => !currentUserIds.includes(userId))
  const toRemove = (currentShares || []).filter(
    (share) => !userIds.includes(share.shared_with_user_id),
  )

  // Remove shares that are no longer needed
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from('template_shares')
      .delete()
      .in(
        'id',
        toRemove.map((share) => share.id),
      )

    if (removeError) throw removeError
  }

  // Add new shares
  if (toAdd.length > 0) {
    const newShares: TemplateShareInsert[] = toAdd.map((userId) => ({
      template_id: templateId,
      shared_with_user_id: userId,
      shared_by_user_id: sharedByUserId,
      permission_level: permissionLevel,
    }))

    const { error: insertError } = await supabase.from('template_shares').insert(newShares)

    if (insertError) throw insertError
  }
}

export async function createExpenseTemplateItems(
  items: ExpenseTemplateItemInsert[],
): Promise<ExpenseTemplateItem[]> {
  const { data, error } = await supabase.from('expense_template_items').insert(items).select()

  if (error) throw error
  return data
}

export async function deleteExpenseTemplateItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from('expense_template_items').delete().in('id', ids)

  if (error) throw error
}

export async function shareTemplate(
  templateId: string,
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
    .from('template_shares')
    .select('id')
    .eq('template_id', templateId)
    .eq('shared_with_user_id', users.id)
    .maybeSingle()

  if (shareCheckError) throw shareCheckError
  if (existingShare) {
    throw new Error(`Template is already shared with ${userEmail}`)
  }

  // Create new share
  const { error: insertError } = await supabase.from('template_shares').insert({
    template_id: templateId,
    shared_with_user_id: users.id,
    shared_by_user_id: sharedByUserId,
    permission_level: permission,
  })

  if (insertError) throw insertError
}

export async function unshareTemplate(templateId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('template_shares')
    .delete()
    .eq('template_id', templateId)
    .eq('shared_with_user_id', userId)

  if (error) throw error
}

export async function updateSharePermission(
  templateId: string,
  userId: string,
  permission: 'view' | 'edit',
): Promise<void> {
  const { error } = await supabase
    .from('template_shares')
    .update({ permission_level: permission })
    .eq('template_id', templateId)
    .eq('shared_with_user_id', userId)

  if (error) throw error
}
