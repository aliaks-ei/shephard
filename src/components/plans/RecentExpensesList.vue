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
        <q-list separator>
          <q-item
            v-for="i in $q.screen.lt.md ? 2 : 3"
            :key="i"
            class="q-px-none"
          >
            <q-item-section
              style="min-width: auto"
              avatar
            >
              <q-skeleton
                type="QAvatar"
                :size="$q.screen.lt.md ? '32px' : '40px'"
              />
            </q-item-section>
            <q-item-section>
              <q-skeleton
                type="text"
                width="55%"
                height="14px"
                class="q-mb-xs"
              />
              <q-skeleton
                type="text"
                width="40%"
                height="12px"
              />
            </q-item-section>
            <q-item-section
              side
              class="items-end"
            >
              <q-skeleton
                type="text"
                width="60px"
                height="14px"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-list
        v-else-if="expenses.length > 0"
        separator
      >
        <template
          v-for="expense in displayedExpenses"
          :key="expense.id"
        >
          <q-slide-item
            v-if="$q.screen.lt.md && canEdit"
            class="mobile-expense-swipe-item"
            right-color="negative"
            @right="(details) => handleSwipeDelete(expense, details)"
          >
            <template #right>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  name="eva-trash-2-outline"
                  size="20px"
                />
                <span class="text-weight-medium">Delete</span>
              </div>
            </template>

            <q-item class="q-px-none">
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
                </div>
              </q-item-section>
            </q-item>
          </q-slide-item>

          <q-item
            v-else
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
        </template>
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
const { confirmDeleteExpense, deleteExpense } = useExpenseActions()

const displayedExpenses = computed(() => {
  return props.expenses.slice(0, 5)
})

function handleSwipeDelete(expense: ExpenseWithCategory, details: { reset: () => void }) {
  details.reset()
  void deleteExpense(expense, () => emit('refresh'))
}
</script>
