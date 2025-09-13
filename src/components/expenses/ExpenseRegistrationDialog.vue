<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
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
        ref="formRef"
        @submit="handleSubmit"
      >
        <q-card-section class="q-pt-md">
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
            :rules="[(val) => !!val || 'Plan is required']"
            @update:model-value="onPlanSelected"
            class="q-mb-md"
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
            :loading="!selectedPlan"
            :disable="!selectedPlan"
            :readonly="!!props.defaultCategoryId"
            :rules="[(val) => !!val || 'Category is required']"
            class="q-mb-md"
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
            :rules="nameRules"
            class="q-mb-md"
          />

          <q-input
            v-model.number="form.amount"
            label="Amount *"
            type="number"
            step="0.01"
            min="0.01"
            outlined
            :rules="amountRules"
            :suffix="selectedPlan?.currency || ''"
            class="q-mb-md"
          >
            <template #prepend>
              <q-icon name="eva-credit-card-outline" />
            </template>
          </q-input>

          <q-input
            v-model="form.description"
            label="Description (Optional)"
            type="textarea"
            outlined
            rows="2"
            maxlength="500"
            class="q-mb-md"
          />

          <q-input
            v-model="form.expenseDate"
            label="Expense Date *"
            outlined
            :rules="[(val) => !!val || 'Date is required']"
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
                        label="Close"
                        color="primary"
                        flat
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
          class="q-pa-md"
        >
          <q-btn
            label="Cancel"
            flat
            @click="closeDialog"
            :disable="isLoading"
          />
          <q-btn
            label="Register Expense"
            type="submit"
            color="primary"
            unelevated
            :loading="isLoading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useExpensesStore } from 'src/stores/expenses'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDateRange, getStatusColor } from 'src/utils/plans'
import type { QForm } from 'quasar'

interface ExpenseRegistrationForm {
  planId: string | null
  categoryId: string | null
  name: string
  amount: number | null
  description: string | null
  expenseDate: string
}

const props = defineProps<{
  modelValue: boolean
  defaultPlanId?: string | null
  defaultCategoryId?: string | null
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

const form = ref<ExpenseRegistrationForm>({
  planId: null,
  categoryId: null,
  name: '',
  amount: null,
  description: '',
  expenseDate: new Date().toISOString().split('T')[0]!,
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
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]!,
  }
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
      description: form.value.description?.trim() ?? '',
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

      // Preselect plan if provided
      if (props.defaultPlanId) {
        form.value.planId = props.defaultPlanId
        await expensesStore.loadExpenseSummaryForPlan(props.defaultPlanId)
      }

      // Preselect category if provided and plan is set
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
