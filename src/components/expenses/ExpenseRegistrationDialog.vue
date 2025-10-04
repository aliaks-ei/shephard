<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="column no-wrap"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <!-- Fixed Header -->
      <q-card-section class="row items-center">
        <q-icon
          name="eva-plus-circle-outline"
          :size="$q.screen.lt.md ? '24px' : '32px'"
          class="q-mr-sm"
        />
        <h2
          class="q-my-none"
          :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
        >
          Register New Expense
        </h2>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          :size="$q.screen.lt.md ? 'sm' : 'md'"
          @click="closeDialog"
        />
      </q-card-section>
      <q-separator />

      <!-- Fixed Tabs -->
      <q-tabs
        v-model="currentMode"
        no-caps
        inline-label
        align="justify"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-7"
      >
        <q-tab
          name="quick-select"
          label="Quick Select Items"
          icon="eva-checkmark-square-2-outline"
        />
        <q-tab
          name="custom-entry"
          label="Custom Entry"
          icon="eva-edit-outline"
        />
      </q-tabs>

      <q-separator />

      <q-form
        class="column no-wrap"
        style="flex: 1; min-height: 0"
        ref="formRef"
        @submit="handleSubmit"
      >
        <!-- Scrollable Content Area -->
        <q-tab-panels
          v-model="currentMode"
          animated
          :swipeable="$q.screen.lt.md"
          :transition-prev="$q.screen.lt.md ? 'slide-right' : 'fade'"
          :transition-next="$q.screen.lt.md ? 'slide-left' : 'fade'"
          class="col overflow-auto"
          style="flex: 1; min-height: 0"
        >
          <!-- Quick Select Items Mode -->
          <q-tab-panel
            name="quick-select"
            class="q-pa-none"
          >
            <!-- Phase 1: Item Selection -->
            <q-slide-transition>
              <div v-show="quickSelectPhase === 'selection'">
                <q-card-section>
                  <!-- Plan Selection (Quick Select Mode) -->
                  <q-select
                    v-model="form.planId"
                    :options="planOptions"
                    option-label="label"
                    option-value="value"
                    label="Select Plan *"
                    outlined
                    emit-value
                    map-options
                    hide-bottom-space
                    :readonly="!!props.defaultPlanId"
                    :loading="plansStore.isLoading"
                    :rules="[(val: string) => !!val || 'Plan is required']"
                    @update:model-value="onPlanSelected"
                    :display-value="planDisplayValue"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                          <q-item-label caption>
                            {{ formatDateRange(scope.opt.startDate, scope.opt.endDate) }}
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-chip
                            :color="getStatusColor(scope.opt.status)"
                            text-color="white"
                            size="sm"
                          >
                            {{ scope.opt.status }}
                          </q-chip>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No plans available. Create a plan first.
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <!-- Auto-selection hint -->
                  <q-banner
                    v-if="didAutoSelectPlan && selectedPlan"
                    class="bg-blue-1 text-blue-8 q-mt-md"
                    dense
                  >
                    <template #avatar>
                      <q-icon name="eva-info-outline" />
                    </template>
                    Most recently used plan selected.
                  </q-banner>
                </q-card-section>

                <!-- Plan Item Selector -->
                <q-card-section
                  v-if="selectedPlan"
                  class="q-pt-none"
                >
                  <PlanItemSelector
                    :plan-items="planItems"
                    :currency="(selectedPlan.currency as CurrencyCode) || 'USD'"
                    :is-loading="isLoadingPlanItems"
                    :selected-category-id="props.defaultCategoryId || null"
                    @item-selected="onItemsSelected"
                    @selection-changed="onSelectionChanged"
                    ref="planItemSelectorRef"
                  />
                </q-card-section>
              </div>
            </q-slide-transition>

            <!-- Phase 2: Finalize Expense -->
            <q-slide-transition>
              <div v-show="quickSelectPhase === 'finalize'">
                <q-card-section>
                  <div class="row items-center q-mb-md">
                    <q-icon
                      name="eva-clipboard-outline"
                      class="q-mr-sm"
                      size="20px"
                    />
                    <h2 class="text-h6 q-my-none">Review & Finalize</h2>
                  </div>

                  <!-- Selected Plan Info -->
                  <q-card
                    flat
                    bordered
                    class="q-mb-md"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="text-body2 text-grey-7 q-mb-xs">Selected Plan</div>
                      <div class="text-subtitle1 text-weight-medium">
                        {{ selectedPlan?.name }}
                      </div>
                    </q-card-section>
                  </q-card>

                  <!-- Selected Items Summary -->
                  <q-card
                    flat
                    bordered
                    class="q-mb-md"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="text-body2 text-grey-7 q-mb-xs">
                        Selected Items ({{ selectedPlanItems.length }})
                      </div>
                      <q-list dense>
                        <q-item
                          v-for="item in selectedPlanItems"
                          :key="item.id"
                          class="q-pa-none q-my-xs"
                        >
                          <q-item-section>
                            <div class="text-body2">{{ item.name }}</div>
                          </q-item-section>
                          <q-item-section side>
                            <div class="text-body2 text-weight-medium">
                              {{
                                formatCurrency(
                                  item.amount,
                                  (selectedPlan?.currency as CurrencyCode) || 'USD',
                                )
                              }}
                            </div>
                          </q-item-section>
                          <q-item-section
                            side
                            class="q-ml-sm"
                          >
                            <q-btn
                              icon="eva-close-outline"
                              flat
                              round
                              dense
                              size="sm"
                              color="grey-7"
                              @click="removeSelectedItem(item.id)"
                            />
                          </q-item-section>
                        </q-item>
                      </q-list>
                      <q-separator class="q-my-sm" />
                      <div class="row items-center">
                        <div class="text-subtitle2 text-weight-medium">Total</div>
                        <q-space />
                        <div class="text-subtitle2 text-weight-bold text-primary">
                          {{
                            formatCurrency(
                              selectedItemsTotal,
                              (selectedPlan?.currency as CurrencyCode) || 'USD',
                            )
                          }}
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>

                  <!-- Expense Date Selection -->
                  <q-input
                    v-model="form.expenseDate"
                    label="Expense Date *"
                    outlined
                    no-error-icon
                    :rules="[(val: string) => !!val || 'Date is required']"
                    class="q-mb-md"
                  >
                    <template #append>
                      <q-icon
                        name="eva-calendar-outline"
                        class="cursor-pointer"
                      >
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="form.expenseDate"
                            mask="YYYY-MM-DD"
                          >
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Cancel"
                                color="primary"
                                flat
                                no-caps
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-card-section>
              </div>
            </q-slide-transition>
          </q-tab-panel>

          <!-- Custom Entry Mode -->
          <q-tab-panel
            name="custom-entry"
            class="q-pa-none"
          >
            <q-card-section class="q-pt-md">
              <!-- Plan Selection (Custom Entry Mode) -->
              <q-select
                v-model="form.planId"
                :options="planOptions"
                option-label="label"
                option-value="value"
                label="Select Plan *"
                outlined
                emit-value
                map-options
                :readonly="!!props.defaultPlanId"
                :loading="plansStore.isLoading"
                :rules="[(val: string) => !!val || 'Plan is required']"
                @update:model-value="onPlanSelected"
                :class="didAutoSelectPlan && selectedPlan ? 'q-mb-none' : 'q-mb-md'"
                :display-value="planDisplayValue"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>
                        {{ formatDateRange(scope.opt.startDate, scope.opt.endDate) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip
                        :color="getStatusColor(scope.opt.status)"
                        text-color="white"
                        size="sm"
                      >
                        {{ scope.opt.status }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No plans available. Create a plan first.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Auto-selection hint -->
              <q-banner
                v-if="didAutoSelectPlan && selectedPlan"
                class="bg-blue-1 text-blue-8 q-mb-md"
                dense
              >
                <template #avatar>
                  <q-icon name="eva-info-outline" />
                </template>
                Most recently used plan selected.
              </q-banner>

              <!-- Category Selection -->
              <q-select
                v-model="form.categoryId"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                label="Select Category *"
                outlined
                emit-value
                map-options
                :disable="!selectedPlan"
                :readonly="!!props.defaultCategoryId"
                :rules="[(val: string) => !!val || 'Category is required']"
                class="q-mb-sm"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar
                        :style="{ backgroundColor: scope.opt.color }"
                        size="32px"
                        text-color="white"
                      >
                        <q-icon
                          :name="scope.opt.icon"
                          size="16px"
                        />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>
                        Budget:
                        {{
                          formatCurrency(
                            scope.opt.plannedAmount,
                            (selectedPlan?.currency || 'USD') as CurrencyCode,
                          )
                        }}
                        <span
                          v-if="scope.opt.remainingAmount !== undefined"
                          :class="
                            scope.opt.remainingAmount >= 0 ? 'text-positive' : 'text-negative'
                          "
                        >
                          • Remaining:
                          {{
                            formatCurrency(
                              scope.opt.remainingAmount,
                              (selectedPlan?.currency || 'USD') as CurrencyCode,
                            )
                          }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ selectedPlan ? 'No categories in selected plan' : 'Select a plan first' }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Expense Details -->
              <q-input
                v-model="form.name"
                label="Expense Name *"
                outlined
                no-error-icon
                :rules="nameRules"
                class="q-mb-sm"
              />

              <q-input
                v-model.number="form.amount"
                label="Amount *"
                type="number"
                step="0.01"
                min="0.01"
                outlined
                no-error-icon
                :rules="amountRules"
                :suffix="selectedPlan?.currency || ''"
                class="q-mb-sm"
              >
                <template #prepend>
                  <q-icon name="eva-credit-card-outline" />
                </template>
              </q-input>

              <q-input
                v-model="form.expenseDate"
                label="Expense Date *"
                outlined
                no-error-icon
                :rules="[(val: string) => !!val || 'Date is required']"
                class="q-mb-sm"
              >
                <template #append>
                  <q-icon
                    name="eva-calendar-outline"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="form.expenseDate"
                        mask="YYYY-MM-DD"
                      >
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Cancel"
                            color="primary"
                            flat
                            no-caps
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <!-- Budget Warning -->
              <q-banner
                v-if="budgetWarning"
                class="bg-orange-1 text-orange-8 q-mb-md"
              >
                <template #avatar>
                  <q-icon name="eva-alert-triangle-outline" />
                </template>
                {{ budgetWarning }}
              </q-banner>
            </q-card-section>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Fixed Footer Actions -->
        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            label="Cancel"
            flat
            no-caps
            @click="closeDialog"
            :disable="isLoading"
          />
          <q-btn
            v-if="showBackButton"
            label="Back"
            flat
            no-caps
            @click="goBackToSelection"
            :disable="isLoading"
            class="q-mr-sm"
          />
          <q-btn
            :label="getSubmitButtonLabel"
            type="submit"
            color="primary"
            unelevated
            no-caps
            :loading="isLoading"
            :disable="!canSubmit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useExpensesStore } from 'src/stores/expenses'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDateRange, getStatusColor, getPlanStatus } from 'src/utils/plans'
import { getPlanItems, updatePlanItemCompletion } from 'src/api/plans'
import PlanItemSelector from './PlanItemSelector.vue'
import type { QForm } from 'quasar'
import type { PlanItem } from 'src/api/plans'

const $q = useQuasar()

interface ExpenseRegistrationForm {
  planId: string | null
  categoryId: string | null
  name: string
  amount: number | null
  expenseDate: string
  planItemId: string | null
}

const props = defineProps<{
  modelValue: boolean
  defaultPlanId?: string | null
  defaultCategoryId?: string | null
  autoSelectRecentPlan?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'expense-created'): void
}>()

const expensesStore = useExpensesStore()
const plansStore = usePlansStore()
const categoriesStore = useCategoriesStore()
const notificationStore = useNotificationStore()

const formRef = ref<QForm>()
const planItemSelectorRef = ref()
const isLoading = ref(false)
const isLoadingPlanItems = ref(false)
const didAutoSelectPlan = ref(false)

// Mode state
const currentMode = ref<'quick-select' | 'custom-entry'>('quick-select')

// Quick select phase state
const quickSelectPhase = ref<'selection' | 'finalize'>('selection')

// Plan item tracking state
const planItems = ref<PlanItem[]>([])
const selectedPlanItems = ref<PlanItem[]>([])
const quickModeNote = ref('')

const form = ref<ExpenseRegistrationForm>({
  planId: null,
  categoryId: null,
  name: '',
  amount: null,
  expenseDate: new Date().toISOString().split('T')[0]!,
  planItemId: null,
})

const mostRecentlyUsedPlan = computed(() => {
  if (!plansStore.plansForExpenses.length) return null

  // Sort by updated_at descending (most recent first)
  const sortedPlans = [...plansStore.plansForExpenses].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
    return dateB - dateA
  })

  return sortedPlans[0] || null
})

const planOptions = computed(() => {
  return plansStore.plansForExpenses.map((plan) => ({
    label: plan.name,
    value: plan.id,
    status: getPlanStatus(plan),
    startDate: plan.start_date,
    endDate: plan.end_date,
    currency: plan.currency,
  }))
})

const selectedPlan = computed(() => {
  if (!form.value.planId) return null
  return plansStore.plans.find((p) => p.id === form.value.planId) || null
})

const planDisplayValue = computed(() => {
  const id = form.value.planId
  if (!id) return ''
  const plan = plansStore.plans.find((p) => p.id === id)
  return plan?.name || ''
})

const categoryOptions = computed(() => {
  if (!selectedPlan.value) return []

  const summary = expensesStore.expenseSummary

  return categoriesStore.categories
    .filter((category) => summary.some((s) => s.category_id === category.id))
    .map((category) => {
      const categoryData = summary.find((s) => s.category_id === category.id)
      const plannedAmount = categoryData?.planned_amount || 0
      const actualAmount = categoryData?.actual_amount || 0

      return {
        label: category.name,
        value: category.id,
        color: category.color,
        icon: category.icon,
        plannedAmount,
        actualAmount,
        remainingAmount: plannedAmount - actualAmount,
      }
    })
})

const selectedItemsTotal = computed(() => {
  return selectedPlanItems.value.reduce((total, item) => total + item.amount, 0)
})

const budgetWarning = computed(() => {
  if (!form.value.categoryId || !form.value.amount || !selectedPlan.value) return ''

  const category = categoryOptions.value.find((c) => c.value === form.value.categoryId)
  if (!category) return ''

  const newRemaining = category.remainingAmount - form.value.amount
  const currency = selectedPlan.value.currency as CurrencyCode

  if (newRemaining < 0) {
    return `This expense will exceed the category budget by ${formatCurrency(Math.abs(newRemaining), currency)}`
  }

  return ''
})

const nameRules = computed(() => [
  (val: string) => !!val?.trim() || 'Expense name is required',
  (val: string) => val.length <= 100 || 'Name must be 100 characters or less',
])

const amountRules = computed(() => [
  (val: number) => !!val || 'Amount is required',
  (val: number) => val > 0 || 'Amount must be greater than 0',
  (val: number) => val <= 999999.99 || 'Amount too large',
])

// New computed properties for dual mode support
const getSubmitButtonLabel = computed(() => {
  if (currentMode.value === 'quick-select') {
    if (quickSelectPhase.value === 'selection') {
      return 'Continue'
    }
    const count = selectedPlanItems.value.length
    return count > 0 ? `Register ${count} Item${count !== 1 ? 's' : ''}` : 'Register Items'
  }
  return 'Register Expense'
})

const canSubmit = computed(() => {
  if (currentMode.value === 'quick-select') {
    if (quickSelectPhase.value === 'selection') {
      return selectedPlanItems.value.length > 0
    }
    // In finalize phase, need items and date
    return selectedPlanItems.value.length > 0 && !!form.value.expenseDate
  }
  return !!form.value.planId && !!form.value.categoryId && !!form.value.name && !!form.value.amount
})

const showBackButton = computed(() => {
  return currentMode.value === 'quick-select' && quickSelectPhase.value === 'finalize'
})

async function onPlanSelected(planId: string | null) {
  form.value.categoryId = null
  selectedPlanItems.value = []
  planItems.value = []
  quickSelectPhase.value = 'selection' // Reset to selection phase

  if (planId) {
    await Promise.all([expensesStore.loadExpenseSummaryForPlan(planId), loadPlanItems(planId)])
  }

  // Clear plan item selector if it exists
  if (planItemSelectorRef.value?.clearSelection) {
    planItemSelectorRef.value.clearSelection()
  }
}

async function loadPlanItems(planId: string) {
  isLoadingPlanItems.value = true
  try {
    const items = await getPlanItems(planId)
    planItems.value = items.filter((item) => !(item.is_completed ?? false))
  } catch (error) {
    console.error('Error loading plan items:', error)
    notificationStore.showError('Failed to load plan items')
    planItems.value = []
  } finally {
    isLoadingPlanItems.value = false
  }
}

function onItemsSelected(items: PlanItem[]) {
  selectedPlanItems.value = items
}

function onSelectionChanged(items: PlanItem[]) {
  selectedPlanItems.value = items
}

function closeDialog() {
  emit('update:modelValue', false)
  resetForm()
}

function resetForm() {
  form.value = {
    planId: null,
    categoryId: null,
    name: '',
    amount: null,
    expenseDate: new Date().toISOString().split('T')[0]!,
    planItemId: null,
  }
  didAutoSelectPlan.value = false
  selectedPlanItems.value = []
  planItems.value = []
  quickModeNote.value = ''
  currentMode.value = 'quick-select'
  quickSelectPhase.value = 'selection'
}

function goBackToSelection() {
  quickSelectPhase.value = 'selection'
}

function proceedToFinalize() {
  if (selectedPlanItems.value.length === 0) {
    notificationStore.showError('Please select at least one item to continue')
    return
  }
  quickSelectPhase.value = 'finalize'
}

function removeSelectedItem(itemId: string) {
  // Remove from our local state
  selectedPlanItems.value = selectedPlanItems.value.filter((item) => item.id !== itemId)

  // Also update the PlanItemSelector component's selection
  if (planItemSelectorRef.value?.deselectItem) {
    planItemSelectorRef.value.deselectItem(itemId)
  }

  // If no items left, go back to selection phase
  if (selectedPlanItems.value.length === 0) {
    quickSelectPhase.value = 'selection'
    notificationStore.showInfo('All items removed. Please select items to continue.')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  // Handle Continue action in quick-select selection phase
  if (currentMode.value === 'quick-select' && quickSelectPhase.value === 'selection') {
    proceedToFinalize()
    return
  }

  isLoading.value = true

  try {
    if (currentMode.value === 'quick-select') {
      await handleQuickSelectSubmit()
    } else {
      await handleCustomEntrySubmit()
    }
  } finally {
    isLoading.value = false
  }
}

async function handleQuickSelectSubmit() {
  if (selectedPlanItems.value.length === 0) {
    notificationStore.showError('Please select at least one item')
    return
  }

  if (!form.value.expenseDate) {
    notificationStore.showError('Please select an expense date')
    return
  }

  try {
    // Create all expenses
    const expensePromises = selectedPlanItems.value.map(async (item) => {
      const expenseName = quickModeNote.value.trim()
        ? `${item.name} - ${quickModeNote.value.trim()}`
        : item.name

      return expensesStore.addExpense({
        plan_id: item.plan_id,
        category_id: item.category_id,
        name: expenseName,
        amount: item.amount, // Use full item amount since we don't track remaining amounts
        expense_date: form.value.expenseDate,
        plan_item_id: item.id,
      })
    })

    await Promise.all(expensePromises)

    // Mark all plan items as completed
    const completionPromises = selectedPlanItems.value.map(async (item) => {
      return updatePlanItemCompletion(item.id, true)
    })

    await Promise.all(completionPromises)

    const count = selectedPlanItems.value.length
    notificationStore.showSuccess(
      `${count} expense${count !== 1 ? 's' : ''} registered successfully!`,
    )

    emit('expense-created')
    closeDialog()
  } catch (error) {
    console.error('Error registering expenses:', error)
    notificationStore.showError('Failed to register expenses. Please try again.')
  }
}

async function handleCustomEntrySubmit() {
  if (!formRef.value) return

  const isValid = await formRef.value.validate()
  if (!isValid) {
    notificationStore.showError('Please fix the form errors before submitting')
    return
  }

  if (!form.value.planId || !form.value.categoryId || !form.value.amount) {
    notificationStore.showError('Please fill in all required fields')
    return
  }

  try {
    await expensesStore.addExpense({
      plan_id: form.value.planId,
      category_id: form.value.categoryId,
      name: form.value.name.trim(),
      amount: form.value.amount,
      expense_date: form.value.expenseDate,
      plan_item_id: form.value.planItemId || null,
    })

    // If this expense is linked to a plan item, mark it as completed
    if (form.value.planItemId) {
      await updatePlanItemCompletion(form.value.planItemId, true)
    }

    notificationStore.showSuccess('Expense registered successfully!')
    emit('expense-created')
    closeDialog()
  } catch (error) {
    console.error('Error registering expense:', error)
    notificationStore.showError('Failed to register expense. Please try again.')
  }
}

watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      await Promise.all([plansStore.loadPlans(), categoriesStore.loadCategories()])
      resetForm()

      // Handle explicit defaultPlanId prop (takes priority)
      if (props.defaultPlanId) {
        form.value.planId = props.defaultPlanId
        await Promise.all([
          expensesStore.loadExpenseSummaryForPlan(props.defaultPlanId),
          loadPlanItems(props.defaultPlanId),
        ])
      }
      // Handle auto-selection of most recent plan when enabled
      else if (props.autoSelectRecentPlan && mostRecentlyUsedPlan.value) {
        form.value.planId = mostRecentlyUsedPlan.value.id
        didAutoSelectPlan.value = true
        await Promise.all([
          expensesStore.loadExpenseSummaryForPlan(mostRecentlyUsedPlan.value.id),
          loadPlanItems(mostRecentlyUsedPlan.value.id),
        ])
      }

      if (props.defaultCategoryId && form.value.planId) {
        const categoryExists = categoryOptions.value.some(
          (c) => c.value === props.defaultCategoryId,
        )
        if (categoryExists) {
          form.value.categoryId = props.defaultCategoryId
        }
      }

      // Default to quick select mode if items exist, otherwise custom entry
      if (props.defaultPlanId || (props.autoSelectRecentPlan && mostRecentlyUsedPlan.value)) {
        // Wait a bit for plan items to load
        setTimeout(() => {
          currentMode.value = planItems.value.length > 0 ? 'quick-select' : 'custom-entry'
          // Always start in selection phase for quick-select mode
          if (currentMode.value === 'quick-select') {
            quickSelectPhase.value = 'selection'
          }
        }, 100)
      }
    }
  },
)
</script>
