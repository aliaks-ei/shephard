<template>
  <q-card flat>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-icon
            name="eva-clock-outline"
            class="q-mr-sm"
            size="20px"
          />
          <h2 class="text-h6 q-my-none">Recent Expenses</h2>
        </div>
        <q-btn
          v-if="expenses.length > 5"
          flat
          dense
          color="primary"
          label="View All"
          no-caps
          @click="$emit('view-all')"
        />
      </div>

      <div v-if="isLoading">
        <q-skeleton
          v-for="i in 3"
          :key="i"
          type="rect"
          height="60px"
          class="q-mb-sm"
        />
      </div>

      <q-list
        v-else-if="expenses.length > 0"
        separator
      >
        <q-item
          v-for="expense in displayedExpenses"
          :key="expense.id"
          class="q-px-none"
        >
          <q-item-section
            style="min-width: auto"
            avatar
          >
            <q-avatar
              :style="{ backgroundColor: getCategoryColor(expense.category_id) }"
              size="32px"
              text-color="white"
            >
              <q-icon
                :name="getCategoryIcon(expense.category_id)"
                size="16px"
              />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ expense.name }}
            </q-item-label>
            <q-item-label caption>
              {{ getCategoryName(expense.category_id) }} • {{ formatDate(expense.expense_date) }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            side
            class="items-end"
          >
            <div class="row items-center q-gutter-sm">
              <q-item-label class="text-weight-bold text-primary">
                {{ formatCurrency(expense.amount, currency) }}
              </q-item-label>
              <q-btn
                v-if="canEdit"
                flat
                round
                size="sm"
                icon="eva-trash-2-outline"
                color="negative"
                @click="confirmDeleteExpense(expense)"
              >
                <q-tooltip v-if="!$q.screen.lt.md">Delete expense</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else
        class="text-center text-grey-6 q-py-lg"
      >
        <q-icon
          name="eva-shopping-cart-outline"
          size="48px"
          class="q-mb-md"
        />
        <div class="q-mb-md">No expenses registered yet</div>
        <q-btn
          color="primary"
          label="Add First Expense"
          icon="eva-plus-outline"
          no-caps
          @click="$emit('add-expense')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog } from 'quasar'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useCategoriesStore } from 'src/stores/categories'
import { useExpensesStore } from 'src/stores/expenses'
import { useNotificationStore } from 'src/stores/notification'
import type { ExpenseWithCategory } from 'src/api'

const props = defineProps<{
  expenses: ExpenseWithCategory[]
  currency: CurrencyCode
  isLoading: boolean
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-all'): void
  (e: 'add-expense'): void
  (e: 'refresh'): void
}>()

const categoriesStore = useCategoriesStore()
const expensesStore = useExpensesStore()
const notificationStore = useNotificationStore()

// Show only the 5 most recent expenses
const displayedExpenses = computed(() => {
  return props.expenses.slice(0, 5)
})

// Helper functions
function getCategoryName(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.name || 'Unknown'
}

function getCategoryColor(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.color || '#666'
}

function getCategoryIcon(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.icon || 'eva-folder-outline'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    }).format(date)
  }
}

function confirmDeleteExpense(expense: ExpenseWithCategory) {
  Dialog.create({
    title: 'Delete Expense?',
    message: `Are you sure you want to delete "${expense.name}"?`,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    void (async () => {
      await expensesStore.removeExpense(expense.id)
      notificationStore.showSuccess('Expense deleted successfully')
      emit('refresh')
    })()
  })
}
</script>
