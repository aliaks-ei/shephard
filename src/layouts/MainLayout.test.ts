import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import MainLayout from './MainLayout.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRouter = { push: mockRouterPush }

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({ fullPath: '/templates' }),
}))

type MainLayoutProps = ComponentProps<typeof MainLayout>

const renderMainLayout = (props: MainLayoutProps = {}) => {
  return mount(MainLayout, {
    props,
    global: {
      stubs: {
        'router-view': true,
        UserDropdownMenu: true,
        NavigationDrawer: {
          template:
            '<div data-testid="navigation-drawer" :items="items" :is-mini-mode="isMiniMode" />',
          props: ['items', 'isMiniMode'],
        },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const wrapper = renderMainLayout()
  expect(wrapper.exists()).toBe(true)
})

it('should render header with toolbar', () => {
  const wrapper = renderMainLayout()

  const header = wrapper.find('header')
  const toolbar = wrapper.find('.q-toolbar')

  expect(header.exists()).toBe(true)
  expect(toolbar.exists()).toBe(true)
})

it('should render Shephard title button with correct attributes', () => {
  const wrapper = renderMainLayout()

  const shepherdButton = wrapper.find('.q-toolbar__title button')
  expect(shepherdButton.exists()).toBe(true)
  expect(shepherdButton.text()).toBe('Shephard')
  expect(shepherdButton.classes()).toContain('q-btn--no-uppercase')
})

it('should render UserDropdownMenu component', () => {
  const wrapper = renderMainLayout()

  const userDropdown = wrapper.findComponent({ name: 'UserDropdownMenu' })
  expect(userDropdown.exists()).toBe(true)
})

it('should have menu button configuration for mobile screens', () => {
  const wrapper = renderMainLayout()

  const toolbar = wrapper.find('.q-toolbar')
  expect(toolbar.exists()).toBe(true)
})

it('should render mobile navigation drawer', () => {
  const wrapper = renderMainLayout()

  const drawer = wrapper.find('.q-drawer')
  expect(drawer.exists()).toBe(true)
  expect(drawer.classes()).toContain('q-drawer--mobile')

  const drawerContent = wrapper.find('.q-drawer__content')
  expect(drawerContent.classes()).toContain('q-py-md')

  const navigationDrawer = wrapper.find('[data-testid="navigation-drawer"]')
  expect(navigationDrawer.exists()).toBe(true)
})

it('should render sticky navigation', () => {
  const wrapper = renderMainLayout()

  const stickyNav = wrapper.find('.q-page-sticky')
  expect(stickyNav.exists()).toBe(true)
  expect(stickyNav.classes()).toContain('navigation-sticky-bg')
})

it('should render router-view in page container', () => {
  const wrapper = renderMainLayout()

  const pageContainer = wrapper.find('.page-container')
  const page = wrapper.find('.q-page')
  const routerView = wrapper.findComponent({ name: 'router-view' })

  expect(pageContainer.exists()).toBe(true)
  expect(page.exists()).toBe(true)
  expect(routerView.exists()).toBe(true)
})

it('should apply correct CSS classes to page', () => {
  const wrapper = renderMainLayout()

  const page = wrapper.find('.q-page')
  expect(page.classes()).toContain('shadow-1')
})

it('should pass navigation items to NavigationDrawer components', () => {
  const wrapper = renderMainLayout()

  const navigationDrawers = wrapper.findAll('[data-testid="navigation-drawer"]')
  expect(navigationDrawers).toHaveLength(2)

  navigationDrawers.forEach((drawer) => {
    expect(drawer.attributes('items')).toBeDefined()
  })
})

it('should pass isMiniMode prop to sticky NavigationDrawer', () => {
  const wrapper = renderMainLayout()

  const stickySection = wrapper.find('.q-page-sticky')
  const stickyNavigationDrawer = stickySection.find('[data-testid="navigation-drawer"]')

  expect(stickyNavigationDrawer.exists()).toBe(true)
  expect(stickyNavigationDrawer.attributes('is-mini-mode')).toBeDefined()
})

it('should have drawer toggle functionality', () => {
  const wrapper = renderMainLayout()

  const drawer = wrapper.find('.q-drawer')
  expect(drawer.exists()).toBe(true)
  expect(drawer.classes()).toContain('q-drawer--mobile')
})
