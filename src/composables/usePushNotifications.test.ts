import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import { usePushNotifications } from './usePushNotifications'

const mockHandleError = vi.fn()
const mockGetPushSubscriptionConfig = vi.fn()
const mockSavePushSubscription = vi.fn()
const mockRevokePushSubscription = vi.fn()
const mockGetCurrentBrowserPushSubscription = vi.fn()
const mockGetPushPermissionState = vi.fn()
const mockIsPushSupported = vi.fn()
const mockRequestPushPermission = vi.fn()
const mockSubscribeBrowserPush = vi.fn()
const mockUnsubscribeBrowserPush = vi.fn()
const mockIsAppleMobileDevice = vi.fn()
const mockIsRunningStandaloneApp = vi.fn()
const mockUpdateUserPreferences = vi.fn()

const mockUserStore = reactive({
  userProfile: {
    id: 'user-1',
  },
  preferences: reactive({
    arePushNotificationsEnabled: false,
    pushNotificationsByType: {},
  }),
  updateUserPreferences: mockUpdateUserPreferences,
})

vi.mock('src/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

vi.mock('./useError', () => ({
  useError: () => ({
    handleError: mockHandleError,
  }),
}))

vi.mock('src/api/notifications', () => ({
  getPushSubscriptionConfig: (...args: unknown[]) => mockGetPushSubscriptionConfig(...args),
  savePushSubscription: (...args: unknown[]) => mockSavePushSubscription(...args),
  revokePushSubscription: (...args: unknown[]) => mockRevokePushSubscription(...args),
}))

vi.mock('src/utils/push', () => ({
  getCurrentBrowserPushSubscription: (...args: unknown[]) =>
    mockGetCurrentBrowserPushSubscription(...args),
  getPushPermissionState: (...args: unknown[]) => mockGetPushPermissionState(...args),
  isPushSupported: (...args: unknown[]) => mockIsPushSupported(...args),
  requestPushPermission: (...args: unknown[]) => mockRequestPushPermission(...args),
  subscribeBrowserPush: (...args: unknown[]) => mockSubscribeBrowserPush(...args),
  unsubscribeBrowserPush: (...args: unknown[]) => mockUnsubscribeBrowserPush(...args),
}))

vi.mock('src/utils/pwa', () => ({
  isAppleMobileDevice: (...args: unknown[]) => mockIsAppleMobileDevice(...args),
  isRunningStandaloneApp: (...args: unknown[]) => mockIsRunningStandaloneApp(...args),
}))

describe('usePushNotifications', () => {
  async function waitForInitialRefresh() {
    await Promise.resolve()
    await Promise.resolve()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserStore.preferences.arePushNotificationsEnabled = false
    mockUserStore.preferences.pushNotificationsByType = {}
    mockUserStore.userProfile = { id: 'user-1' }

    mockUpdateUserPreferences.mockImplementation(({ preferences }) => {
      if (typeof preferences.pushNotificationsEnabled === 'boolean') {
        mockUserStore.preferences.arePushNotificationsEnabled = preferences.pushNotificationsEnabled
      }

      if (preferences.pushNotificationsByType) {
        mockUserStore.preferences.pushNotificationsByType = {
          ...mockUserStore.preferences.pushNotificationsByType,
          ...preferences.pushNotificationsByType,
        }
      }

      return Promise.resolve()
    })

    mockIsAppleMobileDevice.mockReturnValue(false)
    mockIsRunningStandaloneApp.mockReturnValue(true)
    mockIsPushSupported.mockReturnValue(true)
    mockGetPushPermissionState.mockReturnValue('default')
    mockGetPushSubscriptionConfig.mockResolvedValue({
      publicKey: 'public-key',
      configured: true,
    })
    mockGetCurrentBrowserPushSubscription.mockResolvedValue(null)
    mockRequestPushPermission.mockResolvedValue('granted')
    mockSubscribeBrowserPush.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                endpoint: 'https://example.com/subscription',
                keys: {
                  p256dh: 'p256dh',
                  auth: 'auth',
                },
              }),
            0,
          )
        }),
    )
    mockSavePushSubscription.mockResolvedValue(undefined)
    mockUnsubscribeBrowserPush.mockResolvedValue('https://example.com/subscription')
    mockRevokePushSubscription.mockResolvedValue(undefined)
  })

  it('marks iPhone and iPad Safari as requiring the installed app', async () => {
    mockIsAppleMobileDevice.mockReturnValue(true)
    mockIsRunningStandaloneApp.mockReturnValue(false)

    const push = usePushNotifications()
    await waitForInitialRefresh()

    expect(push.availabilityReason.value).toBe('ios_requires_install')
    expect(push.canManagePush.value).toBe(false)
  })

  it('updates the visible toggle state immediately while enabling push', async () => {
    const push = usePushNotifications()
    await waitForInitialRefresh()

    expect(push.globalPushEnabled.value).toBe(false)

    const pending = push.setPushNotificationsEnabled(true)

    expect(push.isGlobalToggleLoading.value).toBe(true)
    expect(push.globalPushEnabled.value).toBe(true)

    await pending

    expect(push.isGlobalToggleLoading.value).toBe(false)
    expect(push.globalPushEnabled.value).toBe(true)
    expect(mockSavePushSubscription).toHaveBeenCalled()
  })

  it('rolls back the visible toggle state when enabling push fails', async () => {
    mockSubscribeBrowserPush.mockRejectedValueOnce(new Error('Subscription failed'))

    const push = usePushNotifications()
    await waitForInitialRefresh()

    await push.setPushNotificationsEnabled(true)

    expect(push.globalPushEnabled.value).toBe(false)
    expect(mockHandleError).toHaveBeenCalledWith(
      'NOTIFICATIONS.PUSH_SETUP_FAILED',
      expect.any(Error),
    )
  })

  it('disables push and revokes the saved subscription', async () => {
    mockUserStore.preferences.arePushNotificationsEnabled = true

    const push = usePushNotifications()
    await waitForInitialRefresh()

    await push.setPushNotificationsEnabled(false)

    expect(push.globalPushEnabled.value).toBe(false)
    expect(mockRevokePushSubscription).toHaveBeenCalledWith('https://example.com/subscription')
  })
})
