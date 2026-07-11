<template>
  <q-card
    v-if="isLoading || hasLoadError || recentExpenses.length > 0"
    :bordered="$q.dark.isActive"
    class="shadow-1 dashboard-mobile-section"
  >
    <q-card-section class="q-pb-none">
      <div class="row items-center justify-between">
        <h2 class="text-subtitle1 text-weight-medium q-my-none">Recent activity</h2>
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          label="View all"
          to="/expenses"
        />
      </div>
    </q-card-section>

    <q-card-section
      v-if="isLoading"
      class="q-pt-sm"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="row items-center q-py-sm"
      >
        <q-skeleton
          type="QAvatar"
          size="32px"
          class="q-mr-md"
        />
        <div class="col">
          <q-skeleton
            type="text"
            width="50%"
          />
          <q-skeleton
            type="text"
            width="30%"
          />
        </div>
      </div>
    </q-card-section>

    <QueryErrorState
      v-else-if="hasLoadError"
      compact
      entity-name="Recent activity"
      :retrying="isRetrying ?? false"
      @retry="retry"
    />

    <q-list
      v-else
      separator
      class="q-pb-sm"
    >
      <q-item
        v-for="expense in recentExpenses"
        :key="expense.id"
        clickable
        @click="openExpensePlan(expense)"
      >
        <q-item-section
          avatar
          class="min-w-auto"
        >
          <CategoryIcon
            :color="expense.categories?.color || '#666'"
            :icon="expense.categories?.icon || 'eva-folder-outline'"
            size="sm"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ expense.name }}</q-item-label>
          <q-item-label caption>
            <template v-if="expense.plans?.name">{{ expense.plans.name }} • </template>
            {{ formatDate(expense.expense_date) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-item-label class="text-weight-bold text-amount">
            {{ formatAmount(expense) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import { usePreferencesStore } from 'src/stores/preferences'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { formatDate } from 'src/utils/date'
import type { ExpenseWithCategoryAndPlan } from 'src/api'

defineProps<{
  recentExpenses: ExpenseWithCategoryAndPlan[]
  isLoading?: boolean
  hasLoadError?: boolean
  isRetrying?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
const $q = useQuasar()
const router = useRouter()
const preferencesStore = usePreferencesStore()

function retry(): void {
  emit('retry')
}

function expenseCurrency(expense: ExpenseWithCategoryAndPlan): CurrencyCode {
  return (expense.plans?.currency ?? preferencesStore.currency) as CurrencyCode
}

function formatAmount(expense: ExpenseWithCategoryAndPlan): string {
  const currency = expenseCurrency(expense)

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(expense.amount, currency)
}

function openExpensePlan(expense: ExpenseWithCategoryAndPlan) {
  if (expense.plans?.id) {
    void router.push({ name: 'plan', params: { id: expense.plans.id } })
  } else {
    void router.push('/expenses')
  }
}
</script>
