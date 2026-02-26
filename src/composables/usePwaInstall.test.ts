import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { usePwaInstall } from './usePwaInstall'

function createTestComponent() {
  return defineComponent({
    template: '<div></div>',
    setup() {
      return usePwaInstall()
    },
  })
}

describe('usePwaInstall', () => {
  let mockMediaQueryList: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => mockMediaQueryList),
    })

    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: undefined,
    })
  })

  describe('checkIfInstalled', () => {
    it('returns true when running in standalone mode', async () => {
      mockMediaQueryList.matches = true

      const wrapper = mount(createTestComponent())
      await nextTick()

      expect(wrapper.vm.isInstalled).toBe(true)
    })

    it('returns true for iOS standalone mode', async () => {
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true,
      })

      const wrapper = mount(createTestComponent())
      await nextTick()

      expect(wrapper.vm.isInstalled).toBe(true)
    })

    it('returns false when not installed', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      expect(wrapper.vm.isInstalled).toBe(false)
    })
  })

  describe('beforeinstallprompt event', () => {
    it('stores deferred prompt when event is triggered', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(wrapper.vm.isInstallable).toBe(true)
    })

    it('does not store prompt when already installed', async () => {
      mockMediaQueryList.matches = true

      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('does not store prompt when recently dismissed', async () => {
      localStorage.setItem('pwa-install-dismissed', String(Date.now()))

      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('stores prompt when dismissal has expired', async () => {
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000
      localStorage.setItem('pwa-install-dismissed', String(thirtyOneDaysAgo))

      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(true)
    })
  })

  describe('promptInstall', () => {
    it('returns accepted when user accepts install', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await wrapper.vm.promptInstall()

      expect(mockEvent.prompt).toHaveBeenCalled()
      expect(result).toBe('accepted')
      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('returns dismissed when user dismisses install', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await wrapper.vm.promptInstall()

      expect(result).toBe('dismissed')
    })

    it('returns error when no deferred prompt exists', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const result = await wrapper.vm.promptInstall()

      expect(result).toBe('error')
    })

    it('returns error when prompt throws', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()
      const promptError = new Error('Failed')
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockRejectedValue(promptError),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await wrapper.vm.promptInstall()

      expect(result).toBe('error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error showing install prompt:', promptError)
    })
  })

  describe('dismissInstall', () => {
    it('sets dismissed timestamp and clears installable state', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(true)

      wrapper.vm.dismissInstall()
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(false)
      const storedValue = localStorage.getItem('pwa-install-dismissed')
      expect(storedValue).toBeTruthy()
    })
  })

  describe('appinstalled event', () => {
    it('updates state when app is installed', async () => {
      const wrapper = mount(createTestComponent())
      await nextTick()

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(wrapper.vm.isInstallable).toBe(true)

      window.dispatchEvent(new Event('appinstalled'))
      await nextTick()

      expect(wrapper.vm.isInstalled).toBe(true)
      expect(wrapper.vm.isInstallable).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const wrapper = mount(createTestComponent())

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function),
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })
  })
})
