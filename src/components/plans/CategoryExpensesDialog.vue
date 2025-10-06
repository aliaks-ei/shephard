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
    <q-card class="column no-wrap full-height">
      <!-- Header -->
      <q-card-section class="row items-center">
        <div class="row items-center">
          <CategoryIcon
            :color="category?.categoryColor || '#666'"
            :icon="category?.categoryIcon || 'eva-folder-outline'"
            size="sm"
            class="q-mr-sm"
          />
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
      <q-card-section
        class="q-pa-md"
        :class="$q.dark.isActive ? 'bg-black-2' : 'bg-grey-1'"
      >
        <!-- Budget Overview -->
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4">
            <div class="text-center">
              <div
                class="text-caption"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                Budget
              </div>
              <div class="text-body1 text-weight-bold">
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
              <div class="text-body1 text-weight-bold text-info">
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
                {{ (category?.remainingAmount || 0) >= 0 ? 'Remaining' : 'Over' }}
              </div>
              <div
                class="text-body1 text-weight-bold"
                :class="remainingColorClass"
              >
                {{ formatCurrency(Math.abs(category?.remainingAmount || 0), currency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div>
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
            size="8px"
            rounded
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Tabs Navigation -->
      <q-tabs
        v-model="activeTab"
        no-caps
        inline-label
        align="justify"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab
          v-if="sortedPlanItems.length > 0"
          name="items"
          label="Items to Track"
          icon="eva-checkmark-square-2-outline"
        >
          <q-badge
            v-if="totalItemsCount > 0"
            color="primary"
            class="relative-position"
            style="top: 0"
            floating
          >
            {{ completedItemsCount }}/{{ totalItemsCount }}
          </q-badge>
        </q-tab>
        <q-tab
          name="expenses"
          label="Expenses"
          icon="eva-list-outline"
        >
          <q-badge
            v-if="expenses.length > 0"
            color="primary"
            class="relative-position"
            style="top: 0"
            floating
          >
            {{ expenses.length }}
          </q-badge>
        </q-tab>
      </q-tabs>

      <q-separator />

      <!-- Tab Panels -->
      <q-tab-panels
        v-model="activeTab"
        animated
        :swipeable="$q.screen.lt.md"
        :transition-prev="$q.screen.lt.md ? 'slide-right' : 'fade'"
        :transition-next="$q.screen.lt.md ? 'slide-left' : 'fade'"
        class="col overflow-auto"
      >
        <!-- Items to Track Panel -->
        <q-tab-panel
          v-if="sortedPlanItems.length > 0"
          name="items"
          class="q-pa-none"
        >
          <q-list class="q-py-sm">
            <q-item
              v-for="item in sortedPlanItems"
              :key="item.id"
              clickable
              dense
              @click="toggleItemCompletion(item)"
              :class="item.is_completed ? 'text-strike' : ''"
            >
              <q-item-section
                class="q-pr-sm"
                style="min-width: auto"
                avatar
              >
                <q-checkbox
                  :model-value="item.is_completed"
                  @update:model-value="(value) => toggleItemCompletion(item, value)"
                  :disable="!canEdit"
                  color="primary"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label :class="item.is_completed ? 'text-grey-6' : 'text-weight-medium'">
                  {{ item.name }}
                </q-item-label>
                <q-item-label caption>
                  <span :class="item.is_completed ? 'text-grey-5' : ''">
                    {{ formatCurrency(item.amount, currency) }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Expenses Panel -->
        <q-tab-panel
          name="expenses"
          class="q-pa-none"
        >
          <!-- Expenses List -->
          <q-list
            v-if="expenses.length > 0"
            separator
          >
            <q-item
              v-for="expense in expenses"
              :key="expense.id"
              class="q-px-md"
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
              size="48px"
              :class="$q.dark.isActive ? 'text-grey-5 q-mb-md' : 'q-mb-md'"
            />
            <div class="text-subtitle1 q-mb-sm">No expenses yet</div>
            <div class="text-body2">Start tracking your expenses in this category</div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-separator />

      <!-- Fixed Action Footer -->
      <q-card-actions
        align="right"
        class="safe-area-bottom"
      >
        <q-btn
          label="Close"
          flat
          no-caps
          @click="$emit('update:modelValue', false)"
        />
        <q-btn
          v-if="canEdit"
          label="Add Expense"
          icon="eva-plus-outline"
          color="primary"
          unelevated
          no-caps
          @click="openExpenseDialog"
        />
      </q-card-actions>
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
import { Dialog, useQuasar } from 'quasar'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useExpensesStore } from 'src/stores/expenses'
import { useNotificationStore } from 'src/stores/notification'
import { updatePlanItemCompletion, type PlanItem } from 'src/api/plans'
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
  planItems?: PlanItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'add-expense'): void
  (e: 'refresh'): void
}>()

const expensesStore = useExpensesStore()
const notificationStore = useNotificationStore()

// Plan items for this category (sorted: incomplete first)
const sortedPlanItems = computed(() => {
  if (!props.planItems || props.planItems.length === 0) return []

  return [...props.planItems].sort((a, b) => {
    const aCompleted = a.is_completed
    const bCompleted = b.is_completed
    if (aCompleted === bCompleted) return 0
    return aCompleted ? 1 : -1
  })
})

// Local state
const showExpenseDialog = ref(false)

// Default to items tab if there are items, otherwise expenses
const activeTab = ref('items')

const completedItemsCount = computed(
  () => sortedPlanItems.value.filter((item) => item.is_completed).length,
)

const totalItemsCount = computed(() => sortedPlanItems.value.length)

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

async function toggleItemCompletion(item: PlanItem, value?: boolean) {
  if (!props.canEdit || !props.planId) return

  const newCompletionState = value !== undefined ? value : !item.is_completed

  try {
    if (newCompletionState) {
      // Checking the item - create expense
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const expenseDate = `${year}-${month}-${day}`

      item.is_completed = newCompletionState

      await expensesStore.addExpense({
        plan_id: props.planId,
        category_id: item.category_id,
        name: item.name,
        amount: item.amount,
        expense_date: expenseDate,
        plan_item_id: item.id,
      })

      notificationStore.showSuccess(`${item.name} marked as completed!`)
    } else {
      // Unchecking the item - delete associated expense(s)
      const expensesToDelete = expensesStore.expenses.filter(
        (expense) => expense.plan_item_id === item.id,
      )

      if (expensesToDelete.length === 0) {
        notificationStore.showError('No expenses found to remove for this item')
        return
      }

      item.is_completed = newCompletionState

      // Delete all expenses linked to this plan item
      for (const expense of expensesToDelete) {
        await expensesStore.removeExpense(expense.id)
      }

      notificationStore.showSuccess(`${item.name} unmarked as completed!`)
    }

    // Update the database completion state
    await updatePlanItemCompletion(item.id, newCompletionState)

    // Refresh to get updated values
    emit('refresh')
  } catch {
    item.is_completed = !newCompletionState
    const action = newCompletionState ? 'completed' : 'incomplete'
    notificationStore.showError(`Failed to mark item as ${action}. Please try again.`)
  }
}
</script>
