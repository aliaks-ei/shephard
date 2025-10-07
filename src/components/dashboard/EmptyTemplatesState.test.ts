import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import EmptyTemplatesState from './EmptyTemplatesState.vue'

installQuasarPlugin()

describe('EmptyTemplatesState', () => {
  const createWrapper = () => {
    return mount(EmptyTemplatesState, {
      global: {
        stubs: {
          QCard: false,
          QCardSection: false,
          QIcon: false,
          QBtn: false,
        },
      },
    })
  }

  it('renders the component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the empty state message', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('No Templates Yet')
    expect(wrapper.text()).toContain('Create templates to quickly plan your budgets')
  })

  it('displays the bookmark icon', () => {
    const wrapper = createWrapper()
    const icon = wrapper.findComponent({ name: 'QIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('eva-bookmark-outline')
  })

  it('renders a button to create template', () => {
    const wrapper = createWrapper()
    const btn = wrapper.findComponent({ name: 'QBtn' })
    expect(btn.exists()).toBe(true)
    expect(btn.props('label')).toBe('Create Template')
    expect(btn.props('to')).toBe('/templates')
  })
})
