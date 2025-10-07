import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import DashboardSection from './DashboardSection.vue'
import DashboardSectionSkeleton from './DashboardSectionSkeleton.vue'

const mockScreen = {
  lt: { md: false, sm: false },
  gt: { xs: true },
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

type TestItem = { id: string; name: string }

describe('DashboardSection', () => {
  beforeEach(() => {
    mockScreen.lt.md = false
    mockScreen.lt.sm = false
    mockScreen.gt.xs = true
    mockScreen.dark.isActive = false
  })

  const mockItems: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ]

  const createWrapper = (props = {}) => {
    return mount(DashboardSection, {
      props: {
        title: 'Test Section',
        icon: 'eva-star-outline',
        items: mockItems,
        count: mockItems.length,
        ...props,
      },
      slots: {
        card: '<div class="test-card">{{ item.name }}</div>',
        empty: '<div class="test-empty">No items</div>',
      },
      global: {
        stubs: {
          QChip: false,
          QBtn: false,
          QIcon: false,
          QCarousel: false,
          QCarouselSlide: false,
        },
      },
    })
  }

  describe('basic rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays the section title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Test Section')
    })

    it('displays the icon', () => {
      const wrapper = createWrapper()
      const icon = wrapper.findComponent({ name: 'QIcon' })
      expect(icon.props('name')).toBe('eva-star-outline')
    })

    it('displays the count chip', () => {
      const wrapper = createWrapper()
      const chip = wrapper.findComponent({ name: 'QChip' })
      expect(chip.props('label')).toBe(3)
    })
  })

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      const wrapper = createWrapper({ loading: true })
      const skeleton = wrapper.findComponent(DashboardSectionSkeleton)
      expect(skeleton.exists()).toBe(true)
    })

    it('does not show items when loading', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.find('.test-card').exists()).toBe(false)
    })

    it('allows custom skeleton via slot', () => {
      const wrapper = mount(DashboardSection, {
        props: {
          title: 'Test Section',
          icon: 'eva-star-outline',
          items: mockItems,
          count: mockItems.length,
          loading: true,
        },
        slots: {
          skeleton: '<div class="custom-skeleton">Custom Loading</div>',
        },
      })
      expect(wrapper.find('.custom-skeleton').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Loading')
    })
  })

  describe('desktop grid view', () => {
    it('shows grid on desktop', () => {
      mockScreen.gt.xs = true
      const wrapper = createWrapper()
      const cards = wrapper.findAll('.test-card')
      expect(cards.length).toBe(3)
    })

    it('applies responsive gutter classes', () => {
      mockScreen.gt.xs = true
      const wrapper = createWrapper()
      const rows = wrapper.findAll('.row')
      const gridRow = rows.find((r) => r.classes().some((c) => c.startsWith('q-col-gutter')))
      expect(gridRow).toBeDefined()
    })
  })

  describe('mobile carousel view', () => {
    it('shows carousel on mobile', () => {
      mockScreen.lt.sm = true
      mockScreen.gt.xs = false
      const wrapper = createWrapper()
      const carousel = wrapper.findComponent({ name: 'QCarousel' })
      expect(carousel.exists()).toBe(true)
    })

    it('renders carousel slides', () => {
      mockScreen.lt.sm = true
      mockScreen.gt.xs = false
      const wrapper = createWrapper()
      const slides = wrapper.findAllComponents({ name: 'QCarouselSlide' })
      expect(slides.length).toBeGreaterThan(0)
    })

    it('does not show grid on mobile', () => {
      mockScreen.lt.sm = true
      mockScreen.gt.xs = false
      const wrapper = createWrapper()
      const row = wrapper.find('.row.q-col-gutter-md')
      expect(row.exists()).toBe(false)
    })
  })

  describe('empty state', () => {
    it('shows empty slot when no items', () => {
      const wrapper = createWrapper({ items: [] })
      expect(wrapper.find('.test-empty').exists()).toBe(true)
      expect(wrapper.text()).toContain('No items')
    })

    it('does not show empty state when items exist', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.test-empty').exists()).toBe(false)
    })

    it('does not show empty state when loading', () => {
      const wrapper = createWrapper({ items: [], loading: true })
      expect(wrapper.find('.test-empty').exists()).toBe(false)
    })
  })

  describe('view all button', () => {
    it('shows view all button when viewAllRoute is provided and count exceeds maxDisplayed', () => {
      const wrapper = createWrapper({
        viewAllRoute: '/all-items',
        count: 10,
        maxDisplayed: 3,
      })
      const btn = wrapper.findComponent({ name: 'QBtn' })
      expect(btn.exists()).toBe(true)
      expect(btn.props('to')).toBe('/all-items')
    })

    it('does not show view all button when count does not exceed maxDisplayed', () => {
      const wrapper = createWrapper({
        viewAllRoute: '/all-items',
        count: 3,
        maxDisplayed: 3,
      })
      const btn = wrapper.findComponent({ name: 'QBtn' })
      expect(btn.exists()).toBe(false)
    })

    it('does not show view all button when viewAllRoute is not provided', () => {
      const wrapper = createWrapper({
        count: 10,
        maxDisplayed: 3,
      })
      const btn = wrapper.findComponent({ name: 'QBtn' })
      expect(btn.exists()).toBe(false)
    })
  })

  describe('custom props', () => {
    it('applies custom container class', () => {
      const wrapper = createWrapper({ containerClass: 'custom-container' })
      expect(wrapper.classes()).toContain('custom-container')
    })

    it('uses custom col classes prop', () => {
      mockScreen.gt.xs = true
      const wrapper = createWrapper({ colClasses: 'col-12 col-md-6' })
      const cols = wrapper.findAll('[class*="col-"]')
      expect(cols.length).toBeGreaterThan(0)
    })

    it('respects maxDisplayed prop', () => {
      const wrapper = createWrapper({ maxDisplayed: 5 })
      expect(wrapper.vm.maxDisplayed).toBe(5)
    })
  })
})
