<template>
  <q-slide-item
    v-if="$q.screen.lt.md && canEdit"
    v-bind="$attrs"
    class="mobile-expense-swipe-item"
    right-color="negative"
    @right="handleSwipeDelete"
  >
    <template #right>
      <div class="row items-center q-gutter-sm">
        <q-icon
          name="eva-trash-2-outline"
          size="20px"
        />
        <span class="text-weight-medium">Delete</span>
      </div>
    </template>

    <q-item
      :class="itemClass"
      :to="to"
      :clickable="!!to"
    >
      <q-item-section
        v-if="showCategory"
        class="min-w-auto"
        avatar
      >
        <CategoryIcon
          :color="categoryColor || '#666'"
          :icon="categoryIcon || 'eva-folder-outline'"
          size="sm"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-weight-medium">
          {{ expense.name }}
        </q-item-label>
        <q-item-label
          caption
          class="q-mt-xs"
        >
          <template v-if="categoryName">{{ categoryName }} • </template>
          {{ formatDate(expense.expense_date) }}
        </q-item-label>
      </q-item-section>

      <q-item-section
        side
        class="items-end"
      >
        <div class="column items-end">
          <q-item-label class="text-weight-bold text-primary text-amount">
            {{ formatCurrency(expense.amount, currency) }}
          </q-item-label>
          <q-item-label
            v-if="expense.original_amount && expense.original_currency"
            caption
            class="text-caption text-amount"
          >
            {{ formatCurrency(expense.original_amount, expense.original_currency as CurrencyCode) }}
          </q-item-label>
        </div>
      </q-item-section>
    </q-item>
  </q-slide-item>

  <q-item
    v-else
    v-bind="$attrs"
    :class="itemClass"
    :to="to"
    :clickable="!!to"
  >
    <q-item-section
      v-if="showCategory"
      class="min-w-auto"
      avatar
    >
      <CategoryIcon
        :color="categoryColor || '#666'"
        :icon="categoryIcon || 'eva-folder-outline'"
        size="sm"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">
        {{ expense.name }}
      </q-item-label>
      <q-item-label
        caption
        class="q-mt-xs"
      >
        <template v-if="categoryName">{{ categoryName }} • </template>
        {{ formatDate(expense.expense_date) }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      class="items-end"
    >
      <div class="row items-center q-gutter-sm">
        <div class="column items-end">
          <q-item-label class="text-weight-bold text-primary text-amount">
            {{ formatCurrency(expense.amount, currency) }}
          </q-item-label>
          <q-item-label
            v-if="expense.original_amount && expense.original_currency"
            caption
            class="text-caption text-amount"
          >
            {{ formatCurrency(expense.original_amount, expense.original_currency as CurrencyCode) }}
          </q-item-label>
        </div>
        <q-btn
          v-if="canEdit"
          flat
          round
          size="sm"
          icon="eva-trash-2-outline"
          color="negative"
          aria-label="Delete expense"
          class="expense-list-item__icon-action"
          @click.stop="handleConfirmDelete"
        >
          <q-tooltip v-if="!$q.screen.lt.md">Delete expense</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDate } from 'src/utils/date'
import { useExpenseActions } from 'src/composables/useExpenseActions'
import type { ExpenseWithCategory } from 'src/api'

defineOptions({ inheritAttrs: false })

type ExpenseListItemProps = {
  expense: ExpenseWithCategory
  currency: CurrencyCode
  canEdit: boolean
  showCategory?: boolean
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
  itemClass?: string
  to?: RouteLocationRaw
}

const props = withDefaults(defineProps<ExpenseListItemProps>(), {
  showCategory: false,
  itemClass: '',
})

const emit = defineEmits<{
  deleted: []
}>()

const { confirmDeleteExpense } = useExpenseActions()

function handleSwipeDelete(details: { reset: () => void }) {
  details.reset()
  confirmDeleteExpense(props.expense, () => emit('deleted'))
}

function handleConfirmDelete() {
  confirmDeleteExpense(props.expense, () => emit('deleted'))
}
</script>

<style lang="scss" scoped>
.expense-list-item__icon-action {
  min-width: 44px;
  min-height: 44px;
}
</style>
