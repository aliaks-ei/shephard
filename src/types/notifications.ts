export const notificationTypes = [
  'plan_shared',
  'template_shared',
  'shared_plan_updated',
  'shared_template_updated',
  'shared_plan_expense_added',
  'shared_plan_removed',
  'shared_template_removed',
  'shared_plan_cancelled',
  'shared_plan_permission_changed',
  'shared_template_permission_changed',
] as const

export type NotificationType = (typeof notificationTypes)[number]

export const notificationEntityTypes = ['plan', 'template'] as const

export type NotificationEntityType = (typeof notificationEntityTypes)[number]

export type NotificationPayload = {
  actorName?: string
  entityName?: string
  expenseName?: string
  permissionLevel?: 'view' | 'edit'
  route?: string
}

export type NotificationPushPreferences = Record<NotificationType, boolean>

export type PartialNotificationPushPreferences = Partial<NotificationPushPreferences>

export const defaultNotificationPushPreferences: NotificationPushPreferences = {
  plan_shared: true,
  template_shared: true,
  shared_plan_updated: true,
  shared_template_updated: true,
  shared_plan_expense_added: true,
  shared_plan_removed: true,
  shared_template_removed: true,
  shared_plan_cancelled: true,
  shared_plan_permission_changed: true,
  shared_template_permission_changed: true,
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  plan_shared: 'Plan shared with me',
  template_shared: 'Template shared with me',
  shared_plan_updated: 'Shared plan updated',
  shared_template_updated: 'Shared template updated',
  shared_plan_expense_added: 'Expense added to shared plan',
  shared_plan_removed: 'Shared plan removed',
  shared_template_removed: 'Shared template removed',
  shared_plan_cancelled: 'Shared plan cancelled',
  shared_plan_permission_changed: 'Shared plan permission changed',
  shared_template_permission_changed: 'Shared template permission changed',
}

export const notificationTypeDescriptions: Record<NotificationType, string> = {
  plan_shared: 'Notify me when someone shares a plan with me.',
  template_shared: 'Notify me when someone shares a template with me.',
  shared_plan_updated: 'Notify me when someone updates a shared plan.',
  shared_template_updated: 'Notify me when someone updates a shared template.',
  shared_plan_expense_added: 'Notify me when someone adds an expense to a shared plan.',
  shared_plan_removed: 'Notify me when a shared plan is removed or access is revoked.',
  shared_template_removed: 'Notify me when a shared template is removed or access is revoked.',
  shared_plan_cancelled: 'Notify me when someone cancels a shared plan.',
  shared_plan_permission_changed: 'Notify me when my shared plan permissions change.',
  shared_template_permission_changed: 'Notify me when my shared template permissions change.',
}

export const notificationPreferenceGroups = [
  {
    key: 'sharing',
    title: 'Sharing',
    types: ['plan_shared', 'template_shared'] as NotificationType[],
  },
  {
    key: 'activity',
    title: 'Shared Activity',
    types: [
      'shared_plan_updated',
      'shared_template_updated',
      'shared_plan_expense_added',
      'shared_plan_cancelled',
    ] as NotificationType[],
  },
  {
    key: 'access',
    title: 'Access Changes',
    types: [
      'shared_plan_permission_changed',
      'shared_template_permission_changed',
      'shared_plan_removed',
      'shared_template_removed',
    ] as NotificationType[],
  },
] as const

export function isNotificationType(value: string): value is NotificationType {
  return notificationTypes.includes(value as NotificationType)
}

export function isNotificationEntityType(value: string): value is NotificationEntityType {
  return notificationEntityTypes.includes(value as NotificationEntityType)
}
