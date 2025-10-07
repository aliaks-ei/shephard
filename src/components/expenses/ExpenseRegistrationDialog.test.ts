import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import ExpenseRegistrationDialog from './ExpenseRegistrationDialog.vue'
import { useCategoriesStore } from 'src/stores/categories'
import { usePlansStore } from 'src/stores/plans'
import { createMockCategories } from 'test/fixtures/categories'

installQuasarPlugin()

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
    isLoading: { value: false },
    isLoadingPlanItems: { value: false },
    didAutoSelectPlan: { value: false },
    currentMode: { value: 'quick-select' },
    quickSelectPhase: { value: 'selection' },
    planItems: { value: [] },
    selectedPlanItems: { value: [] },
    planOptions: { value: [] },
    selectedPlan: { value: null },
    planDisplayValue: { value: '' },
    categoryOptions: { value: [] },
    selectedItemsTotal: { value: 0 },
    budgetWarning: { value: '' },
    nameRules: { value: [] },
    amountRules: { value: [] },
    getSubmitButtonLabel: { value: 'Continue' },
    canSubmit: { value: false },
    showBackButton: { value: false },
    onPlanSelected: vi.fn(),
    onItemsSelected: vi.fn(),
    onSelectionChanged: vi.fn(),
    goBackToSelection: vi.fn(),
    proceedToFinalize: vi.fn(),
    removeSelectedItem: vi.fn(),
    resetForm: vi.fn(),
    handleQuickSelectSubmit: vi.fn(),
    handleCustomEntrySubmit: vi.fn(),
    initialize: vi.fn(),
    determineInitialMode: vi.fn(),
  })),
}))

describe('ExpenseRegistrationDialog', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const categoriesStore = useCategoriesStore()
    categoriesStore.categories = createMockCategories()

    const plansStore = usePlansStore()
    plansStore.isLoading = false
  })

  const defaultProps = {
    modelValue: true,
  }

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
    await dialog.vm.$emit('update:model-value', false)

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
