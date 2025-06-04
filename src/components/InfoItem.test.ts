import { mount } from '@vue/test-utils'
import { it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import InfoItem from './InfoItem.vue'

installQuasarPlugin()

function mountComponent(props = {}) {
  return mount(InfoItem, {
    props: {
      icon: 'test-icon',
      label: 'Test Label',
      value: 'Test Value',
      ...props,
    },
  })
}

it('renders with required props', () => {
  const wrapper = mountComponent()

  expect(wrapper.find('.q-icon').text()).toBe('test-icon')
  expect(wrapper.find('.text-caption').text()).toBe('Test Label')
  expect(wrapper.find('.q-item__label.text-primary').text()).toBe('Test Value')
})

it('renders with a null value', () => {
  const wrapper = mountComponent({ value: null })

  expect(wrapper.find('.q-item__label.text-primary').text()).toBe('')
})

it('renders with an undefined value', () => {
  const wrapper = mountComponent({ value: undefined })

  expect(wrapper.find('.q-item__label.text-primary').text()).toBe('')
})

it('uses half-width layout by default', () => {
  const wrapper = mountComponent()

  expect(wrapper.find('.col-12').classes()).toContain('col-sm-6')
  expect(wrapper.find('.col-12').classes()).not.toContain('col-sm-12')
})

it('uses full-width layout when fullWidth prop is true', () => {
  const wrapper = mountComponent({ fullWidth: true })

  expect(wrapper.find('.col-12').classes()).toContain('col-sm-12')
  expect(wrapper.find('.col-12').classes()).not.toContain('col-sm-6')
})
