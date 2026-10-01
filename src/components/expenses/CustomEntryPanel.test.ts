import { beforeEach, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import CustomEntryPanel from './CustomEntryPanel.vue'
import { createMockCategories } from 'test/fixtures/categories'
import type * as AiApi from 'src/api/ai'
import type { PlanOption } from 'src/types'

installQuasarPlugin()

const { mockSuggestExpenseCategory } = vi.hoisted(() => ({
  mockSuggestExpenseCategory: vi.fn(),
}))

vi.mock('src/api/ai', async (importOriginal) => ({
  ...(await importOriginal<typeof AiApi>()),
  suggestExpenseCategory: mockSuggestExpenseCategory,
}))

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
  nameRules: [(val: string) => !!val || 'Required'],
  amountRules: [(val: number) => !!val || 'Required'],
}

beforeEach(() => {
  vi.clearAllMocks()
})

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

it('should show category loading state while plan categories load', () => {
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      isLoadingCategories: true,
    },
  })

  const categorySelect = wrapper
    .findAllComponents({ name: 'QSelect' })
    .find((select) => select.props('optionLabel') === 'label')

  expect(categorySelect?.props('disable')).toBe(true)
  expect(categorySelect?.props('loading')).toBe(true)
  expect(wrapper.text()).toContain('Loading categories...')
})

it('should explain when the selected plan has no categories', () => {
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
    },
  })

  const categorySelect = wrapper
    .findAllComponents({ name: 'QSelect' })
    .find((select) => select.props('optionLabel') === 'label')

  expect(categorySelect).toBeDefined()
  expect(wrapper.text()).toContain('No categories are available in this plan')
})

it('waits for categories to load before applying a detected category', async () => {
  vi.useFakeTimers()
  mockSuggestExpenseCategory.mockResolvedValue({
    status: 'selected',
    suggestion: {
      categoryId: 'cat-1',
      categoryName: 'Food',
      confidence: 0.95,
      reasoning: 'Matched a planned item.',
      source: 'plan_item',
    },
  })
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      isLoadingCategories: true,
    },
  })

  const nameInput = wrapper.findAllComponents({ name: 'QInput' })[1]
  await nameInput?.vm.$emit('update:modelValue', 'Groceries')
  expect(mockSuggestExpenseCategory).not.toHaveBeenCalled()

  await wrapper.setProps({ isLoadingCategories: false, categoryOptions: mockCategoryOptions })
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()

  expect(mockSuggestExpenseCategory).toHaveBeenCalledWith('Groceries', 'plan-1')
  expect(wrapper.emitted('update:categoryId')).toContainEqual(['cat-1'])
  vi.useRealTimers()
})

it('ignores a detected category that is not in the plan, without any message', async () => {
  vi.useFakeTimers()
  mockSuggestExpenseCategory.mockResolvedValue({
    status: 'selected',
    suggestion: {
      categoryId: 'missing-category',
      categoryName: 'Missing',
      confidence: 0.95,
      reasoning: 'Matched by category detection.',
      source: 'model',
    },
  })
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      categoryOptions: mockCategoryOptions,
    },
  })

  const nameInput = wrapper.findAllComponents({ name: 'QInput' })[1]
  await nameInput?.vm.$emit('update:modelValue', 'Unexpected merchant')
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()

  expect(mockSuggestExpenseCategory).toHaveBeenCalled()
  expect(wrapper.emitted('update:categoryId')).toBeUndefined()
  expect(wrapper.text()).not.toContain("Couldn't apply")
  vi.useRealTimers()
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
  await planSelector.vm.$emit('update:modelValue', 'plan-1')

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
  const nameInput = inputs[1]
  expect(nameInput).toBeDefined()
  await nameInput?.vm.$emit('update:modelValue', 'Coffee')

  expect(wrapper.emitted('update:name')).toBeTruthy()
})

it('should emit update:amount when amount is changed', async () => {
  const wrapper = mount(CustomEntryPanel, {
    props: defaultProps,
  })

  const inputs = wrapper.findAllComponents({ name: 'QInput' })
  const amountInput = inputs[0]
  expect(amountInput).toBeDefined()
  await amountInput?.vm.$emit('update:modelValue', '15.50')

  expect(wrapper.emitted('update:amount')).toBeTruthy()
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

  expect(wrapper.text()).toContain('left in Food after this')
})

it('should hide budget impact card while saving', () => {
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      categoryId: 'cat-1',
      categoryOptions: mockCategoryOptions,
      amount: 25,
      loading: true,
    },
  })

  expect(wrapper.text()).not.toContain('Budget Impact')
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

it('should display CategoryIcon for the selected category', () => {
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

it('shows the category field loading while a category is being detected', async () => {
  vi.useFakeTimers()
  let resolveSuggestion: (value: unknown) => void = () => undefined
  mockSuggestExpenseCategory.mockReturnValue(
    new Promise((resolve) => {
      resolveSuggestion = resolve
    }),
  )
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      categoryOptions: mockCategoryOptions,
    },
  })
  const categorySelect = () =>
    wrapper.findAllComponents({ name: 'QSelect' }).find((s) => s.props('optionLabel') === 'label')

  const nameInput = wrapper.findAllComponents({ name: 'QInput' })[1]
  await nameInput?.vm.$emit('update:modelValue', 'Groceries')
  await vi.advanceTimersByTimeAsync(300)

  expect(categorySelect()?.props('loading')).toBe(true)

  resolveSuggestion({ status: 'no_match' })
  await flushPromises()

  expect(categorySelect()?.props('loading')).toBe(false)
  vi.useRealTimers()
})

it('shows no AI indicator after a category is detected', async () => {
  vi.useFakeTimers()
  mockSuggestExpenseCategory.mockResolvedValue({
    status: 'selected',
    suggestion: {
      categoryId: 'cat-1',
      categoryName: 'Food',
      confidence: 0.95,
      reasoning: 'Matched a planned item.',
      source: 'plan_item',
    },
  })
  const wrapper = mount(CustomEntryPanel, {
    props: {
      ...defaultProps,
      planId: 'plan-1',
      selectedPlan: mockPlan,
      categoryOptions: mockCategoryOptions,
    },
  })

  const nameInput = wrapper.findAllComponents({ name: 'QInput' })[1]
  await nameInput?.vm.$emit('update:modelValue', 'Groceries')
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()

  expect(wrapper.emitted('update:categoryId')).toContainEqual(['cat-1'])
  expect(wrapper.text()).not.toContain('automatically')
  expect(wrapper.text()).not.toContain('AI')
  vi.useRealTimers()
})
