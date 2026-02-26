import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import ExpenseRegistrationDialog from './ExpenseRegistrationDialog.vue'

installQuasarPlugin()

const initializeMock = vi.fn()
const determineInitialModeMock = vi.fn()

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: ref([]),
    getCategoryById: vi.fn(),
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

vi.mock('src/queries/plans', () => ({
  usePlansQuery: vi.fn(() => ({
    plans: ref([]),
    plansForExpenses: ref([]),
    activePlans: ref([]),
    ownedPlans: ref([]),
    sharedPlans: ref([]),
    isPending: ref(false),
    data: ref(null),
  })),
}))

vi.mock('src/queries/expenses', () => ({
  useExpenseSummaryQuery: vi.fn(() => ({
    expenseSummary: ref([]),
    isPending: ref(false),
    data: ref(null),
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1' },
  })),
}))

vi.mock('src/composables/useExpenseRegistration', () => ({
  useExpenseRegistration: vi.fn(() => ({
    form: {
      value: {
        planId: null,
        categoryId: null,
        name: '',
        amount: null,
        expenseDate: '2024-01-15',
        planItemId: null,
      },
    },
    isLoading: false,
    isLoadingPlanItems: false,
    didAutoSelectPlan: false,
    currentMode: 'quickelect',
    quickSelectPhase: 'selection',
    planItems: [],
    selectedPlanItems: [],
    planOptions: [],
    selectedPlan: null,
    planDisplayValue: '',
    categoryOptions: [],
    selectedItemsTotal: 0,
    nameRules: [],
    amountRules: [],
    getSubmitButtonLabel: 'Continue',
    canSubmit: false,
    showBackButton: false,
    onPlanSelected: vi.fn(),
    onItemsSelected: vi.fn(),
    onSelectionChanged: vi.fn(),
    goBackToSelection: vi.fn(),
    proceedToFinalize: vi.fn(),
    removeSelectedItem: vi.fn(),
    resetForm: vi.fn(),
    handleQuickSelectSubmit: vi.fn(),
    handleCustomEntrySubmit: vi.fn(),
    initialize: initializeMock,
    determineInitialMode: determineInitialModeMock,
  })),
}))

describe('ExpenseRegistrationDialog', () => {
  const defaultProps = {
    modelValue: true,
  }

  it('should initialize on first mount when dialog is initially open', () => {
    mount(ExpenseRegistrationDialog, {
      props: {
        modelValue: true,
        autoSelectRecentPlan: true,
      },
    })

    expect(initializeMock).toHaveBeenCalledWith(true)
    expect(determineInitialModeMock).toHaveBeenCalled()
  })

  it('should mount component properly', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display dialog when modelValue is true', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: {
        modelValue: true,
      },
    })

    const dialog = wrapper.findComponent({ name: 'QDialog' })
    expect(dialog.props('modelValue')).toBe(true)
  })

  it('should not display dialog when modelValue is false', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: {
        modelValue: false,
      },
    })

    const dialog = wrapper.findComponent({ name: 'QDialog' })
    expect(dialog.props('modelValue')).toBe(false)
  })

  it('should emit update:modelValue when dialog is closed', async () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: defaultProps,
    })

    const dialog = wrapper.findComponent({ name: 'QDialog' })
    await dialog.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should pass defaultPlanId to props correctly', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: {
        ...defaultProps,
        defaultPlanId: 'plan-1',
      },
    })

    expect(wrapper.props('defaultPlanId')).toBe('plan-1')
  })

  it('should pass defaultCategoryId to props correctly', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: {
        ...defaultProps,
        defaultCategoryId: 'cat-1',
      },
    })

    expect(wrapper.props('defaultCategoryId')).toBe('cat-1')
  })

  it('should pass autoSelectRecentPlan to props correctly', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: {
        ...defaultProps,
        autoSelectRecentPlan: true,
      },
    })

    expect(wrapper.props('autoSelectRecentPlan')).toBe(true)
  })

  it('should set persistent prop on dialog', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: defaultProps,
    })

    const dialog = wrapper.findComponent({ name: 'QDialog' })
    expect(dialog.props('persistent')).toBe(true)
  })

  it('should set maximized on dialog for small screens', () => {
    const wrapper = mount(ExpenseRegistrationDialog, {
      props: defaultProps,
    })

    const dialog = wrapper.findComponent({ name: 'QDialog' })
    expect(dialog.props('maximized')).toBeDefined()
  })
})
