import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeAllNotifications,
  removeNotification,
} from 'src/api/notifications'
import { queryKeys } from './query-keys'
import { createMutationErrorHandler } from './query-error-handler'

export function invalidateNotificationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string,
) {
  if (!userId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    return
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.listAll(userId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) })
}

export function useNotificationsQuery(userId: MaybeRefOrGetter<string | undefined>, limit = 50) {
  return useQuery({
    queryKey: computed(() => queryKeys.notifications.list(toValue(userId) ?? '', limit)),
    queryFn: () => listNotifications(limit),
    enabled: computed(() => !!toValue(userId)),
    meta: { errorKey: 'NOTIFICATIONS.LOAD_FAILED' as const },
  })
}

export function useUnreadNotificationCountQuery(userId: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: computed(() => queryKeys.notifications.unreadCount(toValue(userId) ?? '')),
    queryFn: countUnreadNotifications,
    enabled: computed(() => !!toValue(userId)),
    meta: { errorKey: 'NOTIFICATIONS.LOAD_COUNT_FAILED' as const },
  })
}

export function useMarkNotificationAsReadMutation(userId: MaybeRefOrGetter<string | undefined>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      invalidateNotificationQueries(queryClient, toValue(userId))
    },
    onError: createMutationErrorHandler('NOTIFICATIONS.MARK_READ_FAILED'),
  })
}

export function useMarkAllNotificationsAsReadMutation(
  userId: MaybeRefOrGetter<string | undefined>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      invalidateNotificationQueries(queryClient, toValue(userId))
    },
    onError: createMutationErrorHandler('NOTIFICATIONS.MARK_ALL_READ_FAILED'),
  })
}

export function useRemoveNotificationMutation(userId: MaybeRefOrGetter<string | undefined>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => removeNotification(notificationId),
    onSuccess: () => {
      invalidateNotificationQueries(queryClient, toValue(userId))
    },
    onError: createMutationErrorHandler('NOTIFICATIONS.REMOVE_FAILED'),
  })
}

export function useRemoveAllNotificationsMutation(userId: MaybeRefOrGetter<string | undefined>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeAllNotifications,
    onSuccess: () => {
      invalidateNotificationQueries(queryClient, toValue(userId))
    },
    onError: createMutationErrorHandler('NOTIFICATIONS.REMOVE_ALL_FAILED'),
  })
}
