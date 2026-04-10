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
  notifications as seedNotifications,
  pushSubscriptions as seedPushSubscriptions,
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
  | 'notifications'
  | 'push_subscriptions'

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
    notifications: toMap(seedNotifications),
    push_subscriptions: toMap(seedPushSubscriptions),
  }
}

let db = createDb()
type NotificationRecord = Tables<'notifications'>
export type NotificationMutationEvent =
  | { type: 'insert'; record: NotificationRecord }
  | { type: 'update'; record: NotificationRecord; oldRecord: NotificationRecord }
  | { type: 'delete'; oldRecord: NotificationRecord }

const notificationMutationListeners = new Set<(event: NotificationMutationEvent) => void>()

function notifyNotificationMutation(event: NotificationMutationEvent) {
  for (const listener of notificationMutationListeners) {
    listener(event)
  }
}

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

  if (table === 'notifications') {
    notifyNotificationMutation({
      type: 'insert',
      record: row as NotificationRecord,
    })
  }

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

  if (table === 'notifications') {
    notifyNotificationMutation({
      type: 'update',
      record: updated as NotificationRecord,
      oldRecord: existing as NotificationRecord,
    })
  }

  return updated
}

export function remove<T extends TableName>(table: T, id: string): boolean {
  const existing = db[table].get(id)
  const removed = db[table].delete(id)

  if (removed && table === 'notifications' && existing) {
    notifyNotificationMutation({
      type: 'delete',
      oldRecord: existing as NotificationRecord,
    })
  }

  return removed
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

export function subscribeToNotificationMutations(
  listener: (event: NotificationMutationEvent) => void,
): () => void {
  notificationMutationListeners.add(listener)

  return () => {
    notificationMutationListeners.delete(listener)
  }
}
