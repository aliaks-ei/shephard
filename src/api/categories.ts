import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

export type Category = Tables<'categories'>
export type CategoryInsert = TablesInsert<'categories'>
export type CategoryUpdate = TablesUpdate<'categories'>

export async function getCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`owner_id.eq.${userId},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory(category: CategoryInsert): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(category).select().single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) throw error
}
