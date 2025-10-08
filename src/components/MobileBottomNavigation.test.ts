import { mount } from '@vue/test-utils'
import { it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import MobileBottomNavigation from './MobileBottomNavigation.vue'

installQuasarPlugin()

const mockRoute = {
  fullPath: '/',
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

function createWrapper(props = {}) {
  return mount(MobileBottomNavigation, {
    props: {
      visible: true,
      ...props,
    },
    global: {
      stubs: {
        QPageSticky: {
          template: '<div class="q-page-sticky"><slot /></div>',
          props: ['position', 'expand', 'offset'],
        },
        QBtn: {
          template:
            '<button class="q-btn" :data-to="to" :data-color="color" :data-icon="icon" :data-round="round" @click="$emit(\'click\')">{{ label }}<slot /></button>',
          props: [
            'icon',
            'label',
            'to',
            'color',
            'size',
            'flat',
            'stack',
            'dense',
            'noCaps',
            'round',
          ],
          emits: ['click'],
        },
      },
    },
  })
}

beforeEach(() => {
  mockRoute.fullPath = '/'
})

it('renders when visible is true', () => {
  const wrapper = createWrapper({ visible: true })
  expect(wrapper.find('.mobile-bottom-nav').exists()).toBe(true)
})

it('does not render when visible is false', () => {
  const wrapper = createWrapper({ visible: false })
  expect(wrapper.find('.mobile-bottom-nav').exists()).toBe(false)
})

it('renders all navigation buttons', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAll('.q-btn')

  expect(buttons.length).toBeGreaterThanOrEqual(5)
  expect(buttons.some((btn) => btn.text().includes('Home'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Plans'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Templates'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Categories'))).toBe(true)
})

it('highlights home button when on home route', () => {
  mockRoute.fullPath = '/'
  const wrapper = createWrapper()

  const homeButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Home'))
  expect(homeButton?.attributes('data-color')).toBe('primary')
})

it('highlights plans button when on plans route', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const plansButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Plans'))
  expect(plansButton?.attributes('data-color')).toBe('primary')
})

it('highlights templates button when on templates route', () => {
  mockRoute.fullPath = '/templates'
  const wrapper = createWrapper()

  const templatesButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Templates'))
  expect(templatesButton?.attributes('data-color')).toBe('primary')
})

it('highlights categories button when on categories route', () => {
  mockRoute.fullPath = '/categories'
  const wrapper = createWrapper()

  const categoriesButton = wrapper
    .findAll('.q-btn')
    .find((btn) => btn.text().includes('Categories'))
  expect(categoriesButton?.attributes('data-color')).toBe('primary')
})

it('does not highlight home button when on subroute', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const homeButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Home'))
  expect(homeButton?.attributes('data-color')).toBeUndefined()
})

it('emits open-expense-dialog when add expense button is clicked', async () => {
  const wrapper = createWrapper()

  const addExpenseButton = wrapper
    .findAll('.q-btn')
    .find((btn) => btn.attributes('data-round') !== undefined && !btn.text())

  await addExpenseButton?.trigger('click')

  expect(wrapper.emitted('open-expense-dialog')).toBeTruthy()
  expect(wrapper.emitted('open-expense-dialog')?.length).toBe(1)
})

it('sets correct to attributes for navigation buttons', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAll('.q-btn')

  const homeButton = buttons.find((btn) => btn.text().includes('Home'))
  const plansButton = buttons.find((btn) => btn.text().includes('Plans'))
  const templatesButton = buttons.find((btn) => btn.text().includes('Templates'))
  const categoriesButton = buttons.find((btn) => btn.text().includes('Categories'))

  expect(homeButton?.attributes('data-to')).toBe('/')
  expect(plansButton?.attributes('data-to')).toBe('/plans')
  expect(templatesButton?.attributes('data-to')).toBe('/templates')
  expect(categoriesButton?.attributes('data-to')).toBe('/categories')
})
