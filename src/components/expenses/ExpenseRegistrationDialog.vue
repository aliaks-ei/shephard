<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="column"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon
            name="eva-plus-circle-outline"
            class="q-mr-sm"
          />
          Register New Expense
        </div>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <q-form
        class="column"
        style="flex-grow: 1"
        ref="formRef"
        @submit="handleSubmit"
      >
        <q-card-section class="q-pt-md col overflow-auto">
          <!-- Plan Selection -->
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
            data-testid="auto-select-banner"
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
                      :class="scope.opt.remainingAmount >= 0 ? 'text-positive' : 'text-negative'"
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

        <q-card-actions
          align="right"
          class="q-pa-md q-mt-auto"
        >
          <q-btn
            label="Cancel"
            flat
            no-caps
            @click="closeDialog"
            :disable="isLoading"
          />
          <q-btn
            label="Register Expense"
            type="submit"
            color="primary"
            unelevated
            no-caps
            :loading="isLoading"
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
import { formatDateRange, getStatusColor } from 'src/utils/plans'
import type { QForm } from 'quasar'

const $q = useQuasar()

interface ExpenseRegistrationForm {
  planId: string | null
  categoryId: string | null
  name: string
  amount: number | null
  expenseDate: string
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
const isLoading = ref(false)
const didAutoSelectPlan = ref(false)

const form = ref<ExpenseRegistrationForm>({
  planId: null,
  categoryId: null,
  name: '',
  amount: null,
  expenseDate: new Date().toISOString().split('T')[0]!,
})

const mostRecentlyUsedPlan = computed(() => {
  if (!plansStore.activePlans.length) return null

  // Sort by updated_at descending (most recent first)
  const sortedPlans = [...plansStore.activePlans].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
    return dateB - dateA
  })

  return sortedPlans[0] || null
})

const planOptions = computed(() => {
  return plansStore.activePlans.map((plan) => ({
    label: plan.name,
    value: plan.id,
    status: plan.status,
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
      return {
        label: category.name,
        value: category.id,
        color: category.color,
        icon: category.icon,
        plannedAmount: categoryData?.planned_amount || 0,
        actualAmount: categoryData?.actual_amount || 0,
        remainingAmount: categoryData?.remaining_amount || 0,
      }
    })
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

  if (newRemaining < category.plannedAmount * 0.1) {
    return `This expense will leave only ${formatCurrency(newRemaining, currency)} remaining in this category`
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

async function onPlanSelected(planId: string | null) {
  form.value.categoryId = null

  if (planId) {
    await expensesStore.loadExpenseSummaryForPlan(planId)
  }
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
  }
  didAutoSelectPlan.value = false
}

async function handleSubmit() {
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

  isLoading.value = true

  try {
    await expensesStore.addExpense({
      plan_id: form.value.planId,
      category_id: form.value.categoryId,
      name: form.value.name.trim(),
      amount: form.value.amount,
      expense_date: form.value.expenseDate,
    })

    notificationStore.showSuccess('Expense registered successfully!')
    emit('expense-created')
    closeDialog()
  } finally {
    isLoading.value = false
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
        await expensesStore.loadExpenseSummaryForPlan(props.defaultPlanId)
      }
      // Handle auto-selection of most recent plan when enabled
      else if (props.autoSelectRecentPlan && mostRecentlyUsedPlan.value) {
        form.value.planId = mostRecentlyUsedPlan.value.id
        didAutoSelectPlan.value = true
        await expensesStore.loadExpenseSummaryForPlan(mostRecentlyUsedPlan.value.id)
      }

      if (props.defaultCategoryId && form.value.planId) {
        const categoryExists = categoryOptions.value.some(
          (c) => c.value === props.defaultCategoryId,
        )
        if (categoryExists) {
          form.value.categoryId = props.defaultCategoryId
        }
      }
    }
  },
)
</script>
