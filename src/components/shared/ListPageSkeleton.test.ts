import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import ListPageSkeleton from './ListPageSkeleton.vue'

installQuasarPlugin()

const renderComponent = (props: { count?: number } = {}) =>
  mount(ListPageSkeleton, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-skeleton': { template: '<div class="skeleton" />', props: ['type', 'width', 'height'] },
      },
    },
  })

describe('ListPageSkeleton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders default number of skeleton cards', () => {
    const wrapper = renderComponent()
    expect(wrapper.findAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders the specified count of skeleton groups', () => {
    const wrapper = renderComponent({ count: 3 })
    const columns = wrapper.findAll('.col-12')
    expect(columns.length).toBe(3)
  })
})
