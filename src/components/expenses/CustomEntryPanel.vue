<template>
  <q-card-section class="q-pt-md">
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
    <q-input
      :model-value="name"
      label="Expense Name *"
      outlined
      no-error-icon
      :rules="nameRules"
      :disable="!selectedPlan"
      class="q-mb-sm"
      @update:model-value="handleUpdateName"
    />

    <!-- Expense Amount -->
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
      :disable="!selectedPlan"
      class="q-mb-sm"
      @update:model-value="handleUpdateAmount"
    >
      <template #prepend>
        <q-icon name="eva-credit-card-outline" />
      </template>
    </q-input>

    <!-- Category Selection -->
    <div class="column">
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
        :hint="
          aiCategorization.isCategorizing.value
            ? 'AI is analyzing the expense name...'
            : isAiSelected
              ? 'Category selected by AI'
              : undefined
        "
        class="q-mb-sm"
        @update:model-value="handleUpdateCategoryId"
      >
        <template
          v-if="categoryId && selectedCategoryOption"
          #prepend
        >
          <CategoryIcon
            :color="selectedCategoryOption.color"
            :icon="selectedCategoryOption.icon"
            size="sm"
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
        <div class="column items-end">
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
            flat
            dense
            no-caps
            @click="applyLowConfidenceSuggestion"
          />
        </div>
      </q-banner>
    </div>

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
import { computed, watch, ref, toRef } from 'vue'
import PlanSelectorField, { type PlanOption } from './PlanSelectorField.vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useAICategorization } from 'src/composables/useAICategorization'

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
  showAutoSelectHint?: boolean
  defaultCategoryId?: string | null
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
  (e: 'update:expenseDate', value: string): void
  (e: 'plan-selected', value: string | null): void
}>()

const planIdRef = toRef(props, 'planId')
const aiCategorization = useAICategorization(planIdRef)
const aiSelectedCategoryId = ref<string | null>(null)

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

const handlePlanSelected = (planId: string | null) => {
  aiCategorization.clearSuggestion()
  aiSelectedCategoryId.value = null
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

const handleUpdateAmount = (value: number | string | null) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
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
  },
)
</script>
