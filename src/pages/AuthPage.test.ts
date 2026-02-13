import { mount } from '@vue/test-utils'
import { it, expect, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import AuthPage from './AuthPage.vue'

vi.mock('src/boot/auth', () => ({
  default: vi.fn(),
}))

installQuasarPlugin()

const EmailOtpFormMock = {
  name: 'EmailOtpForm',
  template: '<div class="email-otp-form-mock" data-test="email-otp-form"></div>',
}

const GoogleAuthButtonMock = {
  name: 'GoogleAuthButton',
  template: '<div class="google-auth-button-mock" data-test="google-auth-button"></div>',
}

function createWrapper() {
  return mount(AuthPage, {
    global: {
      stubs: {
        EmailOtpForm: EmailOtpFormMock,
        GoogleAuthButton: GoogleAuthButtonMock,
        AuthLoginCard: {
          name: 'AuthLoginCard',
          template: '<div class="auth-login-card"><slot /></div>',
        },
        QSeparator: {
          template: '<div class="q-separator"></div>',
        },
      },
    },
  })
}

it('should mount component properly', () => {
  const wrapper = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should render AuthLoginCard', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('.auth-login-card').exists()).toBe(true)
})

it('should render EmailOtpForm component', () => {
  const wrapper = createWrapper()
  expect(wrapper.findComponent({ name: 'EmailOtpForm' }).exists()).toBe(true)
})

it('should render GoogleAuthButton component', () => {
  const wrapper = createWrapper()
  expect(wrapper.findComponent({ name: 'GoogleAuthButton' }).exists()).toBe(true)
})

it('should render separator between auth methods', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('.q-separator').exists()).toBe(true)
  expect(wrapper.text()).toContain('or continue with')
})
