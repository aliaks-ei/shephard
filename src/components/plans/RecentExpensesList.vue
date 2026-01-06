<template>
  <q-card flat>
    <q-card-section
      class="q-pb-sm"
      :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-px-md'"
    >
      <div
        class="row items-center justify-between"
        :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
      >
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
            <CategoryIcon
              :color="getCategoryColor(expense.category_id)"
              :icon="getCategoryIcon(expense.category_id)"
              :size="$q.screen.lt.md ? 'xs' : 'sm'"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ expense.name }}
            </q-item-label>
            <q-item-label caption>
              {{ getCategoryName(expense.category_id) }} •
              {{ formatDateRelative(expense.expense_date) }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            side
            class="items-end"
          >
            <div class="row items-center q-gutter-sm">
              <div class="column items-end">
                <q-item-label class="text-weight-bold text-primary">
                  {{ formatCurrency(expense.amount, currency) }}
                </q-item-label>
                <q-item-label
                  v-if="expense.original_amount && expense.original_currency"
                  caption
                  class="text-caption text-grey-6"
                >
                  {{
                    formatCurrency(
                      expense.original_amount,
                      expense.original_currency as CurrencyCode,
                    )
                  }}
                </q-item-label>
              </div>
              <q-btn
                v-if="canEdit"
                flat
                round
                size="sm"
                icon="eva-trash-2-outline"
                color="negative"
                @click="confirmDeleteExpense(expense, () => emit('refresh'))"
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
          no-caps
          @click="$emit('add-expense')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDateRelative } from 'src/utils/date'
import { useCategoryHelpers } from 'src/composables/useCategoryHelpers'
import { useExpenseActions } from 'src/composables/useExpenseActions'
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

const { getCategoryName, getCategoryColor, getCategoryIcon } = useCategoryHelpers()
const { confirmDeleteExpense } = useExpenseActions()

const displayedExpenses = computed(() => {
  return props.expenses.slice(0, 5)
})
</script>
