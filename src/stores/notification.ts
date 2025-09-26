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
      icon: 'eva-info-outline',
      timeout: 3000,
    },
    positive: {
      type: 'positive',
      icon: 'eva-checkmark-circle-outline',
      timeout: 3000,
    },
    negative: {
      type: 'negative',
      icon: 'eva-alert-triangle-outline',
      timeout: 5000,
      actions: [
        {
          icon: 'eva-close-outline',
          color: 'white',
          round: true,
          dense: true,
          size: 'sm',
          handler: () => {},
        },
      ],
    },
    warning: {
      type: 'warning',
      icon: 'eva-alert-triangle-outline',
      timeout: 4000,
      actions: [
        {
          icon: 'eva-close-outline',
          color: 'white',
          round: true,
          dense: true,
          size: 'sm',
          handler: () => {},
        },
      ],
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
