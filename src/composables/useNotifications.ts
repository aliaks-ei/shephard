import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useUserStore } from 'src/stores/user'
import { subscribeToNotifications, type NotificationRecord } from 'src/api/notifications'
import {
  invalidateNotificationQueries,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
  useRemoveAllNotificationsMutation,
  useRemoveNotificationMutation,
  useUnreadNotificationCountQuery,
} from 'src/queries/notifications'
import { getNotificationRoute } from 'src/utils/notifications'

const DEFAULT_LIMIT = 50

export function useNotifications() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const userStore = useUserStore()

  const userId = computed(() => userStore.userProfile?.id)
  const notificationsQuery = useNotificationsQuery(userId, DEFAULT_LIMIT)
  const unreadCountQuery = useUnreadNotificationCountQuery(userId)
  const markAsReadMutation = useMarkNotificationAsReadMutation(userId)
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation(userId)
  const removeNotificationMutation = useRemoveNotificationMutation(userId)
  const removeAllNotificationsMutation = useRemoveAllNotificationsMutation(userId)

  const notifications = computed(() => notificationsQuery.data.value ?? [])
  const unreadCount = computed(() => unreadCountQuery.data.value ?? 0)
  const isLoading = computed(
    () => notificationsQuery.isPending.value || unreadCountQuery.isPending.value,
  )

  const cleanup = ref<null | (() => void | Promise<void>)>(null)

  async function openNotification(notification: NotificationRecord) {
    if (!notification.read_at) {
      await markAsReadMutation.mutateAsync(notification.id)
    }

    await router.push(getNotificationRoute(notification))
  }

  async function markAsRead(notificationId: string) {
    await markAsReadMutation.mutateAsync(notificationId)
  }

  async function removeNotification(notificationId: string) {
    await removeNotificationMutation.mutateAsync(notificationId)
  }

  async function markAllAsRead() {
    await markAllAsReadMutation.mutateAsync()
  }

  async function clearAllNotifications() {
    await removeAllNotificationsMutation.mutateAsync()
  }

  watch(
    userId,
    async (nextUserId, _previousUserId, onCleanup) => {
      if (cleanup.value) {
        await cleanup.value()
        cleanup.value = null
      }

      if (!nextUserId) {
        return
      }

      cleanup.value = await subscribeToNotifications(nextUserId, () => {
        invalidateNotificationQueries(queryClient, nextUserId)
      })

      onCleanup(() => {
        if (cleanup.value) {
          void cleanup.value()
          cleanup.value = null
        }
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (cleanup.value) {
      void cleanup.value()
      cleanup.value = null
    }
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    openNotification,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearAllNotifications,
  }
}
