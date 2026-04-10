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
export type NotificationEntityType = 'plan' | 'template'

export type EmitNotificationEventInput = {
  type: NotificationType
  entityType: NotificationEntityType
  entityId: string
  targetUserId?: string
  targetUserIds?: string[]
  targetPermission?: 'view' | 'edit'
  entityName?: string
  expenseName?: string
}

export const defaultNotificationPushPreferences: Record<NotificationType, boolean> = {
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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

export function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

export function createSuccessResponse(data: unknown, status = 200): Response {
  return createJsonResponse({ success: true, data }, status)
}

export function createErrorResponse(error: string, status = 400, details?: string): Response {
  return createJsonResponse(
    {
      success: false,
      error,
      ...(details ? { details } : {}),
    },
    status,
  )
}

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && notificationTypes.includes(value as NotificationType)
}

export function isNotificationEntityType(value: unknown): value is NotificationEntityType {
  return value === 'plan' || value === 'template'
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getNotificationRoute(
  type: NotificationType,
  entityType: NotificationEntityType,
  entityId: string,
): string {
  if (type === 'shared_plan_removed') {
    return '/plans'
  }

  if (type === 'shared_template_removed') {
    return '/templates'
  }

  return entityType === 'plan' ? `/plans/${entityId}` : `/templates/${entityId}`
}

export function buildNotificationCopy(
  input: EmitNotificationEventInput,
  actorName: string,
  entityName: string,
): { title: string; body: string; route: string } {
  const route = getNotificationRoute(input.type, input.entityType, input.entityId)

  switch (input.type) {
    case 'plan_shared':
      return {
        title: `${actorName} shared a plan`,
        body: `${entityName} is now available in your plans.`,
        route,
      }
    case 'template_shared':
      return {
        title: `${actorName} shared a template`,
        body: `${entityName} is now available in your templates.`,
        route,
      }
    case 'shared_plan_updated':
      return {
        title: 'Shared plan updated',
        body: `${actorName} updated ${entityName}.`,
        route,
      }
    case 'shared_template_updated':
      return {
        title: 'Shared template updated',
        body: `${actorName} updated ${entityName}.`,
        route,
      }
    case 'shared_plan_expense_added':
      return {
        title: 'Expense added to shared plan',
        body: `${actorName} added ${input.expenseName ?? 'a new expense'} to ${entityName}.`,
        route,
      }
    case 'shared_plan_removed':
      return {
        title: 'Shared plan removed',
        body: `${actorName} removed your access to ${entityName}.`,
        route,
      }
    case 'shared_template_removed':
      return {
        title: 'Shared template removed',
        body: `${actorName} removed your access to ${entityName}.`,
        route,
      }
    case 'shared_plan_cancelled':
      return {
        title: 'Shared plan cancelled',
        body: `${actorName} cancelled ${entityName}.`,
        route,
      }
    case 'shared_plan_permission_changed':
      return {
        title: 'Plan access updated',
        body: `${actorName} changed your ${entityName} access to ${input.targetPermission ?? 'view'}.`,
        route,
      }
    case 'shared_template_permission_changed':
      return {
        title: 'Template access updated',
        body: `${actorName} changed your ${entityName} access to ${input.targetPermission ?? 'view'}.`,
        route,
      }
  }
}
