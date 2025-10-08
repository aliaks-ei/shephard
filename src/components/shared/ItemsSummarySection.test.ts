import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ItemsSummarySection from './ItemsSummarySection.vue'

installQuasarPlugin()

type ItemsSummarySectionProps = ComponentProps<typeof ItemsSummarySection>

const renderComponent = (props: ItemsSummarySectionProps) => {
  return mount(ItemsSummarySection, {
    props,
    global: {
      stubs: {
        'q-icon': { template: '<i />', props: ['name', 'size', 'class'] },
        'q-separator': { template: '<hr />' },
      },
    },
  })
}

describe('ItemsSummarySection', () => {
  it('should mount component properly', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render formatted amount', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
    })
    expect(wrapper.text()).toContain('$100.00')
  })

  it('should render summary label', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
      summaryLabel: 'Grand Total',
    })
    expect(wrapper.text()).toContain('Grand Total')
  })

  it('should use default summary label', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
    })
    expect(wrapper.text()).toContain('Total Amount')
  })

  it('should render description with categories', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
      itemType: 'categories',
    })
    expect(wrapper.text()).toContain('Total across 5 categories')
  })

  it('should render description with single category', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 1,
      itemType: 'category',
    })
    expect(wrapper.text()).toContain('Total across 1 category')
  })

  it('should render description with items', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 3,
      itemType: 'items',
    })
    expect(wrapper.text()).toContain('Total across 3 items')
  })

  it('should render description with single item', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 1,
      itemType: 'item',
    })
    expect(wrapper.text()).toContain('Total across 1 item')
  })

  it('should not render when itemCount is 0', () => {
    const wrapper = renderComponent({
      formattedAmount: '$0.00',
      itemCount: 0,
    })
    expect(wrapper.text()).toBe('')
  })

  it('should render h2 heading for headingLevel h2', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
      headingLevel: 'h2',
    })
    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
  })

  it('should render h3 heading for headingLevel h3', () => {
    const wrapper = renderComponent({
      formattedAmount: '$100.00',
      itemCount: 5,
      headingLevel: 'h3',
    })
    const heading = wrapper.find('h3')
    expect(heading.exists()).toBe(true)
  })
})
