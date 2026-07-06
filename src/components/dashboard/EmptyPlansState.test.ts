import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import EmptyPlansState from './EmptyPlansState.vue'
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'

installQuasarPlugin()

describe('EmptyPlansState', () => {
  const createWrapper = () => {
    return mount(EmptyPlansState, {
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
    expect(wrapper.text()).toContain('No Active Plans')
    expect(wrapper.text()).toContain('Create your first plan to start tracking expenses')
  })

  it('displays the plan illustration', () => {
    const wrapper = createWrapper()
    const illustration = wrapper.findComponent(BrandIllustration)
    expect(illustration.exists()).toBe(true)
    expect(illustration.props('name')).toBe('plan')
    expect(wrapper.find('svg.brand-illustration').exists()).toBe(true)
  })

  it('renders a button to create plan', () => {
    const wrapper = createWrapper()
    const btn = wrapper.findComponent({ name: 'QBtn' })
    expect(btn.exists()).toBe(true)
    expect(btn.props('label')).toBe('Create Plan')
    expect(btn.props('to')).toBe('/plans')
  })
})
