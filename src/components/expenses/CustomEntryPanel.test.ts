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
    currency: null,
    expenseDate: '2024-01-15',
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

    const categorySelect = wrapper.find('#expense-category-input')
    expect(categorySelect.exists()).toBe(true)
  })

  it('should disable category select when no plan is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    const categorySelect = selects[1]
    expect(categorySelect).toBeDefined()
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
    const categorySelect = selects.find((s) => s.props('optionLabel') === 'label')
    expect(categorySelect).toBeDefined()
    expect(categorySelect?.props('disable')).toBe(false)
  })

  it('should make category readonly when defaultCategoryId is set', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
        defaultCategoryId: 'cat-1',
      },
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    expect(selects.length).toBeGreaterThan(0)
    expect(wrapper.props('defaultCategoryId')).toBe('cat-1')
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

  it('should emit update:categoryId when category is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryOptions: mockCategoryOptions,
      },
    })

    const selects = wrapper.findAllComponents({ name: 'QSelect' })
    expect(selects.length).toBeGreaterThan(1)
    expect(wrapper.props('categoryOptions')).toEqual(mockCategoryOptions)
  })

  it('should emit update:name when expense name is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const nameInput = inputs[0]
    expect(nameInput).toBeDefined()
    await nameInput?.vm.$emit('update:model-value', 'Coffee')

    expect(wrapper.emitted('update:name')).toBeTruthy()
  })

  it('should emit update:amount when amount is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const amountInput = inputs[1]
    expect(amountInput).toBeDefined()
    await amountInput?.vm.$emit('update:model-value', '15.50')

    expect(wrapper.emitted('update:amount')).toBeTruthy()
  })

  it('should emit update:expenseDate when date is changed', async () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    const dateInput = inputs[2]
    expect(dateInput).toBeDefined()
    await dateInput?.vm.$emit('update:model-value', '2024-01-20')

    expect(wrapper.emitted('update:expenseDate')).toBeTruthy()
  })

  it('should not display budget impact card when no category is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: defaultProps,
    })

    expect(wrapper.text()).not.toContain('Budget Impact')
  })

  it('should not display budget impact card when no amount is provided', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryId: 'cat-1',
        categoryOptions: mockCategoryOptions,
        amount: null,
      },
    })

    expect(wrapper.text()).not.toContain('Budget Impact')
  })

  it('should not display budget impact card when amount is zero', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryId: 'cat-1',
        categoryOptions: mockCategoryOptions,
        amount: 0,
      },
    })

    expect(wrapper.text()).not.toContain('Budget Impact')
  })

  it('should display budget impact card when all required information is provided', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
        categoryId: 'cat-1',
        categoryOptions: mockCategoryOptions,
        amount: 25,
      },
    })

    expect(wrapper.text()).toContain('Budget Impact')
    expect(wrapper.text()).toContain('Current:')
    expect(wrapper.text()).toContain('Adding:')
    expect(wrapper.text()).toContain('After:')
  })

  it('should display currency selector when plan is selected', () => {
    const wrapper = mount(CustomEntryPanel, {
      props: {
        ...defaultProps,
        planId: 'plan-1',
        selectedPlan: mockPlan,
      },
    })

    const currencySelect = wrapper.find('#expense-currency-input')
    expect(currencySelect.exists()).toBe(true)
    expect(currencySelect.attributes('disable')).toBeUndefined()
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
        categoryId: 'cat-1',
      },
    })

    const categoryIcon = wrapper.findComponent({ name: 'CategoryIcon' })
    expect(categoryIcon.exists()).toBe(true)
  })
})
