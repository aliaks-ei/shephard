<template>
  <q-card-section class="q-pt-md">
    <!-- Photo Upload Section -->
    <div class="q-mb-md">
      <q-uploader
        ref="uploaderRef"
        label="Upload Receipt Photo"
        accept="image/jpeg,image/png,image/webp,image/heic"
        :max-file-size="5242880"
        :multiple="false"
        :auto-upload="false"
        color="primary"
        class="full-width"
        flat
        bordered
        @added="handlePhotoAdded"
        @removed="handlePhotoRemoved"
      />

      <!-- Analysis Status -->
      <div
        v-if="photoAnalysis.isAnalyzing.value"
        class="q-mt-sm q-pa-md text-center"
      >
        <q-spinner
          color="primary"
          size="32px"
        />
        <div class="text-body2 q-mt-sm">Analyzing photo...</div>
      </div>

      <!-- Analysis Results -->
      <div
        v-else-if="photoAnalysis.hasPhoto.value && photoAnalysis.analysisResult.value"
        class="q-mt-sm"
      >
        <div class="row items-center justify-between q-px-sm">
          <div class="text-caption text-positive">
            <q-icon
              name="eva-checkmark-circle-outline"
              size="18px"
              class="q-mr-xs"
            />
            Analysis complete ({{
              Math.round(photoAnalysis.analysisResult.value.confidence * 100)
            }}% confidence)
          </div>
          <q-btn
            label="Re-analyze"
            color="primary"
            flat
            dense
            no-caps
            size="sm"
            @click="photoAnalysis.analyzePhoto()"
          />
        </div>
      </div>

      <!-- Low Confidence Warning -->
      <q-banner
        v-if="photoAnalysis.hasError.value"
        class="bg-orange-1 text-orange-9 q-mt-sm"
        dense
      >
        <template #avatar>
          <q-icon
            name="eva-alert-triangle-outline"
            color="orange-9"
          />
        </template>
        {{ photoAnalysis.errorMessage.value }}
      </q-banner>

      <p class="text-caption text-grey-7 q-mt-sm q-mb-none text-center">
        Supports JPEG, PNG, WebP, HEIC • Max 5MB
      </p>
    </div>

    <!-- Divider with "OR" -->
    <div class="row items-center q-mb-md">
      <q-separator class="col" />
      <span class="q-mx-md text-grey-6 text-caption text-weight-medium"> OR ENTER MANUALLY </span>
      <q-separator class="col" />
    </div>

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

    <!-- Amount and Currency Row -->
    <div class="row q-col-gutter-sm q-mb-sm">
      <!-- Expense Amount -->
      <label
        class="col block"
        for="expense-amount-input"
      >
        <span class="form-label form-label--required">Amount</span>
        <q-input
          id="expense-amount-input"
          :model-value="displayAmount"
          placeholder="0.00"
          type="text"
          outlined
          dense
          no-error-icon
          inputmode="decimal"
          hide-bottom-space
          :rules="amountRules"
          :disable="!selectedPlan"
          @update:model-value="handleUpdateAmount"
        />
      </label>

      <!-- Currency Selection -->
      <label
        class="col-auto block"
        for="expense-currency-input"
      >
        <span class="form-label">Currency</span>
        <q-select
          v-model="selectedCurrency"
          id="expense-currency-input"
          :options="currencyOptions"
          outlined
          dense
          no-error-icon
          emit-value
          map-options
          class="currency-select"
          :disable="!selectedPlan"
          hide-bottom-space
        />
      </label>
    </div>

    <!-- Currency Conversion Display -->
    <div
      v-if="shouldShowConversion"
      class="q-mb-md q-px-sm"
    >
      <div
        v-if="isConverting"
        class="text-caption text-grey-7"
      >
        <q-spinner
          size="12px"
          class="q-mr-xs"
        />
        Converting...
      </div>
      <div
        v-else-if="hasConversionError"
        class="text-caption text-negative"
      >
        <q-icon
          name="eva-alert-circle-outline"
          size="14px"
          class="q-mr-xs"
        />
        {{ conversionError }}
      </div>
      <div
        v-else-if="conversionResult"
        class="text-caption"
      >
        <q-icon
          name="eva-swap-outline"
          size="14px"
          class="q-mr-xs text-primary"
        />
        <span class="text-grey-7">Converted amount:</span>
        <span class="text-weight-bold q-ml-xs">
          {{
            formatCurrency(conversionResult.convertedAmount, selectedPlan?.currency as CurrencyCode)
          }}
        </span>
        <span class="text-grey-6 q-ml-xs"> (Rate: {{ conversionResult.rate.toFixed(4) }}) </span>
      </div>
    </div>

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

    <label
      class="q-mb-sm block"
      for="expense-date-input"
    >
      <span class="form-label form-label--required">Expense Date</span>
      <q-input
        id="expense-date-input"
        :model-value="expenseDate"
        placeholder="YYYY-MM-DD"
        outlined
        dense
        no-error-icon
        inputmode="none"
        :rules="[(val: string) => !!val || 'Date is required']"
        hide-bottom-space
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
    </label>

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
import { computed, watch, ref, toRef, watchEffect } from 'vue'
import type { QUploader } from 'quasar'
import PlanSelectorField, { type PlanOption } from './PlanSelectorField.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import BudgetImpactCard from './BudgetImpactCard.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { parseDecimalInput } from 'src/utils/decimal'
import { useAICategorization } from 'src/composables/useAICategorization'
import { usePhotoExpenseAnalysis } from 'src/composables/usePhotoExpenseAnalysis'
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

const uploaderRef = ref<QUploader | null>(null)
const planIdRef = toRef(props, 'planId')
const currencyRef = computed(() => props.selectedPlan?.currency ?? null)

const aiCategorization = useAICategorization(planIdRef)
const photoAnalysis = usePhotoExpenseAnalysis(planIdRef, currencyRef)
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
  return (
    props.selectedPlan &&
    props.amount &&
    props.amount > 0 &&
    selectedCurrency.value !== (props.selectedPlan.currency as CurrencyCode)
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

async function handlePhotoAdded(files: readonly File[]) {
  await photoAnalysis.handleFileAdded(files)

  const result = photoAnalysis.analysisResult.value
  if (result && result.confidence >= 0.5) {
    emit('update:name', result.expenseName)
    emit('update:amount', result.amount)
    // Only update category if not preselected
    if (!props.defaultCategoryId) {
      emit('update:categoryId', result.categoryId)
      aiSelectedCategoryId.value = result.categoryId
    }
  }
}

function handlePhotoRemoved() {
  photoAnalysis.clearPhoto()
}

const handlePlanSelected = (planId: string | null) => {
  aiCategorization.clearSuggestion()
  aiSelectedCategoryId.value = null
  if (uploaderRef.value) {
    uploaderRef.value.reset()
  }
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
    if (uploaderRef.value) {
      uploaderRef.value.reset()
    }
  },
)
</script>

<style lang="scss" scoped>
.currency-select {
  min-width: 80px;

  :deep(.q-field__control) {
    height: 40px;
  }
}
</style>
