import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import PlanItemSelector from './PlanItemSelector.vue'
import { createMockPlanItem } from 'test/fixtures/plans'
import { createMockCategories } from 'test/fixtures/categories'

installQuasarPlugin()

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: ref(createMockCategories()),
    getCategoryById: vi.fn((id: string) => createMockCategories().find((c) => c.id === id)),
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

describe('PlanItemSelector', () => {
  const defaultProps = {
    planItems: [
      createMockPlanItem({ id: 'item-1', name: 'Milk', category_id: 'cat-1', amount: 5.99 }),
      createMockPlanItem({ id: 'item-2', name: 'Bread', category_id: 'cat-1', amount: 3.5 }),
      createMockPlanItem({ id: 'item-3', name: 'Gas', category_id: 'cat-2', amount: 50 }),
    ],
    currency: 'USD' as const,
    isLoading: false,
  }

  it('should mount component properly', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display loading skeleton when isLoading is true', () => {
    const wrapper = mount(PlanItemSelector, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
    })

    expect(wrapper.find('.q-skeleton').exists()).toBe(true)
  })

  it('should display empty state when no plan items available', () => {
    const wrapper = mount(PlanItemSelector, {
      props: {
        ...defaultProps,
        planItems: [],
      },
    })

    expect(wrapper.text()).toContain('No items available in this plan for expense registration')
  })

  it('should group items by category', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    const expansionItems = wrapper.findAllComponents({ name: 'QExpansionItem' })
    expect(expansionItems.length).toBe(2)
  })

  it('should display category information in headers', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('Transport')
  })

  it('should display item count for each category', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('2 items available')
    expect(wrapper.text()).toContain('1 item available')
  })

  it('should emit item-selected and selection-changed when item is clicked', async () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    const checkboxes = wrapper.findAllComponents({ name: 'QCheckbox' })
    if (checkboxes.length > 0) {
      await checkboxes[0]?.vm.$emit('update:modelValue', true)

      expect(wrapper.emitted('item-selected') || wrapper.emitted('selection-changed')).toBeTruthy()
    }
  })

  it('should format currency correctly', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('$5.99')
    expect(wrapper.text()).toContain('$3.50')
    expect(wrapper.text()).toContain('$50.00')
  })

  it('should expose clearSelection method', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(typeof wrapper.vm.clearSelection).toBe('function')
  })

  it('should expose deselectItem method', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    expect(typeof wrapper.vm.deselectItem).toBe('function')
  })

  it('should sort categories with selectedCategoryId first', () => {
    const wrapper = mount(PlanItemSelector, {
      props: {
        ...defaultProps,
        selectedCategoryId: 'cat-2',
      },
    })

    const expansionItems = wrapper.findAllComponents({ name: 'QExpansionItem' })
    const firstExpansionText = expansionItems[0]?.text()
    expect(firstExpansionText).toContain('Transport')
  })

  it('should display CategoryIcon components', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    const icons = wrapper.findAllComponents({ name: 'CategoryIcon' })
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should have checkboxes for each item', () => {
    const wrapper = mount(PlanItemSelector, {
      props: defaultProps,
    })

    const checkboxes = wrapper.findAllComponents({ name: 'QCheckbox' })
    expect(checkboxes.length).toBe(3)
  })
})
