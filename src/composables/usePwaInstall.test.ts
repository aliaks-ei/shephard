import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { usePwaInstall } from './usePwaInstall'

const TestComponent = {
  template: '<div></div>',
  setup() {
    return usePwaInstall()
  },
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
    it('returns true when running in standalone mode', () => {
      mockMediaQueryList.matches = true

      const wrapper = mount(TestComponent)
      const { isInstalled } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      expect(isInstalled.value).toBe(true)
    })

    it('returns true for iOS standalone mode', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true,
      })

      const wrapper = mount(TestComponent)
      const { isInstalled } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      expect(isInstalled.value).toBe(true)
    })

    it('returns false when not installed', () => {
      const wrapper = mount(TestComponent)
      const { isInstalled } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      expect(isInstalled.value).toBe(false)
    })
  })

  describe('beforeinstallprompt event', () => {
    it('stores deferred prompt when event is triggered', async () => {
      const wrapper = mount(TestComponent)
      const { isInstallable } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(isInstallable.value).toBe(true)
    })

    it('does not store prompt when already installed', async () => {
      mockMediaQueryList.matches = true

      const wrapper = mount(TestComponent)
      const { isInstallable } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(isInstallable.value).toBe(false)
    })

    it('does not store prompt when recently dismissed', async () => {
      localStorage.setItem('pwa-install-dismissed', String(Date.now()))

      const wrapper = mount(TestComponent)
      const { isInstallable } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(isInstallable.value).toBe(false)
    })

    it('stores prompt when dismissal has expired', async () => {
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000
      localStorage.setItem('pwa-install-dismissed', String(thirtyOneDaysAgo))

      const wrapper = mount(TestComponent)
      const { isInstallable } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(isInstallable.value).toBe(true)
    })
  })

  describe('promptInstall', () => {
    it('returns accepted when user accepts install', async () => {
      const wrapper = mount(TestComponent)
      const { promptInstall, isInstallable } = wrapper.vm as unknown as ReturnType<
        typeof usePwaInstall
      >

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await promptInstall()

      expect(mockEvent.prompt).toHaveBeenCalled()
      expect(result).toBe('accepted')
      expect(isInstallable.value).toBe(false)
    })

    it('returns dismissed when user dismisses install', async () => {
      const wrapper = mount(TestComponent)
      const { promptInstall } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await promptInstall()

      expect(result).toBe('dismissed')
    })

    it('returns error when no deferred prompt exists', async () => {
      const wrapper = mount(TestComponent)
      const { promptInstall } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const result = await promptInstall()

      expect(result).toBe('error')
    })

    it('returns error when prompt throws', async () => {
      const wrapper = mount(TestComponent)
      const { promptInstall } = wrapper.vm as unknown as ReturnType<typeof usePwaInstall>

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockRejectedValue(new Error('Failed')),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      const result = await promptInstall()

      expect(result).toBe('error')
    })
  })

  describe('dismissInstall', () => {
    it('sets dismissed timestamp and clears installable state', async () => {
      const wrapper = mount(TestComponent)
      const { dismissInstall, isInstallable } = wrapper.vm as unknown as ReturnType<
        typeof usePwaInstall
      >

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(isInstallable.value).toBe(true)

      dismissInstall()

      expect(isInstallable.value).toBe(false)
      expect(localStorage.getItem('pwa-install-dismissed')).toBeTruthy()
    })
  })

  describe('appinstalled event', () => {
    it('updates state when app is installed', async () => {
      const wrapper = mount(TestComponent)
      const { isInstalled, isInstallable } = wrapper.vm as unknown as ReturnType<
        typeof usePwaInstall
      >

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      }

      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await nextTick()

      expect(isInstallable.value).toBe(true)

      window.dispatchEvent(new Event('appinstalled'))
      await nextTick()

      expect(isInstalled.value).toBe(true)
      expect(isInstallable.value).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const wrapper = mount(TestComponent)

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
