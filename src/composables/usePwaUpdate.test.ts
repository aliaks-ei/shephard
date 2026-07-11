import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import { usePwaUpdate } from './usePwaUpdate'

const UPDATE_AVAILABLE_EVENT = 'shephard:pwa-update-available'

type PwaUpdateWindow = Window & {
  __shephardPendingServiceWorkerUpdate?: ServiceWorkerRegistration
}

function createRegistration(postMessage = vi.fn()): ServiceWorkerRegistration {
  return {
    waiting: {
      postMessage,
    },
  } as unknown as ServiceWorkerRegistration
}

function createTestComponent() {
  return defineComponent({
    template: '<div />',
    setup() {
      return usePwaUpdate()
    },
  })
}

describe('usePwaUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as PwaUpdateWindow).__shephardPendingServiceWorkerUpdate

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: new EventTarget(),
    })
  })

  it('restores an update announced before the app mounted', async () => {
    const registration = createRegistration()
    const pwaWindow = window as PwaUpdateWindow
    pwaWindow.__shephardPendingServiceWorkerUpdate = registration

    const wrapper = mount(createTestComponent())
    await nextTick()

    expect(wrapper.vm.isUpdateAvailable).toBe(true)
    wrapper.unmount()
  })

  it('activates a waiting worker only after an explicit request', async () => {
    const postMessage = vi.fn()
    const registration = createRegistration(postMessage)
    const wrapper = mount(createTestComponent())

    window.dispatchEvent(
      new CustomEvent(UPDATE_AVAILABLE_EVENT, {
        detail: { registration },
      }),
    )
    await nextTick()

    expect(wrapper.vm.isUpdateAvailable).toBe(true)
    expect(postMessage).not.toHaveBeenCalled()

    expect(wrapper.vm.activateUpdate()).toBe('activating')
    expect(postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' })
    wrapper.unmount()
  })

  it('does not activate while a dialog is open', async () => {
    const postMessage = vi.fn()
    const wrapper = mount(createTestComponent())
    const dialog = document.createElement('div')
    dialog.dataset.pwaUpdateBlocker = 'dialog'
    document.body.append(dialog)

    window.dispatchEvent(
      new CustomEvent(UPDATE_AVAILABLE_EVENT, {
        detail: { registration: createRegistration(postMessage) },
      }),
    )
    await nextTick()

    expect(wrapper.vm.hasBlockingWork).toBe(true)
    expect(wrapper.vm.activateUpdate()).toBe('blocked')
    expect(postMessage).not.toHaveBeenCalled()

    dialog.remove()
    wrapper.unmount()
  })

  it('does not activate after the user interacts with an open form', async () => {
    const postMessage = vi.fn()
    const wrapper = mount(createTestComponent())
    const form = document.createElement('form')
    form.dataset.pwaUpdateBlocker = 'form'
    const input = document.createElement('input')
    form.append(input)
    document.body.append(form)
    input.dispatchEvent(new Event('input', { bubbles: true }))

    window.dispatchEvent(
      new CustomEvent(UPDATE_AVAILABLE_EVENT, {
        detail: { registration: createRegistration(postMessage) },
      }),
    )
    await nextTick()

    expect(wrapper.vm.hasBlockingWork).toBe(true)
    expect(wrapper.vm.activateUpdate()).toBe('blocked')
    expect(postMessage).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('keeps reload user-controlled when another tab activates the update', async () => {
    const registration = createRegistration()
    const wrapper = mount(createTestComponent())

    window.dispatchEvent(
      new CustomEvent(UPDATE_AVAILABLE_EVENT, {
        detail: { registration },
      }),
    )
    await nextTick()

    Object.defineProperty(registration, 'waiting', {
      configurable: true,
      value: null,
    })
    navigator.serviceWorker.dispatchEvent(new Event('controllerchange'))
    await nextTick()

    expect(wrapper.vm.isUpdateAvailable).toBe(true)
    expect(wrapper.vm.isApplying).toBe(false)
    wrapper.unmount()
  })
})
