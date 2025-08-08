import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import PageBanners from './PageBanners.vue'

installQuasarPlugin()

type Banner = { type: string; class: string; icon: string; message: string; visible?: boolean }

const renderComponent = (props: { banners: Banner[] }) =>
  mount(PageBanners, {
    props,
    global: {
      stubs: {
        'q-banner': {
          template: '<div class="banner"><slot name="avatar" /><slot /></div>',
          props: ['rounded'],
        },
        'q-icon': { template: '<i />', props: ['name'] },
      },
    },
  })

describe('PageBanners', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when no banners are visible', () => {
    const banners: Banner[] = [
      { type: 'info', class: 'bg', icon: 'i', message: 'Hello', visible: false },
    ]
    const wrapper = renderComponent({ banners })
    expect(wrapper.findAll('.banner').length).toBe(0)
  })

  it('renders only banners with visible !== false', () => {
    const banners: Banner[] = [
      { type: 'a', class: 'c1', icon: 'i1', message: 'A' },
      { type: 'b', class: 'c2', icon: 'i2', message: 'B', visible: false },
      { type: 'c', class: 'c3', icon: 'i3', message: 'C', visible: true },
    ]
    const wrapper = renderComponent({ banners })
    const nodes = wrapper.findAll('.banner')
    expect(nodes.length).toBe(2)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('C')
  })
})
