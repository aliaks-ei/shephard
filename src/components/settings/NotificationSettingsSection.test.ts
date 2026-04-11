import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { computed, reactive, ref, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import NotificationSettingsSection from './NotificationSettingsSection.vue'

const mockState = {
  availabilityReason: ref<
    'checking' | 'ready' | 'unsupported' | 'ios_requires_install' | 'not_configured'
  >('ready'),
  permission: ref<'default' | 'granted' | 'denied'>('default'),
  isSubscribed: ref(false),
  isConfigLoading: ref(false),
  isGlobalToggleLoading: ref(false),
  globalPushEnabled: ref(true),
  canManagePush: ref(true),
  pushPreferences: computed(() => ({
    plan_shared: true,
    template_shared: true,
    shared_plan_updated: true,
    shared_template_updated: true,
    shared_plan_expense_added: false,
    shared_plan_removed: true,
    shared_template_removed: true,
    shared_plan_cancelled: false,
    shared_plan_permission_changed: true,
    shared_template_permission_changed: true,
  })),
  setPushNotificationsEnabled: vi.fn(),
  updateNotificationTypePreference: vi.fn(),
}

vi.mock('src/stores/user', () => ({
  useUserStore: () => reactive({}),
}))

vi.mock('src/composables/usePushNotifications', () => ({
  usePushNotifications: () => mockState,
}))

installQuasarPlugin()

function renderSection() {
  return mount(NotificationSettingsSection)
}

describe('NotificationSettingsSection', () => {
  beforeEach(() => {
    mockState.availabilityReason.value = 'ready'
    mockState.permission.value = 'default'
    mockState.isSubscribed.value = false
    mockState.isConfigLoading.value = false
    mockState.isGlobalToggleLoading.value = false
    mockState.globalPushEnabled.value = true
    mockState.canManagePush.value = true
    vi.clearAllMocks()
  })

  it('renders the compact layout without legacy delivery sections', () => {
    const wrapper = renderSection()

    expect(wrapper.text()).toContain('Notifications')
    expect(wrapper.text()).toContain('Push notifications')
    expect(wrapper.text()).toContain('Customize alerts')
    expect(wrapper.text()).not.toContain('Delivery status')
    expect(wrapper.text()).not.toContain('Browser support')
    expect(wrapper.text()).not.toContain('Permission')
    expect(wrapper.text()).not.toContain('Notify me when someone shares a plan with me.')
  })

  it('shows compact helper copy when push is unsupported', async () => {
    mockState.availabilityReason.value = 'unsupported'
    mockState.canManagePush.value = false

    const wrapper = renderSection()
    const panel = wrapper.get('[data-testid="notification-customize-panel"]')
    const customizeRow = wrapper.get('[data-testid="notification-customize-row"]')

    expect(wrapper.text()).toContain(
      'Push is unavailable on this device. Inbox notifications still work.',
    )
    expect(wrapper.text()).toContain('Per-activity push alerts are unavailable on this device.')
    expect(customizeRow.attributes('data-disabled')).toBe('true')

    await customizeRow.trigger('click')
    await nextTick()

    expect(panel.attributes('data-expanded')).toBe('false')
  })

  it('shows denied helper copy inline instead of a banner', () => {
    mockState.permission.value = 'denied'

    const wrapper = renderSection()

    expect(wrapper.text()).toContain(
      'Push is blocked in device settings. Re-enable it there to resume delivery.',
    )
    expect(wrapper.text()).toContain(
      'Notification permission is blocked. Re-enable it in device settings to adjust alert types.',
    )
    expect(wrapper.text()).not.toContain(
      'Browser permission is blocked. Re-enable notifications in browser settings to resume push delivery.',
    )
  })

  it('keeps per-type controls collapsed by default and reveals them on demand', async () => {
    const wrapper = renderSection()
    const panel = wrapper.get('[data-testid="notification-customize-panel"]')

    expect(panel.attributes('data-expanded')).toBe('false')

    await wrapper.get('[data-testid="notification-customize-row"]').trigger('click')
    await nextTick()

    expect(panel.attributes('data-expanded')).toBe('true')
    expect(panel.text()).toContain('Sharing')
    expect(panel.text()).toContain('Access Changes')
  })

  it('shows setup helper copy while push configuration is loading', () => {
    mockState.isConfigLoading.value = true

    const wrapper = renderSection()

    expect(wrapper.text()).toContain('Checking push availability...')
    expect(wrapper.text()).toContain('Available after push setup is checked.')
  })

  it('requires global push before per-type alerts apply', () => {
    mockState.globalPushEnabled.value = false

    const wrapper = renderSection()

    expect(wrapper.text()).toContain('Enable push first to choose which alerts reach this device.')
  })

  it('shows an install hint on iPhone and iPad when push requires the installed app', () => {
    mockState.availabilityReason.value = 'ios_requires_install'
    mockState.globalPushEnabled.value = false
    mockState.canManagePush.value = false

    const wrapper = renderSection()

    expect(wrapper.text()).toContain(
      'On iPhone and iPad, install Shephard to your Home Screen to enable push alerts.',
    )
    expect(wrapper.text()).toContain(
      'Install the app on your Home Screen first, then choose which alerts reach this device.',
    )
  })

  it('shows optimistic helper copy while turning push on', () => {
    mockState.globalPushEnabled.value = true
    mockState.isGlobalToggleLoading.value = true

    const wrapper = renderSection()

    expect(wrapper.text()).toContain('Turning on push for this device...')
  })

  it('forwards toggle changes to the push notifications composable', async () => {
    const wrapper = renderSection()
    const toggles = wrapper.findAllComponents({ name: 'QToggle' })

    await toggles[0]?.vm.$emit('update:modelValue', false)
    await toggles[1]?.vm.$emit('update:modelValue', false)

    expect(mockState.setPushNotificationsEnabled).toHaveBeenCalledWith(false)
    expect(mockState.updateNotificationTypePreference).toHaveBeenCalledWith('plan_shared', false)
  })
})
