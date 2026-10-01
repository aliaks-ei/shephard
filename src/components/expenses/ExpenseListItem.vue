<template>
  <q-slide-item
    v-if="!isHidden && $q.screen.lt.md && canEdit"
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
          :color="categoryColor || DEFAULT_CATEGORY_COLOR"
          :icon="categoryIcon || 'eva-folder-outline'"
          size="sm"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-weight-medium">
          {{ expense.name }}
        </q-item-label>
        <q-item-label
          v-if="caption"
          caption
          class="q-mt-xs"
        >
          {{ caption }}
        </q-item-label>
      </q-item-section>

      <q-item-section
        side
        class="items-end"
      >
        <div class="column items-end">
          <q-item-label class="text-weight-bold text-amount">
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
    v-else-if="!isHidden"
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
        :color="categoryColor || DEFAULT_CATEGORY_COLOR"
        :icon="categoryIcon || 'eva-folder-outline'"
        size="sm"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">
        {{ expense.name }}
      </q-item-label>
      <q-item-label
        v-if="caption"
        caption
        class="q-mt-xs"
      >
        {{ caption }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      class="items-end"
    >
      <div class="row items-center q-gutter-sm">
        <div class="column items-end">
          <q-item-label class="text-weight-bold text-amount">
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
          class="icon-action-destructive expense-list-item__icon-action"
          aria-label="Delete expense"
          @click.stop="handleConfirmDelete"
        >
          <q-tooltip v-if="!$q.screen.lt.md">Delete expense</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDayInline } from 'src/utils/date'
import { DEFAULT_CATEGORY_COLOR } from 'src/utils/categories'
import { useExpenseActions } from 'src/composables/useExpenseActions'
import { hapticTap } from 'src/utils/haptics'
import type { ExpenseWithCategory } from 'src/api'

defineOptions({ inheritAttrs: false })

type ExpenseListItemProps = {
  expense: ExpenseWithCategory
  currency: CurrencyCode
  canEdit: boolean
  showCategory?: boolean
  // Off inside day groups, where the header already names the day
  showDate?: boolean
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
  itemClass?: string
  to?: RouteLocationRaw
}

const props = withDefaults(defineProps<ExpenseListItemProps>(), {
  showCategory: false,
  showDate: true,
  itemClass: '',
})

const emit = defineEmits<{
  deleted: []
}>()

const caption = computed(() =>
  [props.categoryName, props.showDate ? formatDayInline(props.expense.expense_date) : '']
    .filter(Boolean)
    .join(', '),
)

const { confirmDeleteExpense, deleteExpenseWithUndo, isUndoPending } = useExpenseActions()
const isHidden = computed(() => isUndoPending(props.expense.id))

function handleSwipeDelete(details: { reset: () => void }) {
  hapticTap()
  details.reset()
  deleteExpenseWithUndo(props.expense, () => emit('deleted'))
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
