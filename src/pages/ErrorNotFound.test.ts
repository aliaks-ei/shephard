import { mount } from '@vue/test-utils'
import { it, expect } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import ErrorNotFound from './ErrorNotFound.vue'

installQuasarPlugin()

function createWrapper() {
  return mount(ErrorNotFound, {
    global: {
      stubs: {
        QIcon: true,
        QBtn: true,
      },
    },
  })
}

it('should mount component properly', () => {
  const wrapper = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should display 404 error code', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('404')
})

it('should display page not found title', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('Page Not Found')
})

it('should display helpful message', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain("The page you're looking for doesn't exist or has been moved")
})

it('should render go to home button with correct attributes', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })

  expect(buttons[0]?.attributes('label')).toBe('Go to Home')
  expect(buttons[0]?.attributes('to')).toBe('/')
  expect(buttons[0]?.attributes('icon')).toBe('eva-home-outline')
})

it('should render view plans button with correct attributes', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })

  expect(buttons[1]?.attributes('label')).toBe('View Plans')
  expect(buttons[1]?.attributes('icon')).toBe('eva-clipboard-outline')
})

it('should render open settings button with correct attributes', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })

  expect(buttons[2]?.attributes('label')).toBe('Open Settings')
  expect(buttons[2]?.attributes('icon')).toBe('eva-settings-outline')
})

it('should have fullscreen layout with proper classes', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('.fullscreen.column.flex-center.q-pa-xl').exists()).toBe(true)
})

it('should display error icon', () => {
  const wrapper = createWrapper()
  const icon = wrapper.findComponent({ name: 'QIcon' })
  expect(icon.exists()).toBe(true)
  expect(icon.attributes('name')).toBe('eva-alert-triangle-outline')
})

it('should render all three navigation buttons', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })
  expect(buttons).toHaveLength(3)
})

it('should have proper accessibility labels', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })

  expect(buttons[0]?.attributes('aria-label')).toBe('Go to Home')
  expect(buttons[1]?.attributes('aria-label')).toBe('Go to Plans')
  expect(buttons[2]?.attributes('aria-label')).toBe('Open Settings')
})

it('should have all buttons with consistent styling', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAllComponents({ name: 'QBtn' })

  buttons.forEach((button) => {
    expect(button.attributes('color')).toBe('primary')
    expect(button.attributes('unelevated')).toBeDefined()
  })
})
