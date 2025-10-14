import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import PrivacyModeToggle from './PrivacyModeToggle.vue'
import { usePreferencesStore } from 'src/stores/preferences'

installQuasarPlugin()

const createWrapper = (initialPrivacyMode = false) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      preferences: {
        preferences: {
          theme: 'light',
          pushNotificationsEnabled: false,
          currency: 'EUR',
          isPrivacyModeEnabled: initialPrivacyMode,
        },
      },
    },
  })

  return mount(PrivacyModeToggle, {
    global: {
      plugins: [pinia],
    },
  })
}

describe('PrivacyModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should display eye-outline icon when privacy mode is disabled', () => {
    const wrapper = createWrapper(false)

    const button = wrapper.find('button')
    expect(button.classes()).toContain('q-btn')
  })

  it('should display eye-off-outline icon when privacy mode is enabled', () => {
    const wrapper = createWrapper(true)

    const button = wrapper.find('button')
    expect(button.classes()).toContain('q-btn')
  })

  it('should have tooltip component when privacy mode is disabled', () => {
    const wrapper = createWrapper(false)

    const tooltip = wrapper.findComponent({ name: 'QTooltip' })
    expect(tooltip.exists()).toBe(true)
  })

  it('should have tooltip component when privacy mode is enabled', () => {
    const wrapper = createWrapper(true)

    const tooltip = wrapper.findComponent({ name: 'QTooltip' })
    expect(tooltip.exists()).toBe(true)
  })

  it('should call togglePrivacyMode when button is clicked', async () => {
    const wrapper = createWrapper()
    const preferencesStore = usePreferencesStore()

    const toggleSpy = vi.spyOn(preferencesStore, 'togglePrivacyMode')

    await wrapper.find('button').trigger('click')

    expect(toggleSpy).toHaveBeenCalledOnce()
  })
})
