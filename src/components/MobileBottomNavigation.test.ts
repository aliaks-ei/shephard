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

vi.mock('src/composables/useRouteActive', () => ({
  useRouteActive: () => ({
    isActive: (path: string) => {
      if (path === '/') return mockRoute.fullPath === '/'
      return mockRoute.fullPath.startsWith(path)
    },
  }),
}))

function createWrapper(canAddExpense = true) {
  return mount(MobileBottomNavigation, {
    props: {
      canAddExpense,
    },
    global: {
      stubs: {
        QBtn: {
          template:
            '<button class="q-btn" :data-to="to" :data-color="color" :data-icon="icon" :data-round="round" :disabled="disable" @click="!disable && $emit(\'click\')">{{ label }}<slot /></button>',
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
            'disable',
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

it('renders the navigation content', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('.floating-nav').exists()).toBe(true)
})

it('renders all navigation buttons', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAll('.q-btn')

  expect(buttons.length).toBeGreaterThanOrEqual(5)
  expect(buttons.some((btn) => btn.text().includes('Home'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Plans'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Activity'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Templates'))).toBe(true)
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

it('highlights activity button when on expenses route', () => {
  mockRoute.fullPath = '/expenses'
  const wrapper = createWrapper()

  const activityButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Activity'))
  expect(activityButton?.attributes('data-color')).toBe('primary')
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

it('disables add expense when no plan accepts expenses', async () => {
  const wrapper = createWrapper(false)
  const addExpenseButton = wrapper
    .findAll('.q-btn')
    .find((btn) => btn.attributes('data-round') !== undefined && !btn.text())

  expect(addExpenseButton?.attributes('disabled')).toBeDefined()
  await addExpenseButton?.trigger('click')
  expect(wrapper.emitted('open-expense-dialog')).toBeUndefined()
})

it('sets correct to attributes for navigation buttons', () => {
  const wrapper = createWrapper()
  const buttons = wrapper.findAll('.q-btn')

  const homeButton = buttons.find((btn) => btn.text().includes('Home'))
  const plansButton = buttons.find((btn) => btn.text().includes('Plans'))
  const activityButton = buttons.find((btn) => btn.text().includes('Activity'))
  const templatesButton = buttons.find((btn) => btn.text().includes('Templates'))

  expect(homeButton?.attributes('data-to')).toBe('/')
  expect(plansButton?.attributes('data-to')).toBe('/plans')
  expect(activityButton?.attributes('data-to')).toBe('/expenses')
  expect(templatesButton?.attributes('data-to')).toBe('/templates')
})

it('highlights templates button when on templates route', () => {
  mockRoute.fullPath = '/templates'
  const wrapper = createWrapper()

  const templatesButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Templates'))
  expect(templatesButton?.attributes('data-color')).toBe('primary')
})

it('does not show an active highlight for settings', () => {
  mockRoute.fullPath = '/settings'
  const wrapper = createWrapper()

  expect(wrapper.find('.mobile-nav-highlight').exists()).toBe(false)
  expect(wrapper.findAll('.q-btn').some((button) => button.text().includes('Settings'))).toBe(false)
})
