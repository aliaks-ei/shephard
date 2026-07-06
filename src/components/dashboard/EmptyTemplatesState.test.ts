import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import EmptyTemplatesState from './EmptyTemplatesState.vue'
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'

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

  it('displays the template illustration', () => {
    const wrapper = createWrapper()
    const illustration = wrapper.findComponent(BrandIllustration)
    expect(illustration.exists()).toBe(true)
    expect(illustration.props('name')).toBe('template')
    expect(wrapper.find('svg.brand-illustration').exists()).toBe(true)
  })

  it('renders a button to create template', () => {
    const wrapper = createWrapper()
    const btn = wrapper.findComponent({ name: 'QBtn' })
    expect(btn.exists()).toBe(true)
    expect(btn.props('label')).toBe('Create Template')
    expect(btn.props('to')).toBe('/templates')
  })
})
