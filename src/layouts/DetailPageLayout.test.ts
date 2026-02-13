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
  }

  return mount(DetailPageLayout, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: true,
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

  const container = wrapper.find('.page-content-spacing')
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

it('should render page title in toolbar', () => {
  const wrapper = renderDetailPageLayout({
    pageTitle: 'Custom Title',
  })

  const toolbarTitle = wrapper.find('.q-toolbar__title')
  const titleRow = toolbarTitle.find('.row.items-center')

  expect(toolbarTitle.exists()).toBe(true)
  expect(titleRow.exists()).toBe(true)
  expect(toolbarTitle.text()).toContain('Custom Title')
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

  const skeletons = wrapper.findAll('.q-skeleton')
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
      isLoading: false,
    },
    slots: {
      default: '<div data-testid="main-content">Main content here</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: true,
      },
    },
  })

  const mainContent = wrapper.find('[data-testid="main-content"]')
  const skeletons = wrapper.findAll('.q-skeleton')

  expect(mainContent.exists()).toBe(true)
  expect(mainContent.text()).toBe('Main content here')
  expect(skeletons.length).toBe(0)
})

it('should render content slot by default when isLoading is not provided', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
    },
    slots: {
      default: '<div data-testid="default-content">Default content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: true,
      },
    },
  })

  const defaultContent = wrapper.find('[data-testid="default-content"]')
  const skeletons = wrapper.findAll('.q-skeleton')

  expect(defaultContent.exists()).toBe(true)
  expect(skeletons.length).toBe(0)
})

it('should render dialogs slot', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
    },
    slots: {
      dialogs: '<div data-testid="dialogs-slot">Dialog content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: true,
      },
    },
  })

  const dialogsSlot = wrapper.find('[data-testid="dialogs-slot"]')
  expect(dialogsSlot.exists()).toBe(true)
  expect(dialogsSlot.text()).toBe('Dialog content')
})

it('should render all slots simultaneously', () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      isLoading: false,
    },
    slots: {
      default: '<div data-testid="main-slot">Main content</div>',
      dialogs: '<div data-testid="dialogs-slot">Dialogs content</div>',
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: true,
      },
    },
  })

  expect(wrapper.find('[data-testid="main-slot"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="dialogs-slot"]').exists()).toBe(true)
})

it('should render ActionBar component', () => {
  const wrapper = renderDetailPageLayout()
  const actionBar = wrapper.findComponent({ name: 'ActionBar' })
  expect(actionBar.exists()).toBe(true)
})

it('should pass actions to ActionBar', () => {
  const actions = [
    { key: 'save', label: 'Save', icon: 'eva-save-outline', color: 'primary', handler: vi.fn() },
  ]

  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      actions,
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: {
          template: '<div data-testid="action-bar" :actions="actions" />',
          props: ['actions', 'visible'],
        },
      },
    },
  })

  const actionBar = wrapper.find('[data-testid="action-bar"]')
  expect(actionBar.exists()).toBe(true)
  expect(actionBar.attributes('actions')).toBeDefined()
})

it('should emit action-clicked event when ActionBar emits it', async () => {
  const wrapper = mount(DetailPageLayout, {
    props: {
      pageTitle: 'Test Page',
      actions: [
        {
          key: 'save',
          label: 'Save',
          icon: 'eva-save-outline',
          color: 'primary',
          handler: vi.fn(),
        },
      ],
    },
    global: {
      stubs: {
        PageBanners: true,
        ActionBar: {
          template: "<button @click=\"$emit('action-clicked', 'save')\">Save</button>",
        },
      },
    },
  })

  const buttons = wrapper.findAll('button')
  const saveButton = buttons.find((btn) => btn.text() === 'Save')

  if (saveButton) {
    await saveButton.trigger('click')
    expect(wrapper.emitted('action-clicked')).toHaveLength(1)
    expect(wrapper.emitted('action-clicked')?.[0]).toEqual(['save'])
  }
})

it('should render read-only badge when showReadOnlyBadge is true on desktop', () => {
  const wrapper = renderDetailPageLayout({
    showReadOnlyBadge: true,
  })

  const badge = wrapper.find('.q-badge')
  expect(badge.exists()).toBe(true)
  expect(badge.text()).toContain('view only')
})

it('should not render read-only badge when showReadOnlyBadge is false', () => {
  const wrapper = renderDetailPageLayout({
    showReadOnlyBadge: false,
  })

  const badge = wrapper.find('.q-badge')
  expect(badge.exists()).toBe(false)
})
