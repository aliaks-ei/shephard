import { http, HttpResponse } from 'msw'
import type { Tables } from 'src/lib/supabase/types'
import { categories, MOCK_USER_ID } from 'src/mocks/data/seed'
import { getAll, getById, insert, update } from 'src/mocks/data/db'
import {
  defaultNotificationPushPreferences,
  type NotificationEntityType,
  type NotificationType,
} from 'src/types/notifications'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const MOCK_WEB_PUSH_PUBLIC_KEY =
  'BDmB5Y7ZiT7XoMZbPO7v0cR4zS1n5JQ_cz7g0tA0RrFJg2Y7F4m5W6N8PqLk9uVwXyZaBcDeFgHiJkLmNoPq'

type EmitNotificationEventInput = {
  type: NotificationType
  entityType: NotificationEntityType
  entityId: string
  targetUserId?: string
  targetUserIds?: string[]
  targetPermission?: 'view' | 'edit'
  entityName?: string
  expenseName?: string
}

type PushSubscriptionAction = 'get-config' | 'upsert' | 'revoke'

type BrowserPushSubscription = {
  endpoint: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

type UserPreferences = {
  pushNotificationsEnabled?: boolean
  pushNotificationsByType?: Partial<Record<NotificationType, boolean>>
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values))
}

function getEntity(
  entityType: NotificationEntityType,
  entityId: string,
): Tables<'plans'> | Tables<'templates'> | undefined {
  return entityType === 'plan' ? getById('plans', entityId) : getById('templates', entityId)
}

function getShareRows(entityType: NotificationEntityType, entityId: string) {
  return entityType === 'plan'
    ? getAll('plan_shares').filter((share) => share.plan_id === entityId)
    : getAll('template_shares').filter((share) => share.template_id === entityId)
}

function getRecipients(
  input: EmitNotificationEventInput,
  actorId: string,
  ownerId: string,
): string[] {
  if (input.targetUserIds?.length) {
    return dedupe(input.targetUserIds).filter((userId) => userId !== actorId)
  }

  if (input.targetUserId) {
    return input.targetUserId === actorId ? [] : [input.targetUserId]
  }

  const participantIds = [
    ownerId,
    ...getShareRows(input.entityType, input.entityId).map((share) => share.shared_with_user_id),
  ]

  return dedupe(participantIds).filter((userId) => userId !== actorId)
}

function canActorTrigger(
  input: EmitNotificationEventInput,
  actorId: string,
  ownerId: string,
): boolean {
  if (actorId === ownerId) {
    return true
  }

  const actorShare = getShareRows(input.entityType, input.entityId).find(
    (share) => share.shared_with_user_id === actorId,
  )

  if (!actorShare) {
    return false
  }

  const collaboratorActions: NotificationType[] = [
    'shared_plan_updated',
    'shared_template_updated',
    'shared_plan_expense_added',
  ]

  if (!collaboratorActions.includes(input.type)) {
    return false
  }

  return actorShare.permission_level === 'edit'
}

function getRoute(
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

function buildNotificationCopy(
  input: EmitNotificationEventInput,
  actorName: string,
  entityName: string,
) {
  const route = getRoute(input.type, input.entityType, input.entityId)

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

function getUserPushPreferences(userId: string) {
  const user = getById('users', userId)
  const preferences = (user?.preferences ?? {}) as UserPreferences

  return {
    enabled: preferences.pushNotificationsEnabled ?? false,
    byType: {
      ...defaultNotificationPushPreferences,
      ...(preferences.pushNotificationsByType ?? {}),
    },
  }
}

function markPushDelivery(
  notification: Tables<'notifications'>,
  sent: boolean,
  errorMessage: string | null,
) {
  const timestamp = new Date().toISOString()

  update('notifications', notification.id, {
    push_attempted_at: timestamp,
    push_sent_at: sent ? timestamp : null,
    push_error: errorMessage,
  })
}

function deliverMockPush(notification: Tables<'notifications'>) {
  const preferences = getUserPushPreferences(notification.user_id)

  if (!preferences.enabled || !preferences.byType[notification.type as NotificationType]) {
    return
  }

  const activeSubscriptions = getAll('push_subscriptions').filter(
    (subscription) => subscription.user_id === notification.user_id && !subscription.revoked_at,
  )

  if (activeSubscriptions.length === 0) {
    markPushDelivery(notification, false, 'No active subscriptions')
    return
  }

  markPushDelivery(notification, true, null)
}

export const edgeFunctionHandlers = [
  // categorize-expense
  http.post(`${SUPABASE_URL}/functions/v1/categorize-expense`, () => {
    const foodCategory = categories.find((c) => c.id === 'cat-food')!
    return HttpResponse.json({
      success: true,
      data: {
        categoryId: foodCategory.id,
        categoryName: foodCategory.name,
        confidence: 0.85,
        reasoning: 'Mock: expense name suggests a food-related purchase.',
      },
    })
  }),

  // analyze-expense-photo
  http.post(`${SUPABASE_URL}/functions/v1/analyze-expense-photo`, () => {
    const foodCategory = categories.find((c) => c.id === 'cat-food')!
    return HttpResponse.json({
      success: true,
      data: {
        expenseName: 'Grocery receipt',
        amount: 42.5,
        categoryId: foodCategory.id,
        categoryName: foodCategory.name,
        confidence: 0.78,
        reasoning: 'Mock: detected receipt with grocery items.',
      },
    })
  }),

  // convert-currency
  http.post(`${SUPABASE_URL}/functions/v1/convert-currency`, async ({ request }) => {
    const body = (await request.json()) as { from: string; to: string; amount: number }
    const rate = 1.1
    return HttpResponse.json({
      success: true,
      data: {
        from: body.from,
        to: body.to,
        originalAmount: body.amount,
        convertedAmount: Math.round(body.amount * rate * 100) / 100,
        rate,
        timestamp: Date.now(),
      },
    })
  }),

  // emit-notification-event
  http.post(`${SUPABASE_URL}/functions/v1/emit-notification-event`, async ({ request }) => {
    const input = (await request.json()) as EmitNotificationEventInput
    const actor = getById('users', MOCK_USER_ID)
    const entity = getEntity(input.entityType, input.entityId)

    if (!actor || !entity) {
      return HttpResponse.json(
        { success: false, error: 'Notification target could not be resolved' },
        { status: 404 },
      )
    }

    if (!canActorTrigger(input, actor.id, entity.owner_id)) {
      return HttpResponse.json(
        { success: false, error: 'You do not have access to emit this notification event' },
        { status: 403 },
      )
    }

    const recipients = getRecipients(input, actor.id, entity.owner_id)

    if (recipients.length === 0) {
      return HttpResponse.json({ success: true, data: null })
    }

    const actorName = actor.name ?? actor.email
    const entityName = input.entityName ?? entity.name
    const copy = buildNotificationCopy(input, actorName, entityName)

    for (const recipientId of recipients) {
      const notification: Tables<'notifications'> = {
        id: crypto.randomUUID(),
        user_id: recipientId,
        actor_user_id: actor.id,
        type: input.type,
        entity_type: input.entityType,
        entity_id: input.entityId,
        title: copy.title,
        body: copy.body,
        payload: {
          actorName,
          entityName,
          expenseName: input.expenseName,
          permissionLevel: input.targetPermission,
          route: copy.route,
        },
        read_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        push_attempted_at: null,
        push_sent_at: null,
        push_error: null,
      }

      insert('notifications', notification)
      deliverMockPush(notification)
    }

    return HttpResponse.json({ success: true, data: null })
  }),

  // push-subscriptions
  http.post(`${SUPABASE_URL}/functions/v1/push-subscriptions`, async ({ request }) => {
    const body = (await request.json()) as {
      action: PushSubscriptionAction
      subscription?: BrowserPushSubscription
      userAgent?: string | null
      endpoint?: string | null
    }

    switch (body.action) {
      case 'get-config':
        return HttpResponse.json({
          success: true,
          data: {
            publicKey: MOCK_WEB_PUSH_PUBLIC_KEY,
            configured: true,
          },
        })
      case 'upsert': {
        const endpoint = body.subscription?.endpoint
        const p256dh = body.subscription?.keys?.p256dh
        const auth = body.subscription?.keys?.auth

        if (!endpoint || !p256dh || !auth) {
          return HttpResponse.json(
            { success: false, error: 'Incomplete push subscription data' },
            { status: 400 },
          )
        }

        const existing = getAll('push_subscriptions').find(
          (subscription) => subscription.endpoint === endpoint,
        )

        if (existing) {
          update('push_subscriptions', existing.id, {
            user_id: MOCK_USER_ID,
            p256dh,
            auth,
            user_agent: body.userAgent ?? null,
            revoked_at: null,
            updated_at: new Date().toISOString(),
          })
        } else {
          insert('push_subscriptions', {
            id: crypto.randomUUID(),
            user_id: MOCK_USER_ID,
            endpoint,
            p256dh,
            auth,
            user_agent: body.userAgent ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            revoked_at: null,
          })
        }

        return HttpResponse.json({ success: true, data: null })
      }
      case 'revoke': {
        const subscriptions = getAll('push_subscriptions').filter((subscription) => {
          if (subscription.user_id !== MOCK_USER_ID || subscription.revoked_at) {
            return false
          }

          return body.endpoint ? subscription.endpoint === body.endpoint : true
        })

        for (const subscription of subscriptions) {
          update('push_subscriptions', subscription.id, {
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }

        return HttpResponse.json({ success: true, data: null })
      }
      default:
        return HttpResponse.json(
          { success: false, error: 'Unsupported push subscription action' },
          { status: 400 },
        )
    }
  }),
]
