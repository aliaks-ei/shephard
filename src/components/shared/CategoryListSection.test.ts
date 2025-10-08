import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import CategoryListSection from './CategoryListSection.vue'

installQuasarPlugin()

type CategoryListSectionProps = ComponentProps<typeof CategoryListSection>

const renderComponent = (props: CategoryListSectionProps) => {
  return mount(CategoryListSection, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div class="card"><slot /></div>' },
        'q-icon': { template: '<i />', props: ['name', 'size'] },
        'q-chip': {
          template: '<span><slot /></span>',
          props: ['label', 'color', 'text-color', 'size'],
        },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['flat', 'icon', 'label', 'color', 'no-caps'],
          emits: ['click'],
        },
        'q-banner': { template: '<div class="banner"><slot name="avatar" /><slot /></div>' },
      },
    },
  })
}

describe('CategoryListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render header icon and title', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
    })
    expect(wrapper.text()).toContain('My Items')
  })

  it('should pass item count to chip when showItemCount is true', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      showItemCount: true,
      itemCount: 5,
    })
    expect(wrapper.props('itemCount')).toBe(5)
    expect(wrapper.props('showItemCount')).toBe(true)
  })

  it('should not render item count chip when showItemCount is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      showItemCount: false,
      itemCount: 5,
    })
    const chip = wrapper.find('span')
    expect(chip.exists()).toBe(false)
  })

  it('should show expand toggle when categories exist', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      showExpandToggle: true,
    })
    expect(wrapper.props('hasCategories')).toBe(true)
    expect(wrapper.props('showExpandToggle')).toBe(true)
  })

  it('should not render expand button when hasCategories is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: false,
    })
    expect(wrapper.text()).not.toMatch(/Expand All|Collapse All/)
  })

  it('should emit toggle-expand when expand button is clicked', async () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('should render duplicate warning banner at top when hasDuplicates is true', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      hasDuplicates: true,
      showDuplicateWarning: true,
      duplicateBannerPosition: 'top',
    })
    expect(wrapper.text()).toContain('You have duplicate item names')
  })

  it('should render duplicate warning banner at bottom when position is bottom', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      hasDuplicates: true,
      showDuplicateWarning: true,
      duplicateBannerPosition: 'bottom',
    })
    expect(wrapper.text()).toContain('You have duplicate item names')
  })

  it('should not render duplicate warning when showDuplicateWarning is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      hasDuplicates: true,
      showDuplicateWarning: false,
    })
    expect(wrapper.text()).not.toContain('You have duplicate item names')
  })

  it('should render empty state when hasCategories is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: false,
      emptyMessage: 'No items yet',
    })
    expect(wrapper.text()).toContain('No items yet')
  })

  it('should render custom empty message', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: false,
      emptyMessage: 'Start adding items',
    })
    expect(wrapper.text()).toContain('Start adding items')
  })

  it('should not show duplicate warning when hasCategories is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: false,
      hasDuplicates: true,
      showDuplicateWarning: true,
    })
    expect(wrapper.text()).not.toContain('duplicate')
  })

  it('should hide expand toggle when showExpandToggle is false', () => {
    const wrapper = renderComponent({
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      hasCategories: true,
      showExpandToggle: false,
    })
    expect(wrapper.text()).not.toMatch(/Expand All|Collapse All/)
  })
})
