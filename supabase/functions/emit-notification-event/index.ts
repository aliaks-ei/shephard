import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import webPush from 'npm:web-push@3.6.7'
import {
  buildCorsHeaders,
  buildNotificationCopy,
  createErrorResponse,
  createSuccessResponse,
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

type AuthenticatedUser = Awaited<ReturnType<typeof getAuthenticatedUser>>

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
  const participants = await getAllParticipants(
    serviceClient,
    input.entityType,
    input.entityId,
    ownerId,
  )
  const participantSet = new Set(participants)

  if (input.targetUserIds?.length) {
    return dedupe(input.targetUserIds).filter(
      (userId) => userId !== actorId && participantSet.has(userId),
    )
  }

  if (input.targetUserId) {
    return input.targetUserId !== actorId && participantSet.has(input.targetUserId)
      ? [input.targetUserId]
      : []
  }

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

async function deliverNotificationEvent(
  serviceClient: ReturnType<typeof createServiceClient>,
  actor: AuthenticatedUser,
  input: EmitNotificationEventInput,
  options: { recipients?: string[]; entityName?: string; trustedOutbox?: boolean } = {},
) {
  let entity: EntityRecord
  let actorShare: ShareRecord | null = null

  if (options.trustedOutbox && options.entityName) {
    entity = { id: input.entityId, name: options.entityName, owner_id: actor.id }
  } else {
    const access = await getEntityAndActorAccess(
      serviceClient,
      input.entityType,
      input.entityId,
      actor.id,
    )
    entity = access.entity
    actorShare = access.actorShare
  }

  const actorIsOwner = entity.owner_id === actor.id
  if (!options.trustedOutbox && !actorIsOwner) {
    if (!isCollaboratorAction(input.type) || actorShare?.permission_level !== 'edit') {
      throw new Error('FORBIDDEN_NOTIFICATION_EVENT')
    }
  }

  const recipients = options.recipients
    ? dedupe(options.recipients).filter((id) => id !== actor.id)
    : await resolveRecipients(serviceClient, input, actor.id, entity.owner_id)
  if (recipients.length === 0) return

  const relevantUsers = await getUsersByIds(serviceClient, [actor.id, ...recipients])
  const usersById = new Map(relevantUsers.map((user) => [user.id, user]))
  const actorUser = usersById.get(actor.id)
  const actorName = actorUser?.name ?? actorUser?.email ?? actor.email ?? 'Someone'
  const entityName = input.entityName ?? options.entityName ?? entity.name
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
  const { data, error } = await serviceClient
    .from('notifications')
    .insert(rows)
    .select('id, user_id, type, title, body')
  if (error) throw error

  const notifications = (data ?? []) as CreatedNotification[]
  const payloadById = new Map(notifications.map((item) => [item.id, { route: copy.route }]))
  EdgeRuntime.waitUntil(sendPushNotifications(serviceClient, notifications, payloadById, usersById))
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))
  const errorResponse = (error: string, status = 400) =>
    createErrorResponse(error, status, corsHeaders)
  const successResponse = (data: unknown, status = 200) =>
    createSuccessResponse(data, status, corsHeaders)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return errorResponse('Invalid JSON in request body', 400)
    }

    if (!isRecord(rawBody)) {
      return errorResponse('Invalid notification payload', 400)
    }

    const actor = await getAuthenticatedUser(authHeader)
    const serviceClient = createServiceClient()

    if (Array.isArray(rawBody.outboxIds)) {
      const outboxIds = rawBody.outboxIds
        .filter((id): id is string => typeof id === 'string' && id.length <= 64)
        .slice(0, 100)
      const { data: events, error: outboxError } = await serviceClient
        .from('notification_outbox')
        .select('*')
        .in('id', outboxIds)
        .eq('actor_user_id', actor.id)
        .in('status', ['pending', 'failed'])
      if (outboxError) throw outboxError

      for (const event of events ?? []) {
        await serviceClient.from('notification_outbox').update({
          status: 'processing', claimed_at: new Date().toISOString(), attempts: event.attempts + 1,
        }).eq('id', event.id)
        try {
          const payload = isRecord(event.payload) ? event.payload : {}
          await deliverNotificationEvent(serviceClient, actor, {
            type: event.event_type as NotificationType,
            entityType: event.entity_type as NotificationEntityType,
            entityId: event.entity_id,
            ...(typeof payload.expenseName === 'string' ? { expenseName: payload.expenseName } : {}),
            ...(typeof payload.entityName === 'string' ? { entityName: payload.entityName } : {}),
          }, {
            ...(Array.isArray(event.recipient_ids) ? { recipients: event.recipient_ids } : {}),
            ...(typeof payload.entityName === 'string' ? { entityName: payload.entityName } : {}),
            trustedOutbox: true,
          })
          await serviceClient.from('notification_outbox').update({
            status: 'completed', processed_at: new Date().toISOString(), last_error: null,
          }).eq('id', event.id)
        } catch (error) {
          await serviceClient.from('notification_outbox').update({
            status: 'failed', last_error: error instanceof Error ? error.message : 'Unknown error',
            available_at: new Date(Date.now() + 60_000).toISOString(),
          }).eq('id', event.id)
        }
      }
      return successResponse({ processed: events?.length ?? 0 })
    }

    if (
      !isNotificationType(rawBody.type) ||
      !isNotificationEntityType(rawBody.entityType) ||
      typeof rawBody.entityId !== 'string' ||
      rawBody.entityId.length === 0 ||
      rawBody.entityId.length > 64
    ) {
      return errorResponse('Invalid notification event input', 400)
    }

    const MAX_ENTITY_NAME_LENGTH = 200
    const MAX_EXPENSE_NAME_LENGTH = 200
    const MAX_TARGET_USER_IDS = 100
    const MAX_USER_ID_LENGTH = 64

    const clampString = (value: string, limit: number): string => value.trim().slice(0, limit)

    const input: EmitNotificationEventInput = {
      type: rawBody.type,
      entityType: rawBody.entityType,
      entityId: rawBody.entityId,
      ...(typeof rawBody.targetUserId === 'string' &&
      rawBody.targetUserId.length > 0 &&
      rawBody.targetUserId.length <= MAX_USER_ID_LENGTH
        ? { targetUserId: rawBody.targetUserId }
        : {}),
      ...(Array.isArray(rawBody.targetUserIds)
        ? {
            targetUserIds: rawBody.targetUserIds
              .filter(
                (value): value is string =>
                  typeof value === 'string' &&
                  value.length > 0 &&
                  value.length <= MAX_USER_ID_LENGTH,
              )
              .slice(0, MAX_TARGET_USER_IDS),
          }
        : {}),
      ...(rawBody.targetPermission === 'view' || rawBody.targetPermission === 'edit'
        ? { targetPermission: rawBody.targetPermission }
        : {}),
      ...(typeof rawBody.entityName === 'string'
        ? { entityName: clampString(rawBody.entityName, MAX_ENTITY_NAME_LENGTH) }
        : {}),
      ...(typeof rawBody.expenseName === 'string'
        ? { expenseName: clampString(rawBody.expenseName, MAX_EXPENSE_NAME_LENGTH) }
        : {}),
    }

    try {
      await deliverNotificationEvent(serviceClient, actor, input)
    } catch (error) {
      if (error instanceof Error && error.message === 'FORBIDDEN_NOTIFICATION_EVENT') {
        return errorResponse('You do not have access to emit this notification event', 403)
      }
      throw error
    }

    return successResponse(null)
  } catch (error) {
    console.error('Error in emit-notification-event:', error)
    return errorResponse('Internal server error', 500)
  }
})
