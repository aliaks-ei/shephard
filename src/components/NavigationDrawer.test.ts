import { mount } from '@vue/test-utils'
import { it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import NavigationDrawer from './NavigationDrawer.vue'

installQuasarPlugin()

const mockRoute = {
  fullPath: '/',
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

function createWrapper(props = {}) {
  return mount(NavigationDrawer, {
    props: {
      items: [
        { icon: 'eva-home-outline', label: 'Home', to: '/' },
        { icon: 'eva-calendar-outline', label: 'Plans', to: '/plans' },
        { icon: 'eva-file-text-outline', label: 'Templates', to: '/templates' },
      ],
      isMiniMode: false,
      ...props,
    },
    global: {
      stubs: {
        QList: { template: '<div class="q-list"><slot /></div>' },
        QItem: {
          template: '<div class="q-item" :to="to" :class="{ active: active }"><slot /></div>',
          props: ['to', 'active', 'clickable'],
        },
        QItemSection: {
          template: '<div class="q-item-section"><slot /></div>',
          props: ['avatar'],
        },
        QIcon: {
          template: '<div class="q-icon">{{ name }}</div>',
          props: ['name', 'size'],
        },
      },
    },
  })
}

beforeEach(() => {
  mockRoute.fullPath = '/'
})

it('renders all navigation items', () => {
  const wrapper = createWrapper()
  const items = wrapper.findAll('.q-item')

  expect(items.length).toBe(3)
  expect(wrapper.text()).toContain('Home')
  expect(wrapper.text()).toContain('Plans')
  expect(wrapper.text()).toContain('Templates')
})

it('marks home as active when on home route', () => {
  mockRoute.fullPath = '/'
  const wrapper = createWrapper()

  const activeItems = wrapper.findAll('.q-item.active')
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Home')
})

it('marks plans as active when on plans route', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const activeItems = wrapper.findAll('.q-item.active')
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Plans')
})

it('marks plans as active when on plans subroute', () => {
  mockRoute.fullPath = '/plans/123'
  const wrapper = createWrapper()

  const activeItems = wrapper.findAll('.q-item.active')
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Plans')
})

it('does not mark home as active when on subroute', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const items = wrapper.findAll('.q-item')
  const homeItem = items.find((item) => item.text().includes('Home'))
  expect(homeItem?.classes()).not.toContain('active')
})

it('renders icons with correct names', () => {
  const wrapper = createWrapper()
  const icons = wrapper.findAll('.q-icon')

  expect(icons[0]?.text()).toBe('eva-home-outline')
  expect(icons[1]?.text()).toBe('eva-calendar-outline')
  expect(icons[2]?.text()).toBe('eva-file-text-outline')
})

it('sets correct to attributes', () => {
  const wrapper = createWrapper()
  const items = wrapper.findAll('.q-item')

  expect(items[0]?.attributes('to')).toBe('/')
  expect(items[1]?.attributes('to')).toBe('/plans')
  expect(items[2]?.attributes('to')).toBe('/templates')
})

it('renders in standard mode by default', () => {
  const wrapper = createWrapper({ isMiniMode: false })

  const items = wrapper.findAll('.q-item')
  expect(items.length).toBe(3)
  expect(wrapper.text()).toContain('Home')
  expect(wrapper.text()).toContain('Plans')
  expect(wrapper.text()).toContain('Templates')
})

it('renders in mini mode when isMiniMode is true', () => {
  const wrapper = createWrapper({ isMiniMode: true })
  const items = wrapper.findAll('.q-item')

  expect(items.length).toBe(3)
  expect(wrapper.text()).toContain('Home')
})
