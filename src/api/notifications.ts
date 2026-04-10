import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert } from 'src/lib/supabase/types'
import {
  isNotificationEntityType,
  isNotificationType,
  type NotificationEntityType,
  type NotificationType,
} from 'src/types/notifications'
import type { NotificationPayload } from 'src/utils/notifications'

export type NotificationRecord = Omit<
  Tables<'notifications'>,
  'type' | 'entity_type' | 'payload'
> & {
  type: NotificationType
  entity_type: NotificationEntityType
  payload: NotificationPayload
}

export type NotificationInsert = Omit<
  TablesInsert<'notifications'>,
  'type' | 'entity_type' | 'payload'
> & {
  type: NotificationType
  entity_type: NotificationEntityType
  payload?: NotificationPayload
}

export type EmitNotificationEventInput = {
  type: NotificationType
  entityType: NotificationEntityType
  entityId: string
  targetUserId?: string | undefined
  targetUserIds?: string[] | undefined
  targetPermission?: 'view' | 'edit' | undefined
  entityName?: string | undefined
  expenseName?: string | undefined
}

type PushSubscriptionAction = 'get-config' | 'upsert' | 'revoke'

export type BrowserPushSubscription = {
  endpoint: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export type PushSubscriptionConfig = {
  publicKey: string | null
  configured: boolean
}

function toNotificationRecord(row: Tables<'notifications'>): NotificationRecord {
  const type = isNotificationType(row.type) ? row.type : 'plan_shared'
  const entityType = isNotificationEntityType(row.entity_type) ? row.entity_type : 'plan'
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as NotificationPayload)
      : {}

  return {
    ...row,
    type,
    entity_type: entityType,
    payload,
  }
}

async function invokeFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(functionName, { body })

  if (error) {
    throw error
  }

  if (!data || typeof data !== 'object' || !('success' in data)) {
    throw new Error(`Unexpected response from ${functionName}`)
  }

  const response = data as { success: boolean; error?: string; data?: TResponse }

  if (!response.success) {
    throw new Error(response.error || `Request to ${functionName} failed`)
  }

  return response.data as TResponse
}

export async function listNotifications(limit = 50): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map(toNotificationRecord)
}

export async function countUnreadNotifications(): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .is('deleted_at', null)
    .is('read_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.length ?? 0
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('deleted_at', null)

  if (error) throw error
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .is('deleted_at', null)

  if (error) throw error
}

export async function removeNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('deleted_at', null)

  if (error) throw error
}

export async function removeAllNotifications(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ deleted_at: new Date().toISOString() })
    .is('deleted_at', null)

  if (error) throw error
}

export async function emitNotificationEvent(input: EmitNotificationEventInput): Promise<void> {
  await invokeFunction<null>('emit-notification-event', input)
}

export async function getPushSubscriptionConfig(): Promise<PushSubscriptionConfig> {
  return invokeFunction<PushSubscriptionConfig>('push-subscriptions', {
    action: 'get-config' satisfies PushSubscriptionAction,
  })
}

export async function savePushSubscription(subscription: BrowserPushSubscription): Promise<void> {
  await invokeFunction<null>('push-subscriptions', {
    action: 'upsert' satisfies PushSubscriptionAction,
    subscription,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  })
}

export async function revokePushSubscription(endpoint?: string): Promise<void> {
  await invokeFunction<null>('push-subscriptions', {
    action: 'revoke' satisfies PushSubscriptionAction,
    endpoint: endpoint ?? null,
  })
}

export async function subscribeToNotifications(
  userId: string,
  onChange: () => void,
): Promise<() => void> {
  if (import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { subscribeToNotificationMutations } = await import('src/mocks/data/db')

    return subscribeToNotificationMutations((event) => {
      const record = 'record' in event ? event.record : event.oldRecord
      if (record?.user_id === userId) {
        onChange()
      }
    })
  }

  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
