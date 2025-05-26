import { useNotificationStore } from 'src/stores/notification'
import type { QNotifyCreateOptions } from 'quasar'

export function useNotification() {
  const notificationStore = useNotificationStore()

  return {
    notificationHistory: notificationStore.notificationHistory,

    showInfo: (message: string, options: Partial<QNotifyCreateOptions> = {}) =>
      notificationStore.showInfo(message, options),

    showSuccess: (message: string, options: Partial<QNotifyCreateOptions> = {}) =>
      notificationStore.showSuccess(message, options),

    showError: (message: string, options: Partial<QNotifyCreateOptions> = {}) =>
      notificationStore.showError(message, options),

    showWarning: (message: string, options: Partial<QNotifyCreateOptions> = {}) =>
      notificationStore.showWarning(message, options),

    showNotification: (message: string, options: Partial<QNotifyCreateOptions> = {}) =>
      notificationStore.showNotification(message, 'info', options),

    clearHistory: () => notificationStore.clearHistory(),
  }
}
