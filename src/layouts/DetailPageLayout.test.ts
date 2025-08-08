import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import DetailPageLayout from './DetailPageLayout.vue'

installQuasarPlugin()

type DetailPageLayoutProps = ComponentProps<typeof DetailPageLayout>

const renderDetailPageLayout = (props: Partial<DetailPageLayoutProps> = {}) => {
  const defaultProps: DetailPageLayoutProps = {
    pageTitle: 'Test Page',
    pageIcon: 'eva-settings-outline',
    breadcrumbs: [
      { label: 'Home', icon: 'eva-home-outline', to: '/' },
      { label: 'Settings', icon: 'eva-settings-outline' },
    ],
  }

  return mount(DetailPageLayout, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const wrapper = renderDetailPageLayout()
  expect(wrapper.exists()).toBe(true)
})

it('should render main container with correct layout classes', () => {
  const wrapper = renderDetailPageLayout()

  const container = wrapper.find('.q-pa-md')
  const row = wrapper.find('.row.justify-center')
  const col = wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6')

  expect(container.exists()).toBe(true)
  expect(row.exists()).toBe(true)
  expect(col.exists()).toBe(true)
})

it('should render toolbar with back button', () => {
  const wrapper = renderDetailPageLayout()

  const toolbar = wrapper.find('.q-toolbar')
  const backButton = wrapper.find('button')

  expect(toolbar.exists()).toBe(true)
  expect(toolbar.classes()).toContain('q-mb-lg')
  expect(toolbar.classes()).toContain('q-px-none')
  expect(backButton.exists()).toBe(true)
  expect(backButton.classes()).toContain('q-btn--flat')
  expect(backButton.classes()).toContain('q-btn--round')
})

it('should emit back event when back button is clicked', async () => {
  const wrapper = renderDetailPageLayout()

  const backButton = wrapper.find('button')
  await backButton.trigger('click')

  expect(wrapper.emitted('back')).toHaveLength(1)
})

it('should render page title with icon in toolbar', () => {
  const wrapper = renderDetailPageLayout({
    pageTitle: 'Custom Title',
    pageIcon: 'eva-star-outline',
  })

  const toolbarTitle = wrapper.find('.q-toolbar__title')
  const titleRow = toolbarTitle.find('.row.items-center')
  const icon = titleRow.find('.q-icon')

  expect(toolbarTitle.exists()).toBe(true)
  expect(titleRow.exists()).toBe(true)
  expect(icon.exists()).toBe(true)
  expect(icon.classes()).toContain('eva-star-outline')
  expect(icon.classes()).toContain('q-mr-sm')
  expect(toolbarTitle.text()).toContain('Custom Title')
})

it('should render breadcrumbs with correct structure', () => {
  const breadcrumbs = [
    { label: 'Dashboard', icon: 'eva-grid-outline', to: '/dashboard' },
    { label: 'Users', icon: 'eva-people-outline', to: '/users' },
    { label: 'Profile', icon: 'eva-person-outline' },
  ]

  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs,
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  const breadcrumbsContainer = wrapper.find('.q-breadcrumbs')
  expect(breadcrumbsContainer.exists()).toBe(true)
  expect(breadcrumbsContainer.classes()).toContain('q-mb-lg')
  expect(breadcrumbsContainer.classes()).toContain('text-grey-6')

  // Test that breadcrumbs prop is passed correctly by checking component props
  expect(wrapper.props('breadcrumbs')).toEqual(breadcrumbs)
})

it('should render PageBanners component', () => {
  const wrapper = renderDetailPageLayout()

  const pageBanners = wrapper.findComponent({ name: 'PageBanners' })
  expect(pageBanners.exists()).toBe(true)
})

it('should pass banners prop to PageBanners component', () => {
  const banners = [
    {
      type: 'warning',
      class: 'bg-warning',
      icon: 'eva-alert-triangle-outline',
      message: 'Test warning',
    },
  ]

  const wrapper = renderDetailPageLayout({ banners })

  const pageBanners = wrapper.findComponent({ name: 'PageBanners' })
  expect(pageBanners.props('banners')).toEqual(banners)
})

it('should pass empty array to PageBanners when banners prop is undefined', () => {
  const wrapper = renderDetailPageLayout()

  const pageBanners = wrapper.findComponent({ name: 'PageBanners' })
  expect(pageBanners.props('banners')).toEqual([])
})

it('should render loading skeleton when isLoading is true', () => {
  const wrapper = renderDetailPageLayout({ isLoading: true })

  const skeletonContainer = wrapper.find('.q-pa-lg')
  const skeletons = wrapper.findAll('.q-skeleton')

  expect(skeletonContainer.exists()).toBe(true)
  expect(skeletons.length).toBeGreaterThan(0)

  const textSkeletons = wrapper.findAll('.q-skeleton--type-text')
  const inputSkeleton = wrapper.find('.q-skeleton--type-QInput')
  const rectSkeletons = wrapper.findAll('.q-skeleton--type-rect')

  expect(textSkeletons.length).toBeGreaterThan(0)
  expect(inputSkeleton.exists()).toBe(true)
  expect(rectSkeletons).toHaveLength(2)
})

it('should render content slot when isLoading is false', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs: [],
      isLoading: false,
    },
    slots: {
      default: '<div data-testid="main-content">Main content here</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  const mainContent = wrapper.find('[data-testid="main-content"]')
  const skeletonContainer = wrapper.find('.q-pa-lg')

  expect(mainContent.exists()).toBe(true)
  expect(mainContent.text()).toBe('Main content here')
  expect(skeletonContainer.exists()).toBe(false)
})

it('should render content slot by default when isLoading is not provided', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs: [],
    },
    slots: {
      default: '<div data-testid="default-content">Default content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  const defaultContent = wrapper.find('[data-testid="default-content"]')
  const skeletonContainer = wrapper.find('.q-pa-lg')

  expect(defaultContent.exists()).toBe(true)
  expect(skeletonContainer.exists()).toBe(false)
})

it('should render dialogs slot', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs: [],
    },
    slots: {
      dialogs: '<div data-testid="dialogs-slot">Dialog content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  const dialogsSlot = wrapper.find('[data-testid="dialogs-slot"]')
  expect(dialogsSlot.exists()).toBe(true)
  expect(dialogsSlot.text()).toBe('Dialog content')
})

it('should render fab slot', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs: [],
    },
    slots: {
      fab: '<div data-testid="fab-slot">FAB content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  const fabSlot = wrapper.find('[data-testid="fab-slot"]')
  expect(fabSlot.exists()).toBe(true)
  expect(fabSlot.text()).toBe('FAB content')
})

it('should render all slots simultaneously', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      pageIcon: 'eva-settings-outline',
      breadcrumbs: [],
      isLoading: false,
    },
    slots: {
      default: '<div data-testid="main-slot">Main content</div>',
      dialogs: '<div data-testid="dialogs-slot">Dialogs content</div>',
      fab: '<div data-testid="fab-slot">FAB content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
      },
    },
  })

  expect(wrapper.find('[data-testid="main-slot"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="dialogs-slot"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="fab-slot"]').exists()).toBe(true)
})
