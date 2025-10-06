<template>
  <q-card-section class="q-pt-md">
    <!-- Plan Selection -->
    <PlanSelectorField
      v-model="localPlanId"
      :plan-options="planOptions"
      :readonly="readonly ?? false"
      :loading="loading ?? false"
      :show-auto-select-banner="(showAutoSelectBanner ?? false) && !!selectedPlan"
      :additional-class="(showAutoSelectBanner ?? false) && selectedPlan ? 'q-mb-none' : 'q-mb-md'"
      :display-value="planDisplayValue"
      @plan-selected="handlePlanSelected"
    />

    <!-- Category Selection -->
    <q-select
      :model-value="categoryId"
      :options="categoryOptions"
      option-label="label"
      option-value="value"
      label="Select Category *"
      outlined
      emit-value
      map-options
      :disable="!selectedPlan"
      :readonly="!!defaultCategoryId"
      :rules="[(val: string) => !!val || 'Category is required']"
      class="q-mb-sm"
      @update:model-value="handleUpdateCategoryId"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar>
            <CategoryIcon
              :color="scope.opt.color"
              :icon="scope.opt.icon"
              size="sm"
            />
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
      :model-value="name"
      label="Expense Name *"
      outlined
      no-error-icon
      :rules="nameRules"
      class="q-mb-sm"
      @update:model-value="handleUpdateName"
    />

    <q-input
      :model-value="amount"
      label="Amount *"
      type="number"
      step="0.01"
      min="0.01"
      outlined
      no-error-icon
      :rules="amountRules"
      :suffix="selectedPlan?.currency || ''"
      class="q-mb-sm"
      @update:model-value="handleUpdateAmount"
    >
      <template #prepend>
        <q-icon name="eva-credit-card-outline" />
      </template>
    </q-input>

    <q-input
      :model-value="expenseDate"
      label="Expense Date *"
      outlined
      no-error-icon
      :rules="[(val: string) => !!val || 'Date is required']"
      class="q-mb-sm"
      @update:model-value="handleUpdateExpenseDate"
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
              :model-value="expenseDate"
              mask="YYYY-MM-DD"
              @update:model-value="handleUpdateExpenseDate"
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
      dense
      rounded
    >
      <template #avatar>
        <q-icon name="eva-alert-triangle-outline" />
      </template>
      {{ budgetWarning }}
    </q-banner>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PlanSelectorField, { type PlanOption } from './PlanSelectorField.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'

interface Plan {
  id: string
  name: string
  currency: string | null
}

interface CategoryOption {
  label: string
  value: string
  color: string
  icon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
}

interface Props {
  planId: string | null
  selectedPlan: Plan | null
  planOptions: PlanOption[]
  planDisplayValue: string
  categoryId: string | null
  categoryOptions: CategoryOption[]
  name: string
  amount: number | null
  expenseDate: string
  budgetWarning: string
  nameRules: ((val: string) => boolean | string)[]
  amountRules: ((val: number) => boolean | string)[]
  readonly?: boolean
  loading?: boolean
  showAutoSelectBanner?: boolean
  defaultCategoryId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false,
  showAutoSelectBanner: false,
  defaultCategoryId: null,
})

const emit = defineEmits<{
  (e: 'update:planId', value: string | null): void
  (e: 'update:categoryId', value: string | null): void
  (e: 'update:name', value: string): void
  (e: 'update:amount', value: number | null): void
  (e: 'update:expenseDate', value: string): void
  (e: 'plan-selected', value: string | null): void
}>()

const localPlanId = computed({
  get: () => props.planId,
  set: (value: string | null) => emit('update:planId', value),
})

const handlePlanSelected = (planId: string | null) => {
  emit('plan-selected', planId)
}

const handleUpdateCategoryId = (value: string | null) => {
  emit('update:categoryId', value)
}

const handleUpdateName = (value: string | number | null) => {
  emit('update:name', String(value || ''))
}

const handleUpdateAmount = (value: number | string | null) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  emit('update:amount', numValue)
}

const handleUpdateExpenseDate = (value: string | number | null) => {
  emit('update:expenseDate', String(value || ''))
}
</script>
