<template>
  <q-card flat>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">
          <q-icon
            name="eva-clock-outline"
            class="q-mr-sm"
          />
          Recent Expenses
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
          <q-item-section avatar>
            <q-avatar
              :style="{ backgroundColor: getCategoryColor(expense.category_id) }"
              size="36px"
              text-color="white"
            >
              <q-icon
                :name="getCategoryIcon(expense.category_id)"
                size="18px"
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

          <q-item-section side>
            <q-item-label class="text-weight-bold">
              {{ formatCurrency(expense.amount, currency) }}
            </q-item-label>
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
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseWithCategory } from 'src/api'

const props = defineProps<{
  expenses: ExpenseWithCategory[]
  currency: CurrencyCode
  isLoading: boolean
}>()

defineEmits<{
  (e: 'view-all'): void
  (e: 'add-expense'): void
}>()

const categoriesStore = useCategoriesStore()

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
</script>
