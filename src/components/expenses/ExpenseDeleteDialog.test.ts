import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ExpenseDeleteDialog from './ExpenseDeleteDialog.vue'
import { useExpenseActions } from 'src/composables/useExpenseActions'
import type { ExpenseWithCategory } from 'src/api'

installQuasarPlugin()

const mockMutateAsync = vi.fn()

vi.mock('src/queries/expenses', () => ({
  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: ref(false),
  })),
}))

const mockExpense: ExpenseWithCategory = {
  id: 'expense-1',
  plan_id: 'plan-1',
  category_id: 'cat-1',
  name: 'Groceries',
  amount: 100,
  expense_date: '2024-01-15',
  user_id: 'user-1',
  plan_item_id: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  currency: 'USD',
  original_amount: null,
  original_currency: null,
  categories: {
    id: 'cat-1',
    name: 'Food',
    color: '#FF5733',
    icon: 'eva-shopping-bag-outline',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
}

const DeleteDialogStub = {
  name: 'DeleteDialog',
  template:
    '<div v-if="modelValue" data-test="delete-dialog">' +
    '<div data-test="title">{{ title }}</div>' +
    '<div data-test="warning">{{ warningMessage }}</div>' +
    '<div data-test="message">{{ confirmationMessage }}</div>' +
    '<button data-test="cancel" @click="$emit(\'update:modelValue\', false)">{{ cancelLabel }}</button>' +
    '<button data-test="confirm" :disabled="isDeleting" @click="$emit(\'confirm\')">{{ confirmLabel }}</button>' +
    '</div>',
  props: [
    'modelValue',
    'title',
    'warningMessage',
    'confirmationMessage',
    'cancelLabel',
    'confirmLabel',
    'isDeleting',
  ],
  emits: ['update:modelValue', 'confirm'],
}

const renderComponent = () =>
  mount(ExpenseDeleteDialog, {
    global: {
      stubs: { DeleteDialog: DeleteDialogStub },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockMutateAsync.mockResolvedValue(undefined)
  useExpenseActions().cancelPendingDelete()
})

describe('ExpenseDeleteDialog', () => {
  it('stays hidden when no delete is pending', () => {
    const wrapper = renderComponent()

    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(false)
  })

  it('opens with the pending expense name when a delete is requested', async () => {
    const wrapper = renderComponent()

    useExpenseActions().confirmDeleteExpense(mockExpense)
    await nextTick()

    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="title"]').text()).toBe('Delete Expense')
    expect(wrapper.find('[data-test="warning"]').text()).toBe('This action cannot be undone.')
    expect(wrapper.find('[data-test="message"]').text()).toBe(
      'Are you sure you want to delete "Groceries"?',
    )
  })

  it('deletes the expense and closes on confirm', async () => {
    const onSuccess = vi.fn()
    const wrapper = renderComponent()

    useExpenseActions().confirmDeleteExpense(mockExpense, onSuccess)
    await nextTick()

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    await nextTick()

    expect(mockMutateAsync).toHaveBeenCalledWith({ expenseId: 'expense-1', planId: 'plan-1' })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(false)
  })

  it('closes without deleting on cancel', async () => {
    const wrapper = renderComponent()

    useExpenseActions().confirmDeleteExpense(mockExpense)
    await nextTick()

    await wrapper.find('[data-test="cancel"]').trigger('click')
    await nextTick()

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(false)
  })
})
