import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import DashboardHeader from './DashboardHeader.vue'

installQuasarPlugin()

describe('DashboardHeader', () => {
  const createWrapper = () => {
    return mount(DashboardHeader)
  }

  it('renders the component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the dashboard title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Dashboard')
  })

  it('displays the subtitle', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Your expense tracking overview')
  })

  it('applies responsive classes to title', () => {
    const wrapper = createWrapper()
    const title = wrapper.find('h1')
    expect(title.classes()).toContain('text-weight-medium')
    expect(title.classes()).toContain('q-my-none')
  })

  it('applies responsive classes to subtitle', () => {
    const wrapper = createWrapper()
    const subtitle = wrapper.find('p')
    expect(subtitle.classes()).toContain('q-ma-none')
    expect(subtitle.classes()).toContain('text-grey-6')
  })
})
