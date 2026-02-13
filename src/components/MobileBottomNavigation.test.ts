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

function createWrapper() {
  return mount(MobileBottomNavigation, {
    global: {
      stubs: {
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
  expect(buttons.some((btn) => btn.text().includes('Templates'))).toBe(true)
  expect(buttons.some((btn) => btn.text().includes('Settings'))).toBe(true)
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

it('does not highlight home button when on subroute', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const homeButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Home'))
  expect(homeButton?.attributes('data-color')).toBe('grey-7')
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
  const settingsButton = buttons.find((btn) => btn.text().includes('Settings'))

  expect(homeButton?.attributes('data-to')).toBe('/')
  expect(plansButton?.attributes('data-to')).toBe('/plans')
  expect(templatesButton?.attributes('data-to')).toBe('/templates')
  expect(settingsButton?.attributes('data-to')).toBe('/settings')
})

it('highlights settings button when on settings route', () => {
  mockRoute.fullPath = '/settings'
  const wrapper = createWrapper()

  const settingsButton = wrapper.findAll('.q-btn').find((btn) => btn.text().includes('Settings'))
  expect(settingsButton?.attributes('data-color')).toBe('primary')
})
