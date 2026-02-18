import type { Tables } from 'src/lib/supabase/types'
import {
  categories as seedCategories,
  users as seedUsers,
  templates as seedTemplates,
  templateItems as seedTemplateItems,
  templateShares as seedTemplateShares,
  plans as seedPlans,
  planItems as seedPlanItems,
  planShares as seedPlanShares,
  expenses as seedExpenses,
} from './seed'

type TableName =
  | 'categories'
  | 'users'
  | 'templates'
  | 'template_items'
  | 'template_shares'
  | 'plans'
  | 'plan_items'
  | 'plan_shares'
  | 'expenses'

type TableRow<T extends TableName> = Tables<T>

type TableMap = {
  [K in TableName]: Map<string, TableRow<K>>
}

function toMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]))
}

function createDb(): TableMap {
  return {
    categories: toMap(seedCategories),
    users: toMap(seedUsers),
    templates: toMap(seedTemplates),
    template_items: toMap(seedTemplateItems),
    template_shares: toMap(seedTemplateShares),
    plans: toMap(seedPlans),
    plan_items: toMap(seedPlanItems),
    plan_shares: toMap(seedPlanShares),
    expenses: toMap(seedExpenses),
  }
}

let db = createDb()

export function getAll<T extends TableName>(table: T): TableRow<T>[] {
  return Array.from(db[table].values())
}

export function getById<T extends TableName>(table: T, id: string): TableRow<T> | undefined {
  return db[table].get(id)
}

export function insert<T extends TableName>(
  table: T,
  row: TableRow<T> & { id: string },
): TableRow<T> {
  db[table].set(row.id, row as never)
  return row
}

export function update<T extends TableName>(
  table: T,
  id: string,
  updates: Partial<TableRow<T>>,
): TableRow<T> | undefined {
  const existing = db[table].get(id)
  if (!existing) return undefined
  const updated = { ...existing, ...updates } as TableRow<T>
  db[table].set(id, updated as never)
  return updated
}

export function remove<T extends TableName>(table: T, id: string): boolean {
  return db[table].delete(id)
}

export function filter<T extends TableName>(
  table: T,
  predicate: (row: TableRow<T>) => boolean,
): TableRow<T>[] {
  return getAll(table).filter(predicate)
}

export function resetDb(): void {
  db = createDb()
}
