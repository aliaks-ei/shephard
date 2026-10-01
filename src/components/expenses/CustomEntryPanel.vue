<template>
  <q-card-section class="q-pt-none">
    <ExpenseAmountCurrencyFields
      :display-amount="displayAmount"
      :amount-rules="amountRules"
      :selected-currency="selectedCurrency"
      :currency-options="currencyOptions"
      :disable="loading ?? false"
      :should-show-conversion="shouldShowConversion"
      :is-converting="isConverting"
      :has-conversion-error="hasConversionError"
      :conversion-error="conversionError ?? ''"
      :conversion-result="conversionResult"
      :converted-amount-display="convertedAmountDisplay"
      autofocus
      @update:amount="handleUpdateAmount"
      @update:currency="selectedCurrency = $event"
    />

    <label
      class="q-mb-sm block"
      for="expense-name-input"
    >
      <span class="form-label form-label--required">What was it?</span>
      <q-input
        for="expense-name-input"
        :model-value="name"
        placeholder="e.g. Lunch at a cafe"
        outlined
        dense
        no-error-icon
        inputmode="text"
        :rules="nameRules"
        :disable="loading ?? false"
        hide-bottom-space
        @update:model-value="handleUpdateName"
      >
        <template #append>
          <q-btn
            flat
            round
            dense
            icon="eva-camera-outline"
            aria-label="Scan receipt"
            aria-controls="receipt-photo-panel"
            :aria-expanded="String(isReceiptOpen)"
            :color="isReceiptOpen ? 'primary' : undefined"
            :disable="loading ?? false"
            class="expense-name__scan"
            @click="toggleReceipt"
          />
        </template>
      </q-input>
    </label>

    <ExpensePhotoAnalysisSection
      ref="photoAnalysisSectionRef"
      v-model:open="isReceiptOpen"
      :plan-id="planId"
      :selected-plan-currency="selectedPlan?.currency ?? null"
      :default-category-id="defaultCategoryId ?? null"
      @analysis-applied="handlePhotoAnalysisApplied"
    />

    <label
      class="q-mt-md q-mb-sm block"
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
        options-dense
        map-options
        no-error-icon
        :disable="!selectedPlan || isLoadingCategories || (loading ?? false)"
        :loading="isLoadingCategories || aiCategorization.isCategorizing.value"
        :readonly="!!defaultCategoryId"
        :rules="[(val: string) => !!val || 'Choose a category']"
        :hint="categoryHint"
        :hide-bottom-space="!categoryHint"
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
        <template #option="scope">
          <q-item
            v-bind="scope.itemProps"
            class="q-py-xs q-px-md"
          >
            <q-item-section avatar>
              <CategoryIcon
                :color="scope.opt.color"
                :icon="scope.opt.icon"
                size="sm"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
              <q-item-label
                v-if="selectedPlan?.currency"
                caption
                class="text-amount"
                :class="{ 'text-over': isCategoryOver(scope.opt) }"
              >
                {{ categoryBalanceLabel(scope.opt) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item class="q-py-xs q-px-md">
            <q-item-section class="text-muted">
              {{
                isLoadingCategories
                  ? 'Loading categories...'
                  : selectedPlan
                    ? 'No categories in selected plan'
                    : 'Select a plan first'
              }}
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </label>

    <PlanSelectorField
      v-model="localPlanId"
      :plan-options="planOptions"
      :readonly="readonly ?? false"
      :loading="loading ?? false"
      :show-auto-select-hint="(showAutoSelectHint ?? false) && !!selectedPlan"
      class="q-mt-md q-mb-md"
      :display-value="planDisplayValue"
      @plan-selected="handlePlanSelected"
    />

    <BudgetImpactCard
      v-if="!loading && categoryId && selectedCategoryOption"
      :category-id="categoryId"
      :amount="effectiveAmount"
      :currency="(selectedPlan?.currency as CurrencyCode) ?? null"
      :category-option="selectedCategoryOption ?? null"
    />
  </q-card-section>
</template>

<script setup lang="ts">
import { computed, watch, ref, toRef, watchEffect, defineAsyncComponent } from 'vue'
import PlanSelectorField from './PlanSelectorField.vue'
import type { PlanOption } from 'src/types'
import ExpenseAmountCurrencyFields from './ExpenseAmountCurrencyFields.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import BudgetImpactCard from './BudgetImpactCard.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { parseDecimalInput } from 'src/utils/decimal'
import { useAICategorization } from 'src/composables/useAICategorization'
import { useCurrencyConversion } from 'src/composables/useCurrencyConversion'

type Plan = {
  id: string
  name: string
  currency: string | null
}

type CategoryOption = {
  label: string
  value: string
  color: string
  icon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
}

type Props = {
  planId: string | null
  selectedPlan: Plan | null
  planOptions: PlanOption[]
  planDisplayValue: string
  categoryId: string | null
  categoryOptions: CategoryOption[]
  name: string
  amount: number | null
  currency: string | null
  nameRules: ((val: string) => boolean | string)[]
  amountRules: ((val: number) => boolean | string)[]
  readonly?: boolean
  loading?: boolean
  isLoadingCategories?: boolean
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
  'update:planId': [value: string | null]
  'update:categoryId': [value: string | null]
  'update:name': [value: string]
  'update:amount': [value: number | null]
  'update:currency': [value: string | null]
  'plan-selected': [value: string | null]
}>()

const ExpensePhotoAnalysisSection = defineAsyncComponent(
  () => import('./ExpensePhotoAnalysisSection.vue'),
)

const photoAnalysisSectionRef = ref<{ reset: () => void } | null>(null)
const isReceiptOpen = ref(false)

function toggleReceipt() {
  isReceiptOpen.value = !isReceiptOpen.value
}

const planIdRef = toRef(props, 'planId')

const aiCategorization = useAICategorization(planIdRef)
const aiSelectedCategoryId = ref<string | null>(null)
const latestExpenseName = ref(props.name)
const pendingCategorizationName = ref<string | null>(null)

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

const isLoadingCategories = computed(() => props.isLoadingCategories ?? false)
const canCategorize = computed(
  () =>
    Boolean(props.selectedPlan) && !isLoadingCategories.value && props.categoryOptions.length > 0,
)

const categoryHint = computed(() => {
  if (isLoadingCategories.value) {
    return 'Loading categories...'
  }

  if (props.selectedPlan && props.categoryOptions.length === 0) {
    return 'No categories are available in this plan'
  }

  return undefined
})

const selectedCategoryOption = computed(() => {
  return props.categoryOptions.find((opt) => opt.value === props.categoryId)
})

const planCurrency = computed(() => (props.selectedPlan?.currency ?? 'EUR') as CurrencyCode)

// Over is spent vs planned: remainingAmount counts only unpaid fixed items
function isCategoryOver(option: CategoryOption): boolean {
  return option.actualAmount > option.plannedAmount
}

function categoryBalanceLabel(option: CategoryOption): string {
  if (isCategoryOver(option)) {
    return `${formatCurrency(option.actualAmount - option.plannedAmount, planCurrency.value)} over`
  }
  return `${formatCurrency(Math.max(option.remainingAmount, 0), planCurrency.value)} left`
}

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
  pendingCategorizationName.value =
    latestExpenseName.value.trim().length >= 3 ? latestExpenseName.value : null
  photoAnalysisSectionRef.value?.reset()
  emit('plan-selected', planId)
}

const handleUpdateCategoryId = (value: string | null) => {
  aiCategorization.clearSuggestion()
  pendingCategorizationName.value = null
  if (value !== aiSelectedCategoryId.value) {
    aiSelectedCategoryId.value = null
  }
  emit('update:categoryId', value)
}

async function runCategorization(expenseName: string): Promise<void> {
  if (
    !canCategorize.value ||
    props.defaultCategoryId ||
    expenseName !== latestExpenseName.value ||
    expenseName.trim().length < 3
  ) {
    return
  }

  pendingCategorizationName.value = null
  const result = await aiCategorization.debouncedCategorize(expenseName)

  if (!result || result.status !== 'selected' || expenseName !== latestExpenseName.value) {
    return
  }

  // Apply the detected category silently; the user can still change it
  const suggestion = result.suggestion
  if (props.categoryOptions.some((option) => option.value === suggestion.categoryId)) {
    aiSelectedCategoryId.value = suggestion.categoryId
    emit('update:categoryId', suggestion.categoryId)
  }
}

async function handleUpdateName(value: string | number | null) {
  const nameValue = String(value || '')
  latestExpenseName.value = nameValue
  emit('update:name', nameValue)

  // Skip AI categorization if category is preselected
  if (props.defaultCategoryId) {
    return
  }

  aiCategorization.clearSuggestion()
  pendingCategorizationName.value = null

  if (isAiSelected.value) {
    aiSelectedCategoryId.value = null
    emit('update:categoryId', null)
  }

  if (!props.selectedPlan || nameValue.trim().length < 3) {
    return
  }

  pendingCategorizationName.value = nameValue

  if (canCategorize.value) {
    await runCategorization(nameValue)
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

watch([() => props.planId, canCategorize], ([planId, ready], [previousPlanId]) => {
  if (planId !== previousPlanId) {
    aiCategorization.clearSuggestion()
    aiSelectedCategoryId.value = null
    pendingCategorizationName.value =
      latestExpenseName.value.trim().length >= 3 ? latestExpenseName.value : null
    photoAnalysisSectionRef.value?.reset()
  }

  if (ready && pendingCategorizationName.value) {
    void runCategorization(pendingCategorizationName.value)
  }
})
</script>

<style lang="scss" scoped>
.expense-name__scan {
  min-width: 36px;
  min-height: 36px;
}
</style>
