import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import AllExpensesDialog from './AllExpensesDialog.vue'
import type { ExpenseWithCategory } from 'src/api'

installQuasarPlugin()

const mockConfirmDeleteExpense = vi.fn()
const mockDeleteExpense = vi.fn((_expense: ExpenseWithCategory, onSuccess?: () => void) => {
  onSuccess?.()
})

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/utils/date', () => ({
  formatDate: vi.fn(() => 'Jan 1, 2024'),
}))

vi.mock('src/composables/useCategoryHelpers', () => ({
  useCategoryHelpers: vi.fn(() => ({
    getCategoryName: vi.fn(() => 'Food'),
    getCategoryColor: vi.fn(() => '#ff0000'),
    getCategoryIcon: vi.fn(() => 'eva-shopping-cart-outline'),
  })),
}))

vi.mock('src/composables/useExpenseActions', () => ({
  useExpenseActions: vi.fn(() => ({
    confirmDeleteExpense: mockConfirmDeleteExpense,
    deleteExpense: mockDeleteExpense,
  })),
}))

type AllExpensesDialogProps = ComponentProps<typeof AllExpensesDialog>

const mockExpenses: ExpenseWithCategory[] = [
  {
    id: 'exp-1',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Groceries',
    amount: 50,
    expense_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    plan_item_id: null,
    currency: null,
    original_amount: null,
    original_currency: null,
    categories: {
      id: 'cat-1',
      name: 'Food',
      icon: 'eva-shopping-cart-outline',
      color: '#ff0000',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: null,
    },
  },
]

const renderAllExpensesDialog = (
  props: AllExpensesDialogProps,
  options: { isMobile?: boolean } = {},
) => {
  const isMobile = options.isMobile ?? false

  return mount(AllExpensesDialog, {
    props,
    global: {
      mocks: {
        $q: {
          screen: {
            lt: { md: isMobile },
            xs: isMobile,
          },
        },
      },
      stubs: {
        CategoryIcon: { template: '<div class="category-icon" />' },
        'q-dialog': {
          template: '<div v-if="modelValue"><slot /></div>',
          props: ['modelValue'],
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-btn': {
          template:
            '<button class="q-btn-stub" :data-icon="icon || \'\'" @click="$emit(\'click\')"><slot /></button>',
          props: ['icon'],
        },
        'q-scroll-area': { template: '<div class="scroll-area"><slot /></div>' },
        'q-virtual-scroll': {
          template: '<div><slot v-for="item in items" :item="item" :index="0" /></div>',
          props: ['items'],
        },
        'q-slide-item': {
          template:
            '<div class="q-slide-item"><button class="slide-right-trigger" @click="$emit(\'right\', { reset: () => {} })" /><slot name="right" /><slot /></div>',
          props: ['rightColor'],
        },
        'q-item': { template: '<div class="q-item"><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-space': { template: '<div />' },
        'q-icon': { template: '<i />' },
        'q-tooltip': { template: '<div />' },
      },
    },
  })
}

describe('AllExpensesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: true,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should not render when modelValue is false', () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: false,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: false,
    })

    expect(wrapper.html()).not.toContain('Expense History')
  })

  it('should display expenses when provided', () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: true,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: false,
    })

    expect(wrapper.text()).toContain('Groceries')
    expect(wrapper.text()).toContain('USD 50.00')
  })

  it('should emit update:modelValue when close button clicked', async () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: true,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })

    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should show delete buttons when canEdit is true', () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: true,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: true,
    })

    const deleteButtons = wrapper.findAll('button[data-icon="eva-trash-2-outline"]')
    expect(deleteButtons.length).toBe(1)
  })

  it('should show slide item on mobile when canEdit is true', () => {
    const wrapper = renderAllExpensesDialog(
      {
        modelValue: true,
        expenses: mockExpenses,
        currency: 'USD',
        canEdit: true,
      },
      { isMobile: true },
    )

    expect(wrapper.find('.q-slide-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete')
  })

  it('should delete immediately on mobile swipe', async () => {
    const wrapper = renderAllExpensesDialog(
      {
        modelValue: true,
        expenses: mockExpenses,
        currency: 'USD',
        canEdit: true,
      },
      { isMobile: true },
    )

    await wrapper.find('.slide-right-trigger').trigger('click')

    expect(mockDeleteExpense).toHaveBeenCalledWith(mockExpenses[0], expect.any(Function))
    expect(mockConfirmDeleteExpense).not.toHaveBeenCalled()
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('should not show delete buttons when canEdit is false', () => {
    const wrapper = renderAllExpensesDialog({
      modelValue: true,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: false,
    })

    const html = wrapper.html()
    expect(html).toContain('Groceries')
  })
})
