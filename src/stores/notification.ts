import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import type  { QNotifyCreateOptions } from 'quasar'

export type NotificationType = 'info' | 'positive' | 'negative' | 'warning'

export interface NotificationHistoryItem {
  id: string
  type: NotificationType
  message: string
  timestamp: Date
}

export const useNotificationStore = defineStore('notification', () => {
  const $q = useQuasar()
  const notificationHistory = ref<NotificationHistoryItem[]>([])

  const defaultOptions: Record<NotificationType, QNotifyCreateOptions> = {
    info: {
      type: 'info',
      color: 'info',
      icon: 'info',
      position: 'top',
      timeout: 3000,
    },
    positive: {
      type: 'positive',
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    },
    negative: {
      type: 'negative',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    },
    warning: {
      type: 'warning',
      color: 'warning',
      icon: 'warning',
      position: 'top',
      timeout: 4000,
    },
  }

  function showNotification(
    message: string,
    type: NotificationType = 'info',
    options: Partial<QNotifyCreateOptions> = {},
  ) {
    const id = crypto.randomUUID()

    notificationHistory.value.unshift({
      id,
      type,
      message,
      timestamp: new Date(),
    })

    if (notificationHistory.value.length > 20) {
      notificationHistory.value = notificationHistory.value.slice(0, 20)
    }

    $q.notify({
      ...defaultOptions[type],
      message,
      ...options,
    })

    return id
  }

  function showInfo(message: string, options: Partial<QNotifyCreateOptions> = {}) {
    return showNotification(message, 'info', options)
  }

  function showSuccess(message: string, options: Partial<QNotifyCreateOptions> = {}) {
    return showNotification(message, 'positive', options)
  }

  function showError(message: string, options: Partial<QNotifyCreateOptions> = {}) {
    return showNotification(message, 'negative', options)
  }

  function showWarning(message: string, options: Partial<QNotifyCreateOptions> = {}) {
    return showNotification(message, 'warning', options)
  }

  function clearHistory() {
    notificationHistory.value = []
  }

  return {
    notificationHistory,
    showNotification,
    showInfo,
    showSuccess,
    showError,
    showWarning,
    clearHistory,
  }
})
