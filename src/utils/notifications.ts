import type { NotificationEntityType, NotificationType } from 'src/types/notifications'
import type { NotificationRecord } from 'src/api/notifications'

export type NotificationPayload = {
  actorName?: string
  entityName?: string
  expenseName?: string
  permissionLevel?: 'view' | 'edit'
  route?: string
}

export type NotificationRouteInput = {
  type: NotificationType
  entity_type: NotificationEntityType
  entity_id: string
  payload: NotificationPayload
}

export type NotificationSection = {
  key: 'unread' | 'earlier'
  title: string
  notifications: NotificationRecord[]
}

export function formatNotificationRelativeTime(dateString: string): string {
  const target = new Date(dateString)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()

  const minutes = Math.round(diffMs / (60 * 1000))
  const hours = Math.round(diffMs / (60 * 60 * 1000))
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000))

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute')
  }

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour')
  }

  return formatter.format(days, 'day')
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'plan_shared':
    case 'template_shared':
      return 'eva-share-outline'
    case 'shared_plan_updated':
    case 'shared_template_updated':
      return 'eva-edit-outline'
    case 'shared_plan_expense_added':
      return 'eva-credit-card-outline'
    case 'shared_plan_removed':
    case 'shared_template_removed':
      return 'eva-close-circle-outline'
    case 'shared_plan_cancelled':
      return 'eva-slash-outline'
    case 'shared_plan_permission_changed':
    case 'shared_template_permission_changed':
      return 'eva-lock-outline'
    default:
      return 'eva-bell-outline'
  }
}

export function getNotificationSections(
  notifications: NotificationRecord[],
): NotificationSection[] {
  const unread = notifications.filter((notification) => !notification.read_at)
  const earlier = notifications.filter((notification) => !!notification.read_at)

  const sections: NotificationSection[] = [
    { key: 'unread', title: 'Unread', notifications: unread },
    { key: 'earlier', title: 'Earlier', notifications: earlier },
  ]

  return sections.filter((section) => section.notifications.length > 0)
}

export function getNotificationRoute(notification: NotificationRouteInput): string {
  if (notification.payload.route) {
    return notification.payload.route
  }

  if (notification.type === 'shared_plan_removed') {
    return '/plans'
  }

  if (notification.type === 'shared_template_removed') {
    return '/templates'
  }

  return notification.entity_type === 'plan'
    ? `/plans/${notification.entity_id}`
    : `/templates/${notification.entity_id}`
}
