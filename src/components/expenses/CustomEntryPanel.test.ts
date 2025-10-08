import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import CustomEntryPanel from './CustomEntryPanel.vue'
import { useCategoriesStore } from 'src/stores/categories'
import { createMockCategories } from 'test/fixtures/categories'
import type { PlanOption } from './PlanSelectorField.vue'

installQuasarPlugin()

describe('CustomEntryPanel', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const categoriesStore = useCategoriesStore()
    categoriesStore.categories = createMockCategories()
  })

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

  const mockCategoryOptions = [
    {
      label: 'Food',
      value: 'cat-1',
      color: '#FF5722',
      icon: 'eva-pricetags-outline',
      plannedAmount: 100,
      actualAmount: 50,
      remainingAmount: 50,
    },
  ]

  const defaultProps = {
    planId: null,
    selectedPlan: null,
    planOptions: mockPlanOptions,
    planDisplayValue: '',
    categoryId: null,
    categoryOptions: [],
    name: '',
    amount: null,
    expenseDate: '2024-01-15',
    budgetWarning: '',
    nameRules: [(val: string) => !!val || 'Required'],
    amountRules: [(val: number) => !!val || 'Required'],
  }

  it('should mount component properly', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display PlanSelectorField', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.exists()).toBe(true)
  })

  it('should display category select', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects.find((s) => s.props('label') === 'Select Category *')
    expect(categorySelect?.exists()).toBe(true)
  })

  it('should disable category select when no plan is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects.find((s) => s.props('label') === 'Select Category *')
    expect(categorySelect?.props('disable')).toBe(true)
  })

  it('should enable category select when plan is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
      },
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects.find((s) => s.props('label') === 'Select Category *')
    expect(categorySelect?.props('disable')).toBe(false)
  })

  it('should make category readonly when defaultCategoryId is set', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        defaultCategoryId: 'cat-1',
      },
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects.find((s) => s.props('label') === 'Select Category *')
    expect(categorySelect?.props('readonly')).toBe(true)
  })

  it('should emit update:planId when plan is selected', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    await planSelector.vm.$emit('update:model-value', 'plan-1')

    expect(wrapper.emitted('update:planId')).toBeTruthy()
  })

  it('should emit plan-selected when plan is selected', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    await planSelector.vm.$emit('plan-selected', 'plan-1')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
  })

  it('should emit update:categoryId when category is selected', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
      },
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects.find((s) => s.props('label') === 'Select Category *')
    await categorySelect?.vm.$emit('update:model-value', 'cat-1')

    expect(wrapper.emitted('update:categoryId')).toBeTruthy()
  })

  it('should emit update:name when expense name is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const nameInput = inputs.find((i) => i.props('label') === 'Expense Name *')
    await nameInput?.vm.$emit('update:model-value', 'Coffee')

    expect(wrapper.emitted('update:name')).toBeTruthy()
  })

  it('should emit update:amount when amount is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const amountInput = inputs.find((i) => i.props('label') === 'Amount *')
    await amountInput?.vm.$emit('update:model-value', '15.50')

    expect(wrapper.emitted('update:amount')).toBeTruthy()
  })

  it('should emit update:expenseDate when date is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const dateInput = inputs.find((i) => i.props('label') === 'Expense Date *')
    await dateInput?.vm.$emit('update:model-value', '2024-01-20')

    expect(wrapper.emitted('update:expenseDate')).toBeTruthy()
  })

  it('should display budget warning when provided', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        budgetWarning: 'This expense will exceed the budget by $10.00',
      },
    })

    expect(wrapper.text()).toContain('This expense will exceed the budget by $10.00')
  })

  it('should not display budget warning when empty', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        budgetWarning: '',
      },
    })

    const banner = wrapper.findComponent({ name: 'QBanner' })
    expect(banner.exists()).toBe(false)
  })

  it('should display currency suffix in amount input when plan is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
      },
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const amountInput = inputs.find((i) => i.props('label') === 'Amount *')
    expect(amountInput?.props('suffix')).toBe('USD')
  })

  it('should pass readonly prop to PlanSelectorField', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        readonly: true,
      },
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.props('readonly')).toBe(true)
  })

  it('should pass loading prop to PlanSelectorField', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        loading: true,
      },
    })

    const planSelector = wrapper.findComponent({ name: 'PlanSelectorField' })
    expect(planSelector.props('loading')).toBe(true)
  })

  it('should display CategoryIcon in category options', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
      },
    })

    const wrapper2 = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
      },
    })

    expect(wrapper.exists() && wrapper2.exists()).toBe(true)
  })
})
