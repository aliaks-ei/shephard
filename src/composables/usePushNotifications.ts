import { computed, ref, watch } from 'vue'
import { useUserStore } from 'src/stores/user'
import { useError } from './useError'
import {
  getPushSubscriptionConfig,
  revokePushSubscription,
  savePushSubscription,
  type PushSubscriptionConfig,
} from 'src/api/notifications'
import { defaultNotificationPushPreferences, type NotificationType } from 'src/types/notifications'
import {
  getCurrentBrowserPushSubscription,
  getPushPermissionState,
  isPushSupported,
  requestPushPermission,
  subscribeBrowserPush,
  unsubscribeBrowserPush,
  type PushPermissionState,
} from 'src/utils/push'

export function usePushNotifications() {
  const userStore = useUserStore()
  const { handleError } = useError()

  const permission = ref<PushPermissionState>('default')
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const isConfigLoading = ref(false)
  const isGlobalToggleLoading = ref(false)
  const pushConfig = ref<PushSubscriptionConfig>({
    publicKey: null,
    configured: false,
  })

  const pushPreferences = computed(() => ({
    ...defaultNotificationPushPreferences,
    ...(userStore.preferences.pushNotificationsByType ?? {}),
  }))

  const canManagePush = computed(() => {
    return isSupported.value && pushConfig.value.configured && !!pushConfig.value.publicKey
  })

  async function refreshPushState() {
    if (!userStore.userProfile?.id) {
      return
    }

    isSupported.value = isPushSupported()
    permission.value = getPushPermissionState()

    if (!isSupported.value) {
      pushConfig.value = { publicKey: null, configured: false }
      isSubscribed.value = false
      return
    }

    isConfigLoading.value = true

    try {
      pushConfig.value = await getPushSubscriptionConfig()
      const currentSubscription = await getCurrentBrowserPushSubscription()
      isSubscribed.value = !!currentSubscription
    } catch (error) {
      handleError('NOTIFICATIONS.PUSH_SETUP_FAILED', error)
    } finally {
      isConfigLoading.value = false
    }
  }

  async function enablePushNotifications() {
    if (!canManagePush.value || !pushConfig.value.publicKey) {
      throw new Error('Push notifications are not available on this device')
    }

    const currentPermission = getPushPermissionState()
    permission.value = currentPermission

    if (currentPermission === 'denied') {
      throw new Error('Push notifications are blocked in this browser')
    }

    if (currentPermission !== 'granted') {
      permission.value = await requestPushPermission()
    }

    if (permission.value !== 'granted') {
      throw new Error('Push notification permission was not granted')
    }

    const subscription = await subscribeBrowserPush(pushConfig.value.publicKey)

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      throw new Error('Push subscription data is incomplete')
    }

    await savePushSubscription(subscription)
    await userStore.updateUserPreferences({
      preferences: { pushNotificationsEnabled: true },
    })
    isSubscribed.value = true
  }

  async function disablePushNotifications() {
    await userStore.updateUserPreferences({
      preferences: { pushNotificationsEnabled: false },
    })

    try {
      const endpoint = await unsubscribeBrowserPush()
      await revokePushSubscription(endpoint ?? undefined)
    } catch (error) {
      handleError('NOTIFICATIONS.PUSH_SETUP_FAILED', error, undefined, { notify: false })
    } finally {
      isSubscribed.value = false
    }
  }

  async function setPushNotificationsEnabled(enabled: boolean) {
    isGlobalToggleLoading.value = true

    try {
      if (enabled) {
        await enablePushNotifications()
      } else {
        await disablePushNotifications()
      }
    } catch (error) {
      handleError('NOTIFICATIONS.PUSH_SETUP_FAILED', error)
    } finally {
      isGlobalToggleLoading.value = false
    }
  }

  async function updateNotificationTypePreference(type: NotificationType, enabled: boolean) {
    await userStore.updateUserPreferences({
      preferences: {
        pushNotificationsByType: {
          ...pushPreferences.value,
          [type]: enabled,
        },
      },
    })
  }

  watch(
    () => userStore.userProfile?.id,
    () => {
      void refreshPushState()
    },
    { immediate: true },
  )

  return {
    permission,
    isSupported,
    isSubscribed,
    isConfigLoading,
    isGlobalToggleLoading,
    canManagePush,
    pushConfig,
    pushPreferences,
    refreshPushState,
    setPushNotificationsEnabled,
    updateNotificationTypePreference,
  }
}
