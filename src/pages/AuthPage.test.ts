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
        QCard: {
          template: '<div class="q-card"><slot /></div>',
        },
        QCardSection: {
          template: '<div class="q-card-section" :class="$attrs.class"><slot /></div>',
          inheritAttrs: false,
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

it('should render the title', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('h1').text()).toBe('Welcome to Shephard')
})

it('should render sign in section title', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('h2').text()).toBe('Sign In')
})

it('should render EmailOtpForm component', () => {
  const wrapper = createWrapper()
  expect(wrapper.findComponent({ name: 'EmailOtpForm' }).exists()).toBe(true)
})

it('should render GoogleAuthButton component', () => {
  const wrapper = createWrapper()
  expect(wrapper.findComponent({ name: 'GoogleAuthButton' }).exists()).toBe(true)
})

it('should have proper layout structure', () => {
  const wrapper = createWrapper()

  expect(wrapper.find('.auth-page').exists()).toBe(true)
  expect(wrapper.find('.auth-page').classes()).toContain('flex')
  expect(wrapper.find('.auth-page').classes()).toContain('flex-center')
  expect(wrapper.find('.q-card').exists()).toBe(true)
  expect(wrapper.find('.q-separator').exists()).toBe(true)
})
