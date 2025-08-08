import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { h } from 'vue'

import ItemsGroup from './ItemsGroup.vue'

installQuasarPlugin()

type Item = { id: string; name?: string }

const renderComponent = (props: {
  items: Item[]
  title: string
  icon?: string
  chipColor?: string
}) =>
  mount(ItemsGroup, {
    props,
    slots: {
      'item-card': ({ item }: { item: Item }) =>
        h('div', { class: 'card', 'data-id': item.id }, item.name ?? ''),
    },
    global: {
      stubs: {
        'q-icon': { template: '<i />', props: ['name'] },
        'q-chip': {
          template: '<span class="chip">{{ label }}</span>',
          props: ['label', 'color', 'textColor', 'size'],
        },
      },
    },
  })

describe('ItemsGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders title, icon and chip count', () => {
    const wrapper = renderComponent({ items: [{ id: '1' }, { id: '2' }], title: 'Group' })
    expect(wrapper.text()).toContain('Group')
    expect(wrapper.find('.chip').text()).toContain('2')
  })

  it('renders one card per item and passes slot props', () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]
    const wrapper = renderComponent({ items, title: 'Group' })
    const cards = wrapper.findAll('.card')
    expect(cards.length).toBe(2)
    expect(cards[0]?.attributes('data-id')).toBe('a')
    expect(cards[0]?.text()).toContain('Alpha')
  })

  it('uses defaults for icon and chipColor when not provided', () => {
    const wrapper = renderComponent({ items: [], title: 'Defaults' })
    expect(wrapper.text()).toContain('Defaults')
  })
})
