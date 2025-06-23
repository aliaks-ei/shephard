import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

export type Template = Tables<'templates'>
export type TemplateInsert = TablesInsert<'templates'>
export type TemplateUpdate = TablesUpdate<'templates'>
export type TemplateShare = Tables<'template_shares'>
export type TemplateShareInsert = TablesInsert<'template_shares'>
export type TemplateCategory = Tables<'template_categories'>
export type TemplateCategoryInsert = TablesInsert<'template_categories'>
export type TemplateWithCategories = Template & {
  template_categories: Tables<'template_categories'>[]
}

export type TemplateSharedUser = {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

export type TemplateCategoryItem = {
  id: string
  categoryId: string
  amount: number
  color: string
}

export async function getTemplates(userId: string): Promise<Template[]> {
  // Get shared template IDs first
  const { data: sharedTemplateIds, error: shareError } = await supabase
    .from('template_shares')
    .select('template_id')
    .eq('shared_with_user_id', userId)

  if (shareError) throw shareError

  const sharedIds = (sharedTemplateIds || []).map((s) => s.template_id)

  // Build the query conditions
  let query = supabase.from('templates').select('*')

  if (sharedIds.length > 0) {
    // If there are shared templates, get both owned and shared
    query = query.or(`owner_id.eq.${userId},id.in.(${sharedIds.join(',')})`)
  } else {
    // If no shared templates, just get owned templates
    query = query.eq('owner_id', userId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTemplate(template: TemplateInsert): Promise<Template> {
  const { data, error } = await supabase.from('templates').insert(template).select().single()

  if (error) throw error
  return data
}

export async function updateTemplate(id: string, updates: TemplateUpdate): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id)

  if (error) throw error
}

export async function getTemplateWithCategories(
  templateId: string,
): Promise<TemplateWithCategories | null> {
  const { data, error } = await supabase
    .from('templates')
    .select(
      `
      *,
      template_categories (*)
    `,
    )
    .eq('id', templateId)
    .maybeSingle()

  if (error) throw error
  return data
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

export async function createTemplateCategories(
  categories: TemplateCategoryInsert[],
): Promise<TemplateCategory[]> {
  const { data, error } = await supabase.from('template_categories').insert(categories).select()

  if (error) throw error
  return data
}

export async function deleteTemplateCategories(ids: string[]): Promise<void> {
  const { error } = await supabase.from('template_categories').delete().in('id', ids)

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
