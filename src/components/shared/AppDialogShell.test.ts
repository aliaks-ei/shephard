import { nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, expect, it, vi } from 'vitest'

const quasarState = reactive({
  screen: {
    lt: {
      md: false,
    },
  },
})

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar')

  return {
    ...actual,
    useQuasar: () => quasarState,
  }
})

import AppDialogShell from './AppDialogShell.vue'

const renderShell = (
  props: Record<string, unknown> = {},
  options: { mobile?: boolean; withFooterSlot?: boolean; withMobileExtra?: boolean } = {},
) => {
  quasarState.screen.lt.md = options.mobile ?? false

  return mount(AppDialogShell, {
    props: {
      modelValue: true,
      title: 'Dialog Title',
      ...props,
    },
    slots: {
      default: '<div class="body-content">Body</div>',
      ...(options.withFooterSlot === false
        ? {}
        : {
            footer: '<button class="desktop-footer-slot">Desktop action</button>',
          }),
      'header-prefix': '<div class="desktop-prefix">Prefix</div>',
      ...(options.withMobileExtra
        ? {
            'mobile-header-extra': '<button class="mobile-extra">Back</button>',
          }
        : {}),
    },
    global: {
      stubs: {
        'q-dialog': {
          template:
            '<div class="q-dialog-stub" :data-position="position" :data-persistent="String(!!persistent)"><slot /></div>',
          props: [
            'modelValue',
            'persistent',
            'position',
            'transitionShow',
            'transitionHide',
            'fullWidth',
          ],
          emits: ['update:model-value', 'hide'],
        },
        'q-card': {
          template: '<div class="q-card-stub" :style="style"><slot /></div>',
          props: ['style'],
        },
        'q-card-section': { template: '<div class="q-card-section-stub"><slot /></div>' },
        'q-card-actions': {
          template: '<div class="q-card-actions-stub"><slot /></div>',
          props: ['align'],
        },
        'q-separator': { template: '<hr />' },
        'q-space': { template: '<span class="q-space-stub" />' },
        'q-btn': {
          template:
            '<button :class="$attrs.class" :disabled="disable" @click="$emit(\'click\')">{{ label }}<slot /></button>',
          props: ['label', 'disable', 'flat', 'round', 'dense', 'size', 'icon', 'color', 'loading'],
          emits: ['click'],
        },
      },
    },
  })
}

const getTouchPanHandler = (wrapper: ReturnType<typeof renderShell>) => {
  const vm = wrapper.vm as {
    handleSheetPan?: (details: Record<string, unknown>) => void
    $?: {
      setupState?: {
        handleSheetPan?: (details: Record<string, unknown>) => void
      }
    }
  }

  return vm.handleSheetPan ?? vm.$?.setupState?.handleSheetPan
}

const createPanEvent = (
  target: Element,
  overrides: {
    isFirst?: boolean
    isFinal?: boolean
    direction?: 'up' | 'down'
    offsetY?: number
    duration?: number
  } = {},
) => {
  const preventDefault = vi.fn()

  return {
    evt: {
      target,
      cancelable: true,
      preventDefault,
    },
    direction: overrides.direction ?? 'down',
    isFirst: overrides.isFirst ?? false,
    isFinal: overrides.isFinal ?? false,
    duration: overrides.duration ?? 16,
    offset: {
      x: 0,
      y: overrides.offsetY ?? 0,
    },
    delta: {
      x: 0,
      y: overrides.offsetY ?? 0,
    },
    distance: {
      x: 0,
      y: Math.abs(overrides.offsetY ?? 0),
    },
  }
}

beforeEach(() => {
  quasarState.screen.lt.md = false
  vi.useRealTimers()
})

it('renders desktop dialog layout and footer slot', () => {
  const wrapper = renderShell(
    {
      persistentDesktop: true,
    },
    {
      mobile: false,
    },
  )

  expect(wrapper.find('.q-dialog-stub').attributes('data-position')).toBe('standard')
  expect(wrapper.find('.q-dialog-stub').attributes('data-persistent')).toBe('true')
  expect(wrapper.find('.desktop-prefix').exists()).toBe(true)
  expect(wrapper.find('.desktop-footer-slot').exists()).toBe(true)
  expect(wrapper.find('.dialog-shell__mobile-primary').exists()).toBe(false)
  expect(wrapper.find('.dialog-shell__body').classes()).toContain('col')
})

it('uses col-auto for desktop body when not scrollable so content height is preserved', () => {
  const wrapper = renderShell(
    {
      bodyScrollable: false,
    },
    {
      mobile: false,
    },
  )

  expect(wrapper.find('.dialog-shell__body').classes()).toContain('col-auto')
  expect(wrapper.find('.dialog-shell__body').classes()).not.toContain('col')
})

it('renders the mobile bottom sheet variant with swipe zone and primary action', () => {
  const wrapper = renderShell(
    {
      primaryActionLabel: 'Save',
      primaryActionDisable: true,
    },
    {
      mobile: true,
      withMobileExtra: true,
    },
  )

  expect(wrapper.find('.q-dialog-stub').attributes('data-position')).toBe('bottom')
  expect(wrapper.find('.q-dialog-stub').attributes('data-persistent')).toBe('false')
  expect(wrapper.find('.dialog-shell__swipe-zone').exists()).toBe(true)
  expect(wrapper.find('.dialog-shell__mobile-primary').exists()).toBe(true)
  expect(wrapper.find('.dialog-shell__mobile-primary').attributes('disabled')).toBeDefined()
  expect(wrapper.find('.mobile-extra').exists()).toBe(true)
  expect(wrapper.find('.dialog-shell__header--mobile').classes()).toContain(
    'dialog-shell__surface--card',
  )
  expect(wrapper.find('.dialog-shell__body').classes()).toContain('dialog-shell__body--mobile')
  expect(wrapper.find('.dialog-shell__body').classes()).toContain('col')
  expect(wrapper.find('.dialog-shell__footer--mobile').classes()).toContain(
    'dialog-shell__surface--card',
  )
  expect(wrapper.find('.desktop-prefix').exists()).toBe(false)
  expect(wrapper.find('.desktop-footer-slot').exists()).toBe(false)

  const cardStyle = wrapper.find('.q-card-stub').attributes('style')
  expect(cardStyle).toContain('height: 95dvh')
  expect(cardStyle).toContain('max-height: 95dvh')
  expect(cardStyle).toContain('border-radius: var(--radius-xl) var(--radius-xl)')
})

it('applies card surface to mobile body when mobileBodyCardSurface is set', () => {
  const wrapper = renderShell(
    {
      mobileBodyCardSurface: true,
    },
    {
      mobile: true,
    },
  )

  const body = wrapper.find('.dialog-shell__body')
  expect(body.classes()).toContain('dialog-shell__body--mobile')
  expect(body.classes()).toContain('dialog-shell__body--mobile-card-surface')
})

it('emits close and primary events on mobile', async () => {
  const wrapper = renderShell(
    {
      primaryActionLabel: 'Save',
    },
    {
      mobile: true,
      withFooterSlot: false,
    },
  )

  const buttons = wrapper.findAll('button')
  await buttons[0]?.trigger('click')
  await wrapper.find('.dialog-shell__mobile-primary').trigger('click')

  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  expect(wrapper.emitted('primary')).toHaveLength(1)
})

it('can render a footer without the footer separator', () => {
  const wrapper = renderShell(
    {
      footerSeparator: false,
      primaryActionLabel: 'Save',
    },
    {
      mobile: true,
      withFooterSlot: false,
    },
  )

  expect(wrapper.find('.dialog-shell__footer--mobile').exists()).toBe(true)
  expect(wrapper.findAll('hr')).toHaveLength(1)
})

it('tracks the finger and springs back for short drags', async () => {
  vi.useFakeTimers()

  const wrapper = renderShell(
    {
      primaryActionLabel: 'Save',
    },
    {
      mobile: true,
      withFooterSlot: false,
    },
  )

  const handler = getTouchPanHandler(wrapper)
  const bodyTarget = wrapper.find('.body-content').element

  expect(handler).toBeTypeOf('function')

  handler?.(createPanEvent(bodyTarget, { isFirst: true, offsetY: 28, duration: 16 }))
  await nextTick()

  expect(wrapper.find('.q-card-stub').attributes('style')).toContain('translateY(28px)')

  handler?.(createPanEvent(bodyTarget, { isFinal: true, offsetY: 28, duration: 48 }))
  vi.runAllTimers()
  await nextTick()

  expect(wrapper.find('.q-card-stub').attributes('style')).toContain('translateY(0px)')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})

it('dismisses only after crossing the drag threshold', async () => {
  vi.useFakeTimers()

  const wrapper = renderShell(
    {
      primaryActionLabel: 'Save',
    },
    {
      mobile: true,
      withFooterSlot: false,
    },
  )

  const handler = getTouchPanHandler(wrapper)
  const bodyTarget = wrapper.find('.body-content').element

  handler?.(createPanEvent(bodyTarget, { isFirst: true, offsetY: 24, duration: 16 }))
  handler?.(createPanEvent(bodyTarget, { offsetY: 240, duration: 180 }))
  await nextTick()

  expect(wrapper.find('.q-card-stub').attributes('style')).toContain('translateY(240px)')

  handler?.(createPanEvent(bodyTarget, { isFinal: true, offsetY: 240, duration: 220 }))
  vi.advanceTimersByTime(180)
  await nextTick()

  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
})
