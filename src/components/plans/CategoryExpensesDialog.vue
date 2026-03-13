<template>
  <AppDialogShell
    :model-value="modelValue"
    :title="category?.categoryName || 'Category'"
    body-class="q-pa-none"
    :body-scrollable="false"
    :primary-action-label="canEdit ? 'Add Expense' : undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @primary="openExpenseDialog"
  >
    <template #header-prefix>
      <CategoryIcon
        :color="category?.categoryColor || '#666'"
        :icon="category?.categoryIcon || 'eva-folder-outline'"
        size="sm"
        class="q-mr-sm"
      />
    </template>

    <div class="column no-wrap category-expenses-dialog__content">
      <!-- Category Summary -->
      <q-card-section class="q-pa-md themed-muted-surface">
        <!-- Budget Overview -->
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4">
            <div class="text-center">
              <div class="text-caption text-caption-secondary">Budget</div>
              <div class="text-body1 text-weight-bold">
                {{ formatCurrency(category?.plannedAmount || 0, currency) }}
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div class="text-caption text-caption-secondary">Spent</div>
              <div class="text-body1 text-weight-bold text-info">
                {{ formatCurrency(category?.actualAmount || 0, currency) }}
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div class="text-caption text-caption-secondary">
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
            <div class="text-caption text-caption-secondary">Progress</div>
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
        dense
        no-caps
        inline-label
        align="justify"
        active-color="primary"
        indicator-color="transparent"
        class="q-mx-md q-my-md"
      >
        <q-tab
          v-if="hasAnyPlanItems"
          name="items"
          label="Items to Track"
          :ripple="false"
        >
          <q-badge
            v-if="totalItemsCount > 0"
            color="primary"
            class="category-dialog-badge"
          >
            {{ completedItemsCount }}/{{ totalItemsCount }}
          </q-badge>
        </q-tab>
        <q-tab
          name="expenses"
          label="Expenses"
          :ripple="false"
        >
          <q-badge
            v-if="expenses.length > 0"
            color="primary"
            class="category-dialog-badge"
          >
            {{ expenses.length }}
          </q-badge>
        </q-tab>
      </q-tabs>

      <!-- Tab Panels -->
      <q-tab-panels
        v-model="activeTab"
        animated
        :swipeable="$q.screen.lt.md"
        :transition-prev="$q.screen.lt.md ? 'slide-right' : 'fade'"
        :transition-next="$q.screen.lt.md ? 'slide-left' : 'fade'"
        class="col overflow-auto bg-transparent"
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
                class="q-pr-sm category-dialog-icon-section"
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
                class="text-caption q-py-xs text-caption-secondary"
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
                  class="q-pr-sm category-dialog-icon-section"
                  avatar
                >
                  <q-icon
                    name="eva-bookmark-outline"
                    size="24px"
                    class="text-caption-secondary"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-caption-secondary">
                    {{ item.name }}
                  </q-item-label>
                  <q-item-label caption>
                    <span class="text-caption-secondary">
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
          <q-virtual-scroll
            v-if="expenses.length > 0"
            :items="expenses"
            :virtual-scroll-item-size="$q.screen.lt.md ? 96 : 84"
            class="category-expenses-virtual-list"
          >
            <template #default="{ item: expense }">
              <ExpenseListItem
                :key="expense.id"
                :expense="expense"
                :currency="currency"
                :can-edit="canEdit"
                item-class="q-px-md"
                @deleted="emit('refresh')"
              />
            </template>
          </q-virtual-scroll>

          <!-- Empty State -->
          <div
            v-else
            class="text-center q-py-xl text-caption-secondary"
          >
            <q-icon
              name="eva-shopping-cart-outline"
              size="48px"
              class="q-mb-md"
            />
            <div class="text-subtitle1 q-mb-sm">No expenses yet</div>
            <div class="text-body2">Start tracking your expenses in this category</div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <template #footer>
      <q-btn
        label="Close"
        flat
        dense
        no-caps
        @click="$emit('update:modelValue', false)"
      />
      <q-btn
        v-if="canEdit"
        label="Add Expense"
        color="primary"
        unelevated
        dense
        no-caps
        @click="openExpenseDialog"
      />
    </template>
  </AppDialogShell>

  <!-- Expense Registration Dialog -->
  <ExpenseRegistrationDialog
    v-if="hasOpenedExpenseDialog"
    v-model="showExpenseDialog"
    :default-plan-id="planId || null"
    :default-category-id="category?.categoryId || null"
    @expense-created="onExpenseCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import ExpenseListItem from 'src/components/expenses/ExpenseListItem.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'
import { useItemCompletion } from 'src/composables/useItemCompletion'
import { useTrackablePlanItems } from 'src/composables/useTrackablePlanItems'
import type { PlanItem } from 'src/api/plans'
import type { ExpenseWithCategory } from 'src/api'

type CategoryData = {
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
const { fixedPlanItems, nonFixedPlanItems, hasAnyPlanItems, completedItemsCount, totalItemsCount } =
  useTrackablePlanItems(computed(() => props.planItems ?? []))

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)
const activeTab = ref('expenses')

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
  hasOpenedExpenseDialog.value = true
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

<style lang="scss" scoped>
.category-expenses-dialog__content {
  flex: 1 1 auto;
  min-height: 0;
}

.category-expenses-virtual-list {
  max-height: min(58vh, 480px);
}

.category-dialog-icon-section {
  min-width: auto;
}
</style>
