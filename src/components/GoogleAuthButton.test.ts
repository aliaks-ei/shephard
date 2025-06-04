import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import GoogleAuthButton from './GoogleAuthButton.vue'

vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')

const mockGenerateNonce = vi.fn().mockResolvedValue(undefined)
const mockInitGoogleAuth = vi.fn().mockResolvedValue(undefined)
const mockCleanup = vi.fn()
const mockUseGoogleAuth = vi.fn().mockReturnValue({
  hashedNonce: 'mock-hashed-nonce',
  isNonceReady: true,
  initGoogleAuth: mockInitGoogleAuth,
  cleanup: mockCleanup,
  generateNonce: mockGenerateNonce,
})

vi.mock('src/composables/useGoogleAuth', () => ({
  useGoogleAuth: () => mockUseGoogleAuth(),
}))

vi.mock('src/boot/auth', () => ({}))

installQuasarPlugin()

function mountComponent(isNonceReady = true) {
  vi.clearAllMocks()

  mockUseGoogleAuth.mockReturnValue({
    hashedNonce: 'mock-hashed-nonce',
    isNonceReady,
    initGoogleAuth: mockInitGoogleAuth,
    cleanup: mockCleanup,
    generateNonce: mockGenerateNonce,
  })

  const wrapper = mount(GoogleAuthButton, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
        }),
      ],
    },
  })

  return {
    wrapper,
    mockGenerateNonce,
    mockInitGoogleAuth,
    mockCleanup,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should render Google Sign In button when nonce is ready', () => {
  const { wrapper } = mountComponent(true)

  expect(wrapper.find('#g_id_onload').exists()).toBe(true)
  expect(wrapper.find('.g_id_signin').exists()).toBe(true)
  expect(wrapper.find('.q-spinner').exists()).toBe(false)
})

it('should render loading spinner when nonce is not ready', () => {
  const { wrapper } = mountComponent(false)

  expect(wrapper.find('#g_id_onload').exists()).toBe(false)
  expect(wrapper.find('.g_id_signin').exists()).toBe(false)
  expect(wrapper.find('.q-spinner').exists()).toBe(true)
  expect(wrapper.find('p.text-body2').text()).toBe('Preparing secure authentication...')
  expect(wrapper.find('button').exists()).toBe(true)
})

it('should set correct Google client ID from environment variable', () => {
  const { wrapper } = mountComponent()

  const gIdOnload = wrapper.find('#g_id_onload')
  expect(gIdOnload.attributes('data-client_id')).toBe('test-client-id')
})

it('should set correct nonce in data-nonce attribute', () => {
  const { wrapper } = mountComponent()

  const gIdOnload = wrapper.find('#g_id_onload')
  expect(gIdOnload.attributes('data-nonce')).toBe('mock-hashed-nonce')
})

it('should call refreshGoogleAuth on mount', async () => {
  mountComponent()

  await flushPromises()

  expect(mockGenerateNonce).toHaveBeenCalledTimes(1)
  expect(mockInitGoogleAuth).toHaveBeenCalledTimes(1)
})

it('should call cleanup on unmount', () => {
  const { wrapper } = mountComponent()

  mockCleanup.mockClear()

  wrapper.unmount()
  expect(mockCleanup).toHaveBeenCalledTimes(1)
})

it('tests refresh functionality', async () => {
  const { wrapper } = mountComponent(false)
  await wrapper.vm.$nextTick()

  mockGenerateNonce.mockClear()
  mockInitGoogleAuth.mockClear()

  await wrapper.find('button').trigger('click')
  await flushPromises()

  expect(mockGenerateNonce).toHaveBeenCalledTimes(1)
  expect(mockInitGoogleAuth).toHaveBeenCalledTimes(1)
})
