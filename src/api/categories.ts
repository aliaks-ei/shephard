import { supabase } from 'src/lib/supabase/client'
import type { Tables } from 'src/lib/supabase/types'

export type ExpenseCategory = Tables<'expense_categories'>

export type ExpenseCategoryWithStats = ExpenseCategory & {
  templates: CategoryTemplate[]
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export type CategoryTemplate = {
  id: string
  name: string
  owner_id: string
  permission_level?: string
}

export async function getExpenseCategoriesWithStats(
  userId: string,
): Promise<ExpenseCategoryWithStats[]> {
  // First, get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true })

  if (categoriesError) throw categoriesError

  // Get template IDs that the user has access to (owned + shared)
  const { data: ownedTemplates, error: ownedError } = await supabase
    .from('expense_templates')
    .select('id, name, owner_id')
    .match({ owner_id: userId })

  if (ownedError) throw ownedError

  const { data: sharedTemplatesData, error: sharedError } = await supabase
    .from('template_shares')
    .select('template_id, permission_level, expense_templates(id, name, owner_id)')
    .match({ shared_with_user_id: userId })

  if (sharedError) throw sharedError

  // Combine owned and shared template IDs for filtering
  const ownedTemplateIds = new Set((ownedTemplates || []).map((t) => t.id))
  const sharedTemplateIds = new Set((sharedTemplatesData || []).map((s) => s.template_id))
  const allAccessibleTemplateIds = new Set([...ownedTemplateIds, ...sharedTemplateIds])

  if (allAccessibleTemplateIds.size === 0) {
    return categories.map((category) => ({
      ...category,
      templates: [],
    }))
  }

  // Get template items from all accessible templates, grouped by category
  const { data: templateItems, error: itemsError } = await supabase
    .from('expense_template_items')
    .select('category_id, template_id')
    .in('template_id', Array.from(allAccessibleTemplateIds))

  if (itemsError) throw itemsError

  // Group template IDs by category
  const categoryTemplateIds = (templateItems || []).reduce(
    (acc, item) => {
      if (!acc[item.category_id]) {
        acc[item.category_id] = new Set()
      }
      acc[item.category_id]?.add(item.template_id)
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  // Build template details for each category
  return categories.map((category) => {
    const templateIdsForCategory = categoryTemplateIds[category.id]
    if (!templateIdsForCategory || templateIdsForCategory.size === 0) {
      return {
        ...category,
        templates: [],
      }
    }

    const templates: CategoryTemplate[] = []

    // Add owned templates
    for (const template of ownedTemplates || []) {
      if (templateIdsForCategory.has(template.id)) {
        templates.push({
          id: template.id,
          name: template.name,
          owner_id: template.owner_id,
        })
      }
    }

    // Add shared templates
    for (const sharedData of sharedTemplatesData || []) {
      if (templateIdsForCategory.has(sharedData.template_id) && sharedData.expense_templates) {
        templates.push({
          id: sharedData.expense_templates.id,
          name: sharedData.expense_templates.name,
          owner_id: sharedData.expense_templates.owner_id,
          permission_level: sharedData.permission_level,
        })
      }
    }

    // Sort templates by name
    templates.sort((a, b) => a.name.localeCompare(b.name))

    return {
      ...category,
      templates,
    }
  })
}
