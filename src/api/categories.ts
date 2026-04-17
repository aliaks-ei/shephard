import { supabase } from 'src/lib/supabase/client'
import type { Tables } from 'src/lib/supabase/types'

export type Category = Tables<'categories'>

export type CategoryWithStats = Category & {
  templates: CategoryTemplate[]
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
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

export async function getCategoriesWithStats(userId: string): Promise<CategoryWithStats[]> {
  const [categoriesResult, ownedTemplatesResult, sharedTemplatesResult] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('templates').select('id, name, owner_id').match({ owner_id: userId }),
    supabase
      .from('template_shares')
      .select('template_id, permission_level, templates(id, name, owner_id)')
      .match({ shared_with_user_id: userId }),
  ])

  if (categoriesResult.error) throw categoriesResult.error
  if (ownedTemplatesResult.error) throw ownedTemplatesResult.error
  if (sharedTemplatesResult.error) throw sharedTemplatesResult.error

  const categories = categoriesResult.data
  const ownedTemplates = ownedTemplatesResult.data
  const sharedTemplatesData = sharedTemplatesResult.data

  const ownedTemplateIds = new Set((ownedTemplates || []).map((t) => t.id))
  const sharedTemplateIds = new Set((sharedTemplatesData || []).map((s) => s.template_id))
  const allAccessibleTemplateIds = new Set([...ownedTemplateIds, ...sharedTemplateIds])

  if (allAccessibleTemplateIds.size === 0) {
    return categories.map((category) => ({
      ...category,
      templates: [],
    }))
  }

  const { data: templateItems, error: itemsError } = await supabase
    .from('template_items')
    .select('category_id, template_id')
    .in('template_id', Array.from(allAccessibleTemplateIds))

  if (itemsError) throw itemsError

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

  return categories.map((category) => {
    const templateIdsForCategory = categoryTemplateIds[category.id]
    if (!templateIdsForCategory || templateIdsForCategory.size === 0) {
      return {
        ...category,
        templates: [],
      }
    }

    const templates: CategoryTemplate[] = []

    for (const template of ownedTemplates || []) {
      if (templateIdsForCategory.has(template.id)) {
        templates.push({
          id: template.id,
          name: template.name,
          owner_id: template.owner_id,
        })
      }
    }

    for (const sharedData of sharedTemplatesData || []) {
      if (templateIdsForCategory.has(sharedData.template_id) && sharedData.templates) {
        templates.push({
          id: sharedData.templates.id,
          name: sharedData.templates.name,
          owner_id: sharedData.templates.owner_id,
          permission_level: sharedData.permission_level,
        })
      }
    }

    templates.sort((a, b) => a.name.localeCompare(b.name))

    return {
      ...category,
      templates,
    }
  })
}
