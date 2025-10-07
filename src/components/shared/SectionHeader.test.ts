import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import SectionHeader from './SectionHeader.vue'

installQuasarPlugin()

type SectionHeaderProps = ComponentProps<typeof SectionHeader>

const renderComponent = (props: SectionHeaderProps) => {
  return mount(SectionHeader, {
    props,
    global: {
      stubs: {
        'q-icon': { template: '<i />', props: ['name', 'size'] },
      },
    },
  })
}

describe('SectionHeader', () => {
  it('should mount component properly', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render icon and title', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
    })
    expect(wrapper.text()).toContain('Test Section')
  })

  it('should use default heading level h2', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
    })
    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.classes()).toContain('text-h6')
  })

  it('should render custom heading level', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
      headingLevel: 'h3',
    })
    const heading = wrapper.find('h3')
    expect(heading.exists()).toBe(true)
  })

  it('should apply correct heading class for h1', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
      headingLevel: 'h1',
    })
    const heading = wrapper.find('h1')
    expect(heading.classes()).toContain('text-h4')
  })

  it('should apply correct heading class for h4', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
      headingLevel: 'h4',
    })
    const heading = wrapper.find('h4')
    expect(heading.classes()).toContain('text-subtitle1')
  })

  it('should apply custom spacing', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
      spacing: 'q-mb-lg',
    })
    const container = wrapper.find('.row')
    expect(container.classes()).toContain('q-mb-lg')
  })

  it('should use custom icon size', () => {
    const wrapper = renderComponent({
      icon: 'eva-list-outline',
      title: 'Test Section',
      iconSize: '32px',
    })
    expect(wrapper.props('iconSize')).toBe('32px')
  })
})
