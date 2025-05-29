import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Notify, type QNotifyCreateOptions } from 'quasar'

export type NotificationType = 'info' | 'positive' | 'negative' | 'warning'

export interface NotificationItem {
  id: string
  type: NotificationType
  message: string
  timestamp: Date
  group?: string | number | boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])

  const defaultOptions: Record<NotificationType, QNotifyCreateOptions> = {
    info: {
      type: 'info',
      icon: 'info',
      timeout: 3000,
    },
    positive: {
      type: 'positive',
      icon: 'check_circle',
      timeout: 3000,
    },
    negative: {
      type: 'negative',
      icon: 'error',
      timeout: 5000,
    },
    warning: {
      type: 'warning',
      icon: 'warning',
      timeout: 4000,
    },
  }

  function showNotification(
    message: string,
    type: NotificationType = 'info',
    options: Partial<QNotifyCreateOptions> = {},
  ) {
    const id = crypto.randomUUID()

    notifications.value.unshift({
      id,
      type,
      message,
      timestamp: new Date(),
      ...(options.group !== undefined && { group: options.group }),
    })

    if (notifications.value.length > 20) {
      notifications.value = notifications.value.slice(0, 20)
    }

    const notificationConfig: QNotifyCreateOptions = {
      ...defaultOptions[type],
      message,
      ...options,
    }

    Notify.create(notificationConfig)

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

  return {
    notifications,

    showNotification,
    showInfo,
    showSuccess,
    showError,
    showWarning,
  }
})
