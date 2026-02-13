import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import DashboardSectionSkeleton from './DashboardSectionSkeleton.vue'

const mockScreen = {
  lt: { md: false, sm: false },
  dark: { isActive: false },
}

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

describe('DashboardSectionSkeleton', () => {
  beforeEach(() => {
    mockScreen.lt.md = false
    mockScreen.lt.sm = false
    mockScreen.dark.isActive = false
  })

  const createWrapper = (props = {}) => {
    return mount(DashboardSectionSkeleton, {
      props,
      global: {
        stubs: {
          QCard: false,
          QCardSection: false,
          QSkeleton: false,
        },
      },
    })
  }

  it('renders the component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders default 3 skeleton cards on desktop', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards.length).toBe(3)
  })

  it('renders 1 skeleton card on mobile', () => {
    mockScreen.lt.md = true
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards.length).toBe(1)
  })

  it('renders custom number of skeletons based on maxDisplayed prop', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper({ maxDisplayed: 5 })
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards.length).toBe(5)
  })

  it('renders skeleton elements per card matching BudgetOverviewCard layout', () => {
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    const firstCardSkeletons = cards[0]?.findAllComponents({ name: 'QSkeleton' })
    // title + chip + 3x(caption + value) + progress bar + caption = 10
    expect(firstCardSkeletons?.length).toBe(10)
  })

  it('does not render grid gutter row on mobile list layout', () => {
    mockScreen.lt.md = true
    const wrapper = createWrapper()
    const gridRow = wrapper.find('.row.q-col-gutter-sm')
    expect(gridRow.exists()).toBe(false)
  })

  it('applies medium gutter on desktop', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    const row = wrapper.find('.row')
    expect(row.classes()).toContain('q-col-gutter-md')
  })

  it('applies bordered class when dark mode is active', () => {
    mockScreen.dark.isActive = true
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards[0]?.props('bordered')).toBe(true)
  })

  it('does not apply bordered class when dark mode is inactive', () => {
    mockScreen.dark.isActive = false
    const wrapper = createWrapper()
    const cards = wrapper.findAllComponents({ name: 'QCard' })
    expect(cards[0]?.props('bordered')).toBe(false)
  })
})
