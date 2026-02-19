<template>
  <q-dialog
    :model-value="modelValue"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
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
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <!-- Category Summary -->
      <q-card-section class="q-pa-md themed-muted-surface">
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
                {{ (category?.remainingAmount || 0) >= 0 ? 'Still to pay' : 'Over' }}
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
          v-if="hasAnyPlanItems"
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
          v-if="hasAnyPlanItems"
          name="items"
          class="q-pa-none"
        >
          <q-list class="q-py-sm">
            <!-- Fixed payment items (trackable with checkbox) -->
            <q-item
              v-for="item in fixedPlanItems"
              :key="item.id"
              clickable
              dense
              @click="handleToggleItemCompletion(item)"
              :class="item.is_completed ? 'text-strike' : ''"
            >
              <q-item-section
                class="q-pr-sm"
                style="min-width: auto"
                avatar
              >
                <q-checkbox
                  :model-value="item.is_completed"
                  @update:model-value="(value) => handleToggleItemCompletion(item, value)"
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

            <!-- Separator for non-fixed items -->
            <template v-if="nonFixedPlanItems.length > 0">
              <q-separator
                v-if="fixedPlanItems.length > 0"
                class="q-my-sm"
              />
              <q-item-label
                header
                class="text-caption q-py-xs"
                :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'"
              >
                For Reference
              </q-item-label>

              <!-- Non-fixed items (read-only, greyed out) -->
              <q-item
                v-for="item in nonFixedPlanItems"
                :key="item.id"
                dense
                class="text-grey-6"
              >
                <q-item-section
                  class="q-pr-sm"
                  style="min-width: auto"
                  avatar
                >
                  <q-icon
                    name="eva-bookmark-outline"
                    size="24px"
                    :class="$q.dark.isActive ? 'text-grey-6' : 'text-grey-5'"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">
                    {{ item.name }}
                  </q-item-label>
                  <q-item-label caption>
                    <span :class="$q.dark.isActive ? 'text-grey-6' : 'text-grey-7'">
                      {{ formatCurrency(item.amount, currency) }}
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
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
            <template
              v-for="expense in expenses"
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

                <q-item class="q-px-md">
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
import { ref, computed, watch } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDate } from 'src/utils/date'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'
import { useItemCompletion } from 'src/composables/useItemCompletion'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useExpenseActions } from 'src/composables/useExpenseActions'
import type { PlanItem } from 'src/api/plans'
import type { ExpenseWithCategory } from 'src/api'

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
  'update:modelValue': [value: boolean]
  'add-expense': []
  refresh: []
}>()

const planIdRef = computed(() => props.planId ?? null)
const { toggleItemCompletion: toggleCompletion } = useItemCompletion(planIdRef)
const { confirmDeleteExpense, deleteExpense } = useExpenseActions()

const fixedPlanItems = computed(() => {
  if (!props.planItems || props.planItems.length === 0) return []

  // Fixed payment items that can be tracked (checkable)
  return [...props.planItems]
    .filter((item) => item.is_fixed_payment)
    .sort((a, b) => {
      const aCompleted = a.is_completed
      const bCompleted = b.is_completed
      if (aCompleted === bCompleted) return 0
      return aCompleted ? 1 : -1
    })
})

const nonFixedPlanItems = computed(() => {
  if (!props.planItems || props.planItems.length === 0) return []

  // Non-fixed items shown as read-only reference
  return [...props.planItems].filter((item) => !item.is_fixed_payment)
})

const hasAnyPlanItems = computed(
  () => fixedPlanItems.value.length > 0 || nonFixedPlanItems.value.length > 0,
)

const showExpenseDialog = ref(false)
const activeTab = ref('expenses')

const completedItemsCount = computed(
  () => fixedPlanItems.value.filter((item) => item.is_completed).length,
)

const totalItemsCount = computed(() => fixedPlanItems.value.length)

const progressPercentage = computed(() => {
  if (!props.category || props.category.plannedAmount === 0) return 0
  return Math.min((props.category.actualAmount / props.category.plannedAmount) * 100, 999)
})

const progressColor = computed(() => getBudgetProgressColor(progressPercentage.value))

const remainingColorClass = computed(() => {
  if (!props.category) return ''
  return getBudgetRemainingColorClass(progressPercentage.value)
})

function openExpenseDialog() {
  showExpenseDialog.value = true
}

function onExpenseCreated() {
  showExpenseDialog.value = false
  emit('refresh')
}

function handleToggleItemCompletion(item: PlanItem, value?: boolean) {
  if (!props.canEdit) return
  toggleCompletion(item, value, () => emit('refresh'))
}

function handleSwipeDelete(expense: ExpenseWithCategory, details: { reset: () => void }) {
  details.reset()
  void deleteExpense(expense, () => emit('refresh'))
}

watch(
  hasAnyPlanItems,
  () => {
    if (hasAnyPlanItems.value) {
      activeTab.value = 'items'
    } else {
      activeTab.value = 'expenses'
    }
  },
  { immediate: true },
)
</script>
