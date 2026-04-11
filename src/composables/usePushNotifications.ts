import { computed, ref, watch } from 'vue'
import { useUserStore } from 'src/stores/user'
import { isAppleMobileDevice, isRunningStandaloneApp } from 'src/utils/pwa'
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

export type PushAvailabilityReason =
  | 'checking'
  | 'ready'
  | 'unsupported'
  | 'ios_requires_install'
  | 'not_configured'

export function usePushNotifications() {
  const userStore = useUserStore()
  const { handleError } = useError()

  const permission = ref<PushPermissionState>('default')
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const isConfigLoading = ref(false)
  const isGlobalToggleLoading = ref(false)
  const optimisticEnabled = ref<boolean | null>(null)
  const availabilityReason = ref<PushAvailabilityReason>('checking')
  const pushConfig = ref<PushSubscriptionConfig>({
    publicKey: null,
    configured: false,
  })

  const globalPushEnabled = computed(
    () => optimisticEnabled.value ?? userStore.preferences.arePushNotificationsEnabled,
  )

  const pushPreferences = computed(() => ({
    ...defaultNotificationPushPreferences,
    ...(userStore.preferences.pushNotificationsByType ?? {}),
  }))

  const canManagePush = computed(() => {
    return availabilityReason.value === 'ready' && !!pushConfig.value.publicKey
  })

  async function refreshPushState() {
    if (!userStore.userProfile?.id) {
      availabilityReason.value = 'checking'
      return
    }

    isSupported.value = isPushSupported()
    permission.value = getPushPermissionState()

    if (isAppleMobileDevice() && !isRunningStandaloneApp()) {
      availabilityReason.value = 'ios_requires_install'
      pushConfig.value = { publicKey: null, configured: false }
      isSubscribed.value = false
      isSupported.value = false
      return
    }

    if (!isSupported.value) {
      availabilityReason.value = 'unsupported'
      pushConfig.value = { publicKey: null, configured: false }
      isSubscribed.value = false
      return
    }

    isConfigLoading.value = true
    availabilityReason.value = 'checking'

    try {
      pushConfig.value = await getPushSubscriptionConfig()
      const currentSubscription = await getCurrentBrowserPushSubscription()
      isSubscribed.value = !!currentSubscription
      availabilityReason.value =
        pushConfig.value.configured && !!pushConfig.value.publicKey ? 'ready' : 'not_configured'
    } catch (error) {
      availabilityReason.value = 'not_configured'
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
    optimisticEnabled.value = enabled

    try {
      if (enabled) {
        await enablePushNotifications()
      } else {
        await disablePushNotifications()
      }
    } catch (error) {
      optimisticEnabled.value = userStore.preferences.arePushNotificationsEnabled
      handleError('NOTIFICATIONS.PUSH_SETUP_FAILED', error)
    } finally {
      optimisticEnabled.value = null
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
    globalPushEnabled,
    availabilityReason,
    canManagePush,
    pushConfig,
    pushPreferences,
    refreshPushState,
    setPushNotificationsEnabled,
    updateNotificationTypePreference,
  }
}
