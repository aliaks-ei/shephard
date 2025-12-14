<template>
  <q-card
    :class="budgetImpactCardClass"
    flat
    bordered
  >
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">Budget Impact</div>

      <!-- Empty State: No category selected -->
      <div
        v-if="!categoryId"
        class="text-center q-py-md text-grey-6 text-body2"
      >
        <q-icon
          name="eva-info-outline"
          size="24px"
          class="q-mb-xs"
        />
        <div>Select a category and enter amount to see budget impact</div>
      </div>

      <!-- Category selected but no amount -->
      <div v-else-if="!amount || amount <= 0">
        <q-linear-progress
          :value="Math.min(currentBudgetPercentage / 100, 9.99)"
          :color="currentBudgetProgressColor"
          size="8px"
          class="q-mb-sm"
          rounded
        />

        <div class="row items-center justify-between text-caption q-mb-xs">
          <span>{{ Math.round(currentBudgetPercentage) }}% used</span>
          <span
            v-if="currency && categoryOption"
            class="text-weight-medium"
          >
            {{ formatCurrency(categoryOption.actualAmount, currency) }}
            /
            {{ formatCurrency(categoryOption.plannedAmount, currency) }}
          </span>
        </div>

        <q-separator class="q-my-sm" />

        <div class="column">
          <div class="row justify-between text-caption">
            <span class="text-grey-7">Remaining:</span>
            <span
              v-if="categoryOption"
              :class="currentBudgetRemainingColorClass"
              class="text-weight-bold"
            >
              {{ formatCurrency(Math.abs(categoryOption.remainingAmount), currency ?? 'USD') }}
              {{ categoryOption.remainingAmount >= 0 ? 'left' : 'over' }}
            </span>
          </div>
        </div>

        <div class="text-center q-mt-md text-grey-6 text-caption">
          Enter an amount to see the impact on this budget
        </div>
      </div>

      <!-- Full state: Category + amount -->
      <div v-else-if="categoryOption">
        <q-linear-progress
          :value="Math.min(budgetPercentageAfter / 100, 9.99)"
          :color="budgetProgressColor"
          size="8px"
          class="q-mb-sm"
          rounded
        />

        <div class="row items-center justify-between text-caption q-mb-xs">
          <span>{{ Math.round(budgetPercentageAfter) }}% used</span>
          <span
            v-if="currency"
            class="text-weight-medium"
          >
            {{ formatCurrency(newSpentAmount, currency) }}
            /
            {{ formatCurrency(categoryOption.plannedAmount, currency) }}
          </span>
        </div>

        <q-separator class="q-my-sm" />

        <div class="column">
          <div class="row justify-between text-caption">
            <span class="text-grey-7">Current:</span>
            <span>
              {{ formatCurrency(categoryOption.actualAmount, currency ?? 'USD') }}
              /
              {{ formatCurrency(categoryOption.plannedAmount, currency ?? 'USD') }}
            </span>
          </div>

          <div class="row justify-between text-caption">
            <span class="text-grey-7">Adding:</span>
            <span class="text-weight-medium">
              +{{ formatCurrency(amount, currency ?? 'USD') }}
            </span>
          </div>

          <div class="row justify-between text-caption">
            <span class="text-grey-7">After:</span>
            <span
              :class="budgetStatusTextClass"
              class="text-weight-bold"
            >
              {{ formatCurrency(newSpentAmount, currency ?? 'USD') }}
              /
              {{ formatCurrency(categoryOption.plannedAmount, currency ?? 'USD') }}
              ({{ formatCurrency(Math.abs(newRemainingAmount), currency ?? 'USD') }}
              {{ newRemainingAmount >= 0 ? 'left' : 'over' }})
              <q-icon
                :name="budgetStatusIcon"
                size="18px"
                class="q-ml-xs"
              />
            </span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'

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
  categoryId: string | null
  amount: number | null
  currency: CurrencyCode | null
  categoryOption: CategoryOption | null
}

const props = defineProps<Props>()

const currentBudgetPercentage = computed(() => {
  if (!props.categoryOption || props.categoryOption.plannedAmount === 0) return 0
  return Math.min(
    (props.categoryOption.actualAmount / props.categoryOption.plannedAmount) * 100,
    999,
  )
})

const currentBudgetProgressColor = computed(() =>
  getBudgetProgressColor(currentBudgetPercentage.value),
)

const currentBudgetRemainingColorClass = computed(() =>
  getBudgetRemainingColorClass(currentBudgetPercentage.value),
)

const newSpentAmount = computed(() => {
  if (!props.categoryOption || !props.amount) return 0
  return props.categoryOption.actualAmount + props.amount
})

const newRemainingAmount = computed(() => {
  if (!props.categoryOption) return 0
  return props.categoryOption.plannedAmount - newSpentAmount.value
})

const budgetPercentageAfter = computed(() => {
  if (!props.categoryOption || props.categoryOption.plannedAmount === 0) return 0
  return Math.min((newSpentAmount.value / props.categoryOption.plannedAmount) * 100, 999)
})

const budgetProgressColor = computed(() => getBudgetProgressColor(budgetPercentageAfter.value))

const budgetStatusTextClass = computed(() =>
  getBudgetRemainingColorClass(budgetPercentageAfter.value),
)

const budgetStatusIcon = computed(() => {
  const percentage = budgetPercentageAfter.value
  if (percentage < 90) return 'eva-checkmark-circle-outline'
  if (percentage < 100) return 'eva-alert-triangle-outline'
  if (percentage === 100) return 'eva-checkmark-circle-outline'
  return 'eva-alert-circle-outline'
})

const budgetImpactCardClass = computed(() => {
  const percentage =
    props.amount && props.amount > 0 ? budgetPercentageAfter.value : currentBudgetPercentage.value

  if (percentage < 90) return ''
  if (percentage < 100) return 'bg-orange-1'
  if (percentage === 100) return ''
  return 'bg-red-1'
})
</script>
