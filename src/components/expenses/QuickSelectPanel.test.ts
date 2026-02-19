import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import QuickSelectPanel from './QuickSelectPanel.vue'
import { createMockPlanItem } from 'test/fixtures/plans'
import { createMockCategories } from 'test/fixtures/categories'
import type { PlanOption } from './PlanSelectorField.vue'

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

describe('QuickSelectPanel', () => {
  const mockPlanOptions: PlanOption[] = [
    {
      label: 'Weekly Grocery',
      value: 'plan-1',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      currency: 'USD',
    },
  ]

  const mockPlan = {
    id: 'plan-1',
    name: 'Weekly Grocery',
    currency: 'USD',
  }

  const mockPlanItems = [
    createMockPlanItem({ id: 'item-1', name: 'Milk', category_id: 'cat-1', amount: 5.99 }),
    createMockPlanItem({ id: 'item-2', name: 'Bread', category_id: 'cat-1', amount: 3.5 }),
  ]

  const defaultProps = {
    phase: 'selection' as const,
    planId: null,
    selectedPlan: null,
    planOptions: mockPlanOptions,
    planDisplayValue: '',
    planItems: [],
    selectedPlanItems: [],
    selectedItemsTotal: 0,
    expenseDate: '2024-01-15',
  }

  it('should mount component properly', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display PlanSelectorField in selection phase', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'selection',
      },
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.exists()).toBe(true)
  })

  it('should display PlanItemSelector when plan is selected', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        planItems: mockPlanItems,
      },
    })

    const itemSelector = wrapper.findComponent({ name: 'PlanItemSelector' })
    expect(itemSelector.exists()).toBe(true)
  })

  it('should not display PlanItemSelector when no plan is selected', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: defaultProps,
    })

    const itemSelector = wrapper.findComponent({ name: 'PlanItemSelector' })
    expect(itemSelector.exists()).toBe(false)
  })

  it('should emit update:planId when plan is selected', async () => {
    const wrapper = mount(QuickSelectPanel, {
      props: defaultProps,
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    await planSelector.vm.$emit('update:model-value', 'plan-1')

    expect(wrapper.emitted('update:planId')).toBeTruthy()
  })

  it('should emit plan-selected when plan is selected', async () => {
    const wrapper = mount(QuickSelectPanel, {
      props: defaultProps,
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    await planSelector.vm.$emit('plan-selected', 'plan-1')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
  })

  it('should display finalize phase content', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'finalize',
        planId: 'plan-1',
        selectedPlan: mockPlan,
        selectedPlanItems: mockPlanItems,
        selectedItemsTotal: 9.49,
      },
    })

    expect(wrapper.text()).toContain('Review & Finalize')
    expect(wrapper.text()).toContain('Weekly Grocery')
  })

  it('should display selected items in finalize phase', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'finalize',
        planId: 'plan-1',
        selectedPlan: mockPlan,
        selectedPlanItems: mockPlanItems,
        selectedItemsTotal: 9.49,
      },
    })

    expect(wrapper.text()).toContain('Selected Items (2)')
    expect(wrapper.text()).toContain('Milk')
    expect(wrapper.text()).toContain('Bread')
  })

  it('should display total amount in finalize phase', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'finalize',
        planId: 'plan-1',
        selectedPlan: mockPlan,
        selectedPlanItems: mockPlanItems,
        selectedItemsTotal: 9.49,
      },
    })

    expect(wrapper.text()).toContain('$9.49')
  })

  it('should emit remove-item when remove button is clicked', async () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'finalize',
        planId: 'plan-1',
        selectedPlan: mockPlan,
        selectedPlanItems: mockPlanItems,
        selectedItemsTotal: 9.49,
      },
    })

    const removeButtons = wrapper
      .findAllComponents({ name: 'QBtn' })
      .filter((btn) => btn.props('icon') === 'eva-close-outline')

    expect(removeButtons.length).toBeGreaterThan(0)
    await removeButtons[0]?.trigger('click')
    expect(wrapper.emitted('remove-item')).toBeTruthy()
  })

  it('should emit update:expenseDate when date is changed', async () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        phase: 'finalize',
        planId: 'plan-1',
        selectedPlan: mockPlan,
        selectedPlanItems: mockPlanItems,
      },
    })

    const dateInputs = wrapper.findAllComponents({ name: 'QInput' })
    const dateInput = dateInputs.find(
      (input) => input.attributes('for') === 'quick-expense-date-label',
    )

    expect(dateInput).toBeDefined()
    await dateInput?.vm.$emit('update:model-value', '2024-01-20')

    expect(wrapper.emitted('update:expenseDate')).toBeTruthy()
  })

  it('should expose planItemSelectorRef', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        planItems: mockPlanItems,
      },
    })

    expect(wrapper.vm.planItemSelectorRef).toBeDefined()
  })

  it('should pass readonly prop to PlanSelectorField', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        readonly: true,
      },
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.props('readonly')).toBe(true)
  })

  it('should pass loading prop to PlanSelectorField', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        loading: true,
      },
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.props('loading')).toBe(true)
  })

  it('should pass selectedCategoryId to PlanItemSelector', () => {
    const wrapper = mount(QuickSelectPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        planItems: mockPlanItems,
        selectedCategoryId: 'cat-1',
      },
    })

    const itemSelector = wrapper.findComponent({ name: 'PlanItemSelector' })
    expect(itemSelector.props('selectedCategoryId')).toBe('cat-1')
  })
})
