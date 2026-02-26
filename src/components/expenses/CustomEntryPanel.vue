<template>
  <q-card-section class="q-pt-md">
    <ExpensePhotoAnalysisSection
      ref="photoAnalysisSectionRef"
      :plan-id="planId"
      :selected-plan-currency="selectedPlan?.currency ?? null"
      :default-category-id="defaultCategoryId ?? null"
      @analysis-applied="handlePhotoAnalysisApplied"
    />

    <!-- Plan Selection -->
    <PlanSelectorField
      v-model="localPlanId"
      :plan-options="planOptions"
      :readonly="readonly ?? false"
      :loading="loading ?? false"
      :show-auto-select-hint="(showAutoSelectHint ?? false) && !!selectedPlan"
      class="q-mb-md"
      :display-value="planDisplayValue"
      @plan-selected="handlePlanSelected"
    />

    <!-- Expense Name -->
    <label
      class="q-mb-sm block"
      for="expense-name-input"
    >
      <span class="form-label form-label--required">Expense Name</span>
      <q-input
        id="expense-name-input"
        :model-value="name"
        placeholder="e.g., Grocery shopping"
        outlined
        dense
        no-error-icon
        inputmode="text"
        :rules="nameRules"
        :disable="!selectedPlan"
        hide-bottom-space
        @update:model-value="handleUpdateName"
      />
    </label>

    <ExpenseAmountCurrencyFields
      :display-amount="displayAmount"
      :amount-rules="amountRules"
      :selected-currency="selectedCurrency"
      :currency-options="currencyOptions"
      :disable="!selectedPlan"
      :should-show-conversion="shouldShowConversion"
      :is-converting="isConverting"
      :has-conversion-error="hasConversionError"
      :conversion-error="conversionError ?? ''"
      :conversion-result="conversionResult"
      :converted-amount-display="convertedAmountDisplay"
      @update:amount="handleUpdateAmount"
      @update:currency="selectedCurrency = $event"
    />

    <!-- Category Selection -->
    <div class="column q-mb-sm">
      <label
        class="block"
        for="expense-category-input"
      >
        <span class="form-label form-label--required">Category</span>
        <q-select
          id="expense-category-input"
          :model-value="categoryId"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          outlined
          dense
          emit-value
          map-options
          :disable="!selectedPlan"
          :readonly="!!defaultCategoryId"
          :rules="[(val: string) => !!val || 'Category is required']"
          :hint="
            aiCategorization.isCategorizing.value
              ? 'AI is analyzing the expense name...'
              : isAiSelected
                ? 'Category selected by AI'
                : undefined
          "
          :hide-bottom-space="!aiCategorization.isCategorizing.value && !isAiSelected"
          @update:model-value="handleUpdateCategoryId"
        >
          <template
            v-if="categoryId && selectedCategoryOption"
            #prepend
          >
            <CategoryIcon
              :color="selectedCategoryOption.color"
              :icon="selectedCategoryOption.icon"
              size="xs"
            />
          </template>
          <template #append>
            <q-spinner
              v-if="aiCategorization.isCategorizing.value"
              color="primary"
              size="20px"
              class="q-mr-xs"
            />
            <q-chip
              v-else-if="isAiSelected"
              size="sm"
              color="blue-1"
              text-color="blue-9"
              icon="eva-bulb-outline"
              class="q-mr-xs"
            >
              AI
            </q-chip>
          </template>
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
                    • Still to pay:
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
      </label>

      <!-- AI Suggestion Banner (Low Confidence) -->
      <q-banner
        v-if="aiCategorization.lowConfidenceSuggestion.value && !isAiSelected"
        class="bg-blue-1 text-blue-9 q-mb-md"
        dense
        rounded
      >
        <template #avatar>
          <q-icon
            name="eva-bulb-outline"
            color="blue-9"
          />
        </template>
        <div class="column">
          <div class="col">
            AI suggests:
            <strong>{{ aiCategorization.lowConfidenceSuggestion.value.categoryName }}</strong>
            <div class="text-caption">
              {{ aiCategorization.lowConfidenceSuggestion.value.reasoning }}
            </div>
          </div>
          <q-btn
            label="Apply"
            color="blue-9"
            class="self-end"
            flat
            dense
            no-caps
            @click="applyLowConfidenceSuggestion"
          />
        </div>
      </q-banner>
    </div>

    <ExpenseDateField
      :expense-date="expenseDate"
      @update:expense-date="handleUpdateExpenseDate"
    />

    <!-- Budget Impact Display -->
    <BudgetImpactCard
      v-if="categoryId && effectiveAmount && effectiveAmount > 0 && selectedCategoryOption"
      :category-id="categoryId"
      :amount="effectiveAmount"
      :currency="(selectedPlan?.currency as CurrencyCode) ?? null"
      :category-option="selectedCategoryOption ?? null"
    />
  </q-card-section>
</template>

<script setup lang="ts">
import { computed, watch, ref, toRef, watchEffect, defineAsyncComponent } from 'vue'
import PlanSelectorField, { type PlanOption } from './PlanSelectorField.vue'
import ExpenseAmountCurrencyFields from './ExpenseAmountCurrencyFields.vue'
import ExpenseDateField from './ExpenseDateField.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import BudgetImpactCard from './BudgetImpactCard.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { parseDecimalInput } from 'src/utils/decimal'
import { useAICategorization } from 'src/composables/useAICategorization'
import { useCurrencyConversion } from 'src/composables/useCurrencyConversion'

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
  currency: string | null
  expenseDate: string
  nameRules: ((val: string) => boolean | string)[]
  amountRules: ((val: number) => boolean | string)[]
  readonly?: boolean
  loading?: boolean
  showAutoSelectHint?: boolean
  defaultCategoryId?: string | null
  defaultExpenseCurrency?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false,
  showAutoSelectHint: false,
  defaultCategoryId: null,
})

const emit = defineEmits<{
  (e: 'update:planId', value: string | null): void
  (e: 'update:categoryId', value: string | null): void
  (e: 'update:name', value: string): void
  (e: 'update:amount', value: number | null): void
  (e: 'update:currency', value: string | null): void
  (e: 'update:expenseDate', value: string): void
  (e: 'plan-selected', value: string | null): void
}>()

const ExpensePhotoAnalysisSection = defineAsyncComponent(
  () => import('./ExpensePhotoAnalysisSection.vue'),
)

const photoAnalysisSectionRef = ref<{ reset: () => void } | null>(null)
const planIdRef = toRef(props, 'planId')

const aiCategorization = useAICategorization(planIdRef)
const aiSelectedCategoryId = ref<string | null>(null)

const {
  convertWithDebounce,
  conversionResult,
  isConverting,
  hasConversionError,
  conversionError,
  reset: resetConversion,
} = useCurrencyConversion()

const selectedCurrency = computed({
  get: () =>
    props.currency ||
    props.defaultExpenseCurrency ||
    (props.selectedPlan?.currency as CurrencyCode) ||
    'EUR',
  set: (value: string) => emit('update:currency', value),
})

const currencyOptions = [
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
  { label: 'GBP', value: 'GBP' },
  { label: 'JPY', value: 'JPY' },
]

const shouldShowConversion = computed(() => {
  return Boolean(
    props.selectedPlan &&
      props.amount !== null &&
      props.amount > 0 &&
      selectedCurrency.value !== (props.selectedPlan.currency as CurrencyCode),
  )
})

const effectiveAmount = computed(() => {
  if (conversionResult.value && shouldShowConversion.value) {
    return conversionResult.value.convertedAmount
  }
  return props.amount
})

watchEffect(() => {
  if (shouldShowConversion.value && props.selectedPlan) {
    convertWithDebounce(
      selectedCurrency.value as CurrencyCode,
      props.selectedPlan.currency as CurrencyCode,
      props.amount!,
    )
  } else {
    resetConversion()
  }
})

const localPlanId = computed({
  get: () => props.planId,
  set: (value: string | null) => emit('update:planId', value),
})

const isAiSelected = computed(() => {
  return aiSelectedCategoryId.value === props.categoryId && !!props.categoryId
})

const selectedCategoryOption = computed(() => {
  return props.categoryOptions.find((opt) => opt.value === props.categoryId)
})

function handlePhotoAnalysisApplied(result: {
  expenseName: string
  amount: number
  categoryId: string | null
}) {
  emit('update:name', result.expenseName)
  emit('update:amount', result.amount)
  if (result.categoryId) {
    emit('update:categoryId', result.categoryId)
    aiSelectedCategoryId.value = result.categoryId
  }
}

const handlePlanSelected = (planId: string | null) => {
  aiCategorization.clearSuggestion()
  aiSelectedCategoryId.value = null
  photoAnalysisSectionRef.value?.reset()
  emit('plan-selected', planId)
}

const handleUpdateCategoryId = (value: string | null) => {
  if (value !== aiSelectedCategoryId.value) {
    aiSelectedCategoryId.value = null
  }
  emit('update:categoryId', value)
}

function applyLowConfidenceSuggestion() {
  const suggestion = aiCategorization.lowConfidenceSuggestion.value
  if (suggestion) {
    aiSelectedCategoryId.value = suggestion.categoryId
    emit('update:categoryId', suggestion.categoryId)
    aiCategorization.clearSuggestion()
  }
}

async function handleUpdateName(value: string | number | null) {
  const nameValue = String(value || '')
  emit('update:name', nameValue)

  // Skip AI categorization if category is preselected
  if (props.defaultCategoryId) {
    return
  }

  if (!props.selectedPlan || nameValue.trim().length < 3) {
    aiCategorization.clearSuggestion()
    return
  }

  const suggestion = await aiCategorization.debouncedCategorize(nameValue)

  if (suggestion && suggestion.confidence > 0.5) {
    aiSelectedCategoryId.value = suggestion.categoryId
    emit('update:categoryId', suggestion.categoryId)
  }
}

const displayAmount = computed(() => {
  return props.amount !== null ? props.amount : ''
})

const convertedAmountDisplay = computed(() => {
  if (!conversionResult.value || !props.selectedPlan?.currency) {
    return ''
  }

  return formatCurrency(
    conversionResult.value.convertedAmount,
    props.selectedPlan.currency as CurrencyCode,
  )
})

const handleUpdateAmount = (value: number | string | null) => {
  const numValue = parseDecimalInput(value)
  emit('update:amount', numValue)
}

const handleUpdateExpenseDate = (value: string | number | null) => {
  emit('update:expenseDate', String(value || ''))
}

watch(
  () => props.planId,
  () => {
    aiCategorization.clearSuggestion()
    aiSelectedCategoryId.value = null
    photoAnalysisSectionRef.value?.reset()
  },
)
</script>
