<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
  >
    <q-card
      class="column"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <!-- Header -->
      <q-card-section class="row items-center">
        <div class="row items-center">
          <q-avatar
            :style="{ backgroundColor: category?.categoryColor }"
            :size="$q.screen.lt.md ? '24px' : '32px'"
            text-color="white"
            class="q-mr-sm"
          >
            <q-icon
              :name="category?.categoryIcon"
              :size="$q.screen.lt.md ? '14px' : '18px'"
            />
          </q-avatar>
          <h2
            class="q-my-none"
            :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
          >
            {{ category?.categoryName }}
          </h2>
        </div>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          :size="$q.screen.lt.md ? 'sm' : 'md'"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <!-- Category Summary -->
      <q-card-section :class="$q.dark.isActive ? 'bg-black-2' : 'bg-grey-1'">
        <!-- Budget Overview -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-4">
            <div class="text-center">
              <div
                class="text-caption"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                Budget
              </div>
              <div class="text-h6 text-weight-bold">
                {{ formatCurrency(category?.plannedAmount || 0, currency) }}
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div
                class="text-caption"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                Spent
              </div>
              <div class="text-h6 text-weight-bold text-info">
                {{ formatCurrency(category?.actualAmount || 0, currency) }}
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div
                class="text-caption"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                Remaining
              </div>
              <div
                class="text-h6 text-weight-bold"
                :class="remainingColorClass"
              >
                {{ formatCurrency(Math.abs(category?.remainingAmount || 0), currency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="q-mb-md">
          <div class="row items-center justify-between q-mb-xs">
            <div
              class="text-caption"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
            >
              Progress
            </div>
            <div class="text-caption text-weight-medium">{{ Math.round(progressPercentage) }}%</div>
          </div>
          <q-linear-progress
            :value="progressPercentage / 100"
            :color="progressColor"
            size="12px"
            rounded
          />
        </div>

        <!-- Action Button -->
        <div class="row justify-center">
          <q-btn
            v-if="canEdit"
            color="primary"
            label="Add Expense"
            icon="eva-plus-outline"
            unelevated
            no-caps
            class="full-width"
            @click="openExpenseDialog"
          />
        </div>
      </q-card-section>

      <!-- Expenses List -->
      <q-card-section class="q-pb-none">
        <div class="row items-center q-mb-md">
          <q-icon
            name="eva-list-outline"
            class="q-mr-sm"
            size="20px"
          />
          <h2 class="text-h6 q-my-none">Expenses</h2>
          <q-chip
            v-if="expenses.length > 0"
            color="primary"
            text-color="white"
            size="sm"
            class="q-ml-sm"
          >
            {{ expenses.length }}
          </q-chip>
        </div>
      </q-card-section>

      <!-- Scrollable Expenses Container -->
      <q-card-section class="q-pt-none overflow-auto col">
        <q-list
          v-if="expenses.length > 0"
          separator
        >
          <q-item
            v-for="expense in expenses"
            :key="expense.id"
            class="q-px-none"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ expense.name }}
              </q-item-label>
              <q-item-label
                caption
                class="q-mt-xs"
              >
                {{ formatDate(expense.expense_date) }}
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

        <!-- Empty State -->
        <div
          v-else
          class="text-center q-py-xl"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-icon
            name="eva-shopping-cart-outline"
            size="64px"
            :class="$q.dark.isActive ? 'text-grey-5 q-mb-md' : 'q-mb-md'"
          />
          <div class="text-h6 q-mb-sm">No expenses yet</div>
          <div class="text-body2 q-mb-lg">Start tracking your expenses in this category</div>
          <q-btn
            v-if="canEdit"
            color="primary"
            label="Add First Expense"
            icon="eva-plus-outline"
            unelevated
            no-caps
            @click="openExpenseDialog"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Expense Registration Dialog -->
    <ExpenseRegistrationDialog
      v-model="showExpenseDialog"
      :default-plan-id="planId || null"
      :default-category-id="category?.categoryId || null"
      @expense-created="onExpenseCreated"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar, Dialog } from 'quasar'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useExpensesStore } from 'src/stores/expenses'
import { useNotificationStore } from 'src/stores/notification'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import type { ExpenseWithCategory } from 'src/api'

const $q = useQuasar()

interface CategoryData {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
  expenseCount: number
}

const props = defineProps<{
  modelValue: boolean
  category: CategoryData | null
  expenses: ExpenseWithCategory[]
  currency: CurrencyCode
  canEdit: boolean
  planId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'add-expense'): void
  (e: 'refresh'): void
}>()

const expensesStore = useExpensesStore()
const notificationStore = useNotificationStore()

// Local state
const showExpenseDialog = ref(false)

const progressPercentage = computed(() => {
  if (!props.category || props.category.plannedAmount === 0) return 0
  return Math.min((props.category.actualAmount / props.category.plannedAmount) * 100, 999)
})

const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 100) return 'primary'
  if (percentage === 100) return 'positive'
  if (percentage <= 110) return 'warning'
  return 'negative'
})

const remainingColorClass = computed(() => {
  if (!props.category) return ''
  const percentage = progressPercentage.value
  if (percentage < 100) return 'text-primary'
  if (percentage === 100) return 'text-positive'
  if (percentage <= 110) return 'text-warning'
  return 'text-negative'
})

// Methods
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

function openExpenseDialog() {
  showExpenseDialog.value = true
}

function onExpenseCreated() {
  showExpenseDialog.value = false
  emit('refresh')
}

function confirmDeleteExpense(expense: ExpenseWithCategory) {
  Dialog.create({
    title: 'Delete Expense',
    message: `Are you sure you want to delete "${expense.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      await expensesStore.removeExpense(expense.id)
      notificationStore.showSuccess('Expense deleted successfully')
      emit('refresh')
    })()
  })
}
</script>
