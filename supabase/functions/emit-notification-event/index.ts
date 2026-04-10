import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import webPush from 'npm:web-push@3.6.7'
import {
  buildNotificationCopy,
  createErrorResponse,
  createSuccessResponse,
  corsHeaders,
  defaultNotificationPushPreferences,
  getNotificationRoute,
  isNotificationEntityType,
  isNotificationType,
  isRecord,
  type EmitNotificationEventInput,
  type NotificationEntityType,
  type NotificationType,
} from '../_shared/notification-utils.ts'

type EntityRecord = {
  id: string
  name: string
  owner_id: string
}

type ShareRecord = {
  permission_level: 'view' | 'edit'
  shared_with_user_id: string
}

type NotificationInsert = {
  actor_user_id: string
  body: string
  entity_id: string
  entity_type: NotificationEntityType
  payload: Record<string, unknown>
  title: string
  type: NotificationType
  user_id: string
}

type UserRecord = {
  email: string
  id: string
  name: string | null
  preferences: Record<string, unknown> | null
}

type PushSubscriptionRecord = {
  auth: string
  endpoint: string
  id: string
  p256dh: string
}

type CreatedNotification = {
  body: string
  id: string
  title: string
  type: NotificationType
  user_id: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')
const vapidSubject = Deno.env.get('WEB_PUSH_SUBJECT') ?? 'mailto:hello@shephard.app'

const pushConfigured = !!vapidPublicKey && !!vapidPrivateKey
if (pushConfigured) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!)
}

function createAuthedClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })
}

function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getShareTable(entityType: NotificationEntityType) {
  return entityType === 'plan'
    ? { table: 'plan_shares' as const, foreignKey: 'plan_id' as const }
    : { table: 'template_shares' as const, foreignKey: 'template_id' as const }
}

function isCollaboratorAction(type: NotificationType): boolean {
  return (
    type === 'shared_plan_updated' ||
    type === 'shared_template_updated' ||
    type === 'shared_plan_expense_added'
  )
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values))
}

function toPushPreferences(preferences: Record<string, unknown> | null) {
  const rawByType =
    preferences && isRecord(preferences['pushNotificationsByType'])
      ? preferences['pushNotificationsByType']
      : {}

  const byType = Object.fromEntries(
    Object.entries(defaultNotificationPushPreferences).map(([type, defaultValue]) => [
      type,
      typeof rawByType[type] === 'boolean' ? rawByType[type] : defaultValue,
    ]),
  ) as Record<NotificationType, boolean>

  return {
    enabled: preferences?.['pushNotificationsEnabled'] === true,
    byType,
  }
}

async function getAuthenticatedUser(authHeader: string) {
  const authClient = createAuthedClient(authHeader)
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser()

  if (error || !user) {
    throw new Error(error?.message ?? 'Unauthorized')
  }

  return user
}

async function getEntityAndActorAccess(
  serviceClient: ReturnType<typeof createServiceClient>,
  entityType: NotificationEntityType,
  entityId: string,
  actorId: string,
): Promise<{ entity: EntityRecord; actorShare: ShareRecord | null }> {
  const table = entityType === 'plan' ? 'plans' : 'templates'
  const { table: shareTable, foreignKey } = getShareTable(entityType)

  const { data: entityData, error: entityError } = await serviceClient
    .from(table)
    .select('id, name, owner_id')
    .eq('id', entityId)
    .maybeSingle()

  if (entityError) {
    throw entityError
  }

  const entity = entityData as EntityRecord | null

  if (!entity) {
    throw new Error('Entity not found')
  }

  const { data: actorShareData, error: actorShareError } = await serviceClient
    .from(shareTable)
    .select('permission_level, shared_with_user_id')
    .eq(foreignKey, entityId)
    .eq('shared_with_user_id', actorId)
    .maybeSingle()

  if (actorShareError) {
    throw actorShareError
  }

  return {
    entity,
    actorShare: (actorShareData as ShareRecord | null) ?? null,
  }
}

async function getAllParticipants(
  serviceClient: ReturnType<typeof createServiceClient>,
  entityType: NotificationEntityType,
  entityId: string,
  ownerId: string,
): Promise<string[]> {
  const { table: shareTable, foreignKey } = getShareTable(entityType)
  const { data, error } = await serviceClient
    .from(shareTable)
    .select('shared_with_user_id')
    .eq(foreignKey, entityId)

  if (error) {
    throw error
  }

  return dedupe([ownerId, ...(data ?? []).map((row) => row.shared_with_user_id)])
}

async function resolveRecipients(
  serviceClient: ReturnType<typeof createServiceClient>,
  input: EmitNotificationEventInput,
  actorId: string,
  ownerId: string,
): Promise<string[]> {
  if (input.targetUserIds?.length) {
    return dedupe(input.targetUserIds).filter((userId) => userId !== actorId)
  }

  if (input.targetUserId) {
    return input.targetUserId === actorId ? [] : [input.targetUserId]
  }

  const participants = await getAllParticipants(
    serviceClient,
    input.entityType,
    input.entityId,
    ownerId,
  )

  return participants.filter((userId) => userId !== actorId)
}

async function getUsersByIds(
  serviceClient: ReturnType<typeof createServiceClient>,
  userIds: string[],
): Promise<UserRecord[]> {
  if (userIds.length === 0) {
    return []
  }

  const { data, error } = await serviceClient
    .from('users')
    .select('id, name, email, preferences')
    .in('id', userIds)

  if (error) {
    throw error
  }

  return (data ?? []) as UserRecord[]
}

async function sendPushNotifications(
  serviceClient: ReturnType<typeof createServiceClient>,
  notifications: CreatedNotification[],
  payloadById: Map<string, { route: string }>,
  usersById: Map<string, UserRecord>,
) {
  if (!pushConfigured || notifications.length === 0) {
    return
  }

  for (const notification of notifications) {
    const recipient = usersById.get(notification.user_id)
    if (!recipient) {
      continue
    }

    const pushPreferences = toPushPreferences(recipient.preferences)
    if (!pushPreferences.enabled || !pushPreferences.byType[notification.type]) {
      continue
    }

    const { data: subscriptions, error: subscriptionError } = await serviceClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', notification.user_id)
      .is('revoked_at', null)

    if (subscriptionError) {
      throw subscriptionError
    }

    const pushAttemptedAt = new Date().toISOString()
    const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRecord[]

    if (activeSubscriptions.length === 0) {
      await serviceClient
        .from('notifications')
        .update({
          push_attempted_at: pushAttemptedAt,
          push_error: 'No active subscriptions',
        })
        .eq('id', notification.id)

      continue
    }

    let delivered = false
    let lastError: string | null = null
    const route =
      payloadById.get(notification.id)?.route ??
      getNotificationRoute(notification.type, 'plan', notification.id)

    for (const subscription of activeSubscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: route,
            notificationId: notification.id,
          }),
        )

        delivered = true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Push delivery failed'
        lastError = message

        const statusCode =
          isRecord(error) && typeof error['statusCode'] === 'number' ? error['statusCode'] : null

        if (statusCode === 404 || statusCode === 410) {
          await serviceClient
            .from('push_subscriptions')
            .update({
              revoked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
        }
      }
    }

    await serviceClient
      .from('notifications')
      .update({
        push_attempted_at: pushAttemptedAt,
        push_sent_at: delivered ? pushAttemptedAt : null,
        push_error: delivered ? null : lastError,
      })
      .eq('id', notification.id)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    if (!isRecord(rawBody)) {
      return createErrorResponse('Invalid notification payload', 400)
    }

    if (
      !isNotificationType(rawBody.type) ||
      !isNotificationEntityType(rawBody.entityType) ||
      typeof rawBody.entityId !== 'string' ||
      rawBody.entityId.length === 0
    ) {
      return createErrorResponse('Invalid notification event input', 400)
    }

    const input: EmitNotificationEventInput = {
      type: rawBody.type,
      entityType: rawBody.entityType,
      entityId: rawBody.entityId,
      ...(typeof rawBody.targetUserId === 'string' ? { targetUserId: rawBody.targetUserId } : {}),
      ...(Array.isArray(rawBody.targetUserIds)
        ? {
            targetUserIds: rawBody.targetUserIds.filter(
              (value): value is string => typeof value === 'string' && value.length > 0,
            ),
          }
        : {}),
      ...(rawBody.targetPermission === 'view' || rawBody.targetPermission === 'edit'
        ? { targetPermission: rawBody.targetPermission }
        : {}),
      ...(typeof rawBody.entityName === 'string' ? { entityName: rawBody.entityName } : {}),
      ...(typeof rawBody.expenseName === 'string' ? { expenseName: rawBody.expenseName } : {}),
    }

    const actor = await getAuthenticatedUser(authHeader)
    const serviceClient = createServiceClient()
    const { entity, actorShare } = await getEntityAndActorAccess(
      serviceClient,
      input.entityType,
      input.entityId,
      actor.id,
    )

    const actorIsOwner = entity.owner_id === actor.id
    if (!actorIsOwner) {
      if (!isCollaboratorAction(input.type) || actorShare?.permission_level !== 'edit') {
        return createErrorResponse('You do not have access to emit this notification event', 403)
      }
    }

    const recipients = await resolveRecipients(serviceClient, input, actor.id, entity.owner_id)
    if (recipients.length === 0) {
      return createSuccessResponse(null)
    }

    const relevantUsers = await getUsersByIds(serviceClient, [actor.id, ...recipients])
    const usersById = new Map(relevantUsers.map((user) => [user.id, user]))
    const actorUser = usersById.get(actor.id)
    const actorName = actorUser?.name ?? actorUser?.email ?? actor.email ?? 'Someone'
    const entityName = input.entityName ?? entity.name
    const copy = buildNotificationCopy(input, actorName, entityName)

    const rows: NotificationInsert[] = recipients.map((recipientId) => ({
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
        ...(input.expenseName ? { expenseName: input.expenseName } : {}),
        ...(input.targetPermission ? { permissionLevel: input.targetPermission } : {}),
        route: copy.route,
      },
    }))

    const { data: createdNotifications, error: insertError } = await serviceClient
      .from('notifications')
      .insert(rows)
      .select('id, user_id, type, title, body')

    if (insertError) {
      throw insertError
    }

    const notificationList = (createdNotifications ?? []) as CreatedNotification[]
    const payloadById = new Map(
      notificationList.map((notification) => [notification.id, { route: copy.route }]),
    )

    await sendPushNotifications(serviceClient, notificationList, payloadById, usersById)

    return createSuccessResponse(null)
  } catch (error) {
    console.error('Error in emit-notification-event:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
})
