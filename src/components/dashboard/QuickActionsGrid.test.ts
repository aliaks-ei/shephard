import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import QuickActionsGrid from './QuickActionsGrid.vue'

const mockRouterPush = vi.fn()
const mockRouter = {
  push: mockRouterPush,
}

const mockScreen = {
  lt: { md: false, sm: false },
  dark: { isActive: false },
}

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => mockRouter),
}))

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar')
  return {
    ...actual,
    useQuasar: vi.fn(() => ({
      screen: mockScreen,
      dark: mockScreen.dark,
    })),
  }
})

installQuasarPlugin()

describe('QuickActionsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScreen.lt.md = false
    mockScreen.lt.sm = false
  })

  const createWrapper = () => {
    return mount(QuickActionsGrid, {
      global: {
        stubs: {
          QCard: false,
          QItem: false,
          QItemSection: false,
          QIcon: false,
        },
      },
    })
  }

  it('renders the component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the Quick Actions title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Quick Actions')
  })

  it('renders all four action cards', () => {
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards.length).toBe(4)
  })

  it('displays Add Expense action', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Add Expense')
  })

  it('displays New Plan action', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('New Plan')
  })

  it('displays New Template action', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('New Template')
  })

  it('displays Settings action', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Settings')
  })

  it('emits add-expense event when Add Expense is clicked', async () => {
    const wrapper = createWrapper()
    const items = wrapper.findAllComponents({ name: 'QItem' })
    await items[0]?.trigger('click')
    expect(wrapper.emitted('add-expense')).toBeTruthy()
  })

  it('navigates to /plans/new when New Plan is clicked', () => {
    const wrapper = createWrapper()
    const items = wrapper.findAllComponents({ name: 'QItem' })
    expect(items[1]?.props('to')).toBe('/plans/new')
  })

  it('navigates to /templates/new when New Template is clicked', () => {
    const wrapper = createWrapper()
    const items = wrapper.findAllComponents({ name: 'QItem' })
    expect(items[2]?.props('to')).toBe('/templates/new')
  })

  it('navigates to /settings when Settings is clicked', () => {
    const wrapper = createWrapper()
    const items = wrapper.findAllComponents({ name: 'QItem' })
    expect(items[3]?.props('to')).toBe('/settings')
  })

  it('renders grid with responsive gutter classes', () => {
    const wrapper = createWrapper()
    const grids = wrapper.findAll('.row')
    const actionGrid = grids.find((g) => g.classes().some((c) => c.startsWith('q-col-gutter')))
    expect(actionGrid).toBeDefined()
  })
})
