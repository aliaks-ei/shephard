import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect } from 'vitest'

import StatusPill from './StatusPill.vue'
import { statusColorToTone, type StatusTone } from './status-tone'

installQuasarPlugin()

const renderStatusPill = (props: {
  label: string
  tone: StatusTone
  icon?: string
  size?: 'sm' | 'md'
}) =>
  mount(StatusPill, {
    props,
    global: {
      stubs: {
        'q-icon': {
          template: '<i class="q-icon" :data-name="name" :data-size="size"></i>',
          props: ['name', 'size'],
        },
      },
    },
  })

describe('StatusPill', () => {
  it('renders the label inside a status-pill span', () => {
    const wrapper = renderStatusPill({ label: '5 days left', tone: 'success' })

    const pill = wrapper.find('span.status-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.text()).toBe('5 days left')
  })

  it.each<StatusTone>(['success', 'warning', 'destructive', 'info', 'muted'])(
    'applies the tone modifier class for %s',
    (tone) => {
      const wrapper = renderStatusPill({ label: 'Status', tone })

      expect(wrapper.find('.status-pill').classes()).toContain(`status-pill--${tone}`)
    },
  )

  it('defaults to the sm size and supports md', () => {
    expect(renderStatusPill({ label: 'A', tone: 'info' }).classes()).toContain('status-pill--sm')
    expect(renderStatusPill({ label: 'A', tone: 'info', size: 'md' }).classes()).toContain(
      'status-pill--md',
    )
  })

  it('does not render an icon when none is provided', () => {
    const wrapper = renderStatusPill({ label: 'Status', tone: 'muted' })

    expect(wrapper.find('.q-icon').exists()).toBe(false)
  })

  it('renders a 14px icon when provided', () => {
    const wrapper = renderStatusPill({
      label: 'Status',
      tone: 'warning',
      icon: 'eva-clock-outline',
    })

    const icon = wrapper.find('.q-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('eva-clock-outline')
    expect(icon.attributes('data-size')).toBe('14px')
  })
})

describe('statusColorToTone', () => {
  it.each([
    ['green', 'success'],
    ['orange', 'warning'],
    ['red', 'destructive'],
    ['grey', 'muted'],
    ['primary', 'info'],
    ['info', 'info'],
    ['unknown-color', 'info'],
  ])('maps %s to %s', (color, tone) => {
    expect(statusColorToTone(color)).toBe(tone)
  })
})
