import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { useUserStore } from 'src/stores/user'
import * as validationRules from 'src/utils/validation-rules'
import EmailOtpForm from './EmailOtpForm.vue'

vi.mock('src/utils/validation-rules', () => ({
  emailRules: vi.fn(() => [(val: string) => !!val || 'Email is required']),
}))

installQuasarPlugin()

function mountComponent() {
  const wrapper = mount(EmailOtpForm, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
    },
  })
  const userStore = useUserStore()

  return { wrapper, userStore }
}

describe('EmailOtpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls resetEmailState on mount', () => {
    const { userStore } = mountComponent()
    expect(userStore.auth.resetEmailState).toHaveBeenCalled()
  })

  it('renders form, email input, and submit button', () => {
    const { wrapper } = mountComponent()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('uses email validation rules from utils', () => {
    mountComponent()
    expect(validationRules.emailRules).toHaveBeenCalled()
  })

  it('displays "Sign in with Email" as default button label', () => {
    const { wrapper } = mountComponent()
    const btn = wrapper.findComponent({ name: 'QBtn' })
    expect(btn.props('label')).toBe('Sign in with Email')
  })

  it('displays "Resend Email" when email is sent', async () => {
    const { wrapper, userStore } = mountComponent()
    userStore.auth.isEmailSent = true
    await wrapper.vm.$nextTick()
    const btn = wrapper.findComponent({ name: 'QBtn' })
    expect(btn.props('label')).toBe('Resend Email')
  })

  it('disables email input when email is sent', async () => {
    const { wrapper, userStore } = mountComponent()
    userStore.auth.isEmailSent = true
    await wrapper.vm.$nextTick()
    const input = wrapper.findComponent({ name: 'QInput' })
    expect(input.props('disable')).toBe(true)
  })

  it('shows error message when emailError is present', async () => {
    const { wrapper, userStore } = mountComponent()
    userStore.auth.emailError = 'Invalid email'
    await wrapper.vm.$nextTick()
    const error = wrapper.find('p.text-negative')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe('Invalid email')
  })

  it('shows success message when email is sent', async () => {
    const { wrapper, userStore } = mountComponent()
    userStore.auth.isEmailSent = true
    await wrapper.vm.$nextTick()
    const success = wrapper.find('p.text-positive')
    expect(success.exists()).toBe(true)
  })

  it('does not call signInWithOtp when email is empty', async () => {
    const { wrapper, userStore } = mountComponent()
    await wrapper.find('form').trigger('submit')
    expect(userStore.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it.only('calls signInWithOtp with email on submit', async () => {
    const { wrapper, userStore } = mountComponent()

    const qInputWrapper = wrapper.findComponent({ name: 'QInput' })
    qInputWrapper.vm.$emit('update:modelValue', 'test@example.com')

    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(userStore.auth.signInWithOtp).toHaveBeenCalledWith('test@example.com')
  })
})
