<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
  >
    <q-card
      class="column no-wrap"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <!-- Header -->
      <q-card-section class="row items-center">
        <div class="row items-center">
          <q-icon
            name="eva-list-outline"
            :size="$q.screen.lt.md ? '24px' : '32px'"
            class="q-mr-sm"
          />
          <h2
            class="q-my-none"
            :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
          >
            Expense History
          </h2>
        </div>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          :size="$q.screen.lt.md ? 'sm' : 'md'"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <!-- Virtual Scroll Container -->
      <q-card-section class="q-pt-none overflow-auto col">
        <q-virtual-scroll
          :items="expenses"
          virtual-scroll-item-size="52"
          virtual-scroll-slice-size="10"
          class="scroll-area"
        >
          <template #default="{ item: expense, index }">
            <q-item
              :key="expense.id"
              class="q-px-none q-py-sm"
              :class="index > 0 ? 'q-border-top' : ''"
            >
              <q-item-section
                style="min-width: auto"
                avatar
              >
                <CategoryIcon
                  :color="getCategoryColor(expense.category_id)"
                  :icon="getCategoryIcon(expense.category_id)"
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
                  {{ getCategoryName(expense.category_id) }} •
                  {{ formatDate(expense.expense_date) }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                class="items-end"
              >
                <div class="row items-center q-gutter-sm">
                  <q-item-label class="text-weight-bold text-primary">
                    {{ formatCurrency(expense.amount, currency) }}
                  </q-item-label>
                  <q-btn
                    v-if="canEdit"
                    flat
                    round
                    size="sm"
                    icon="eva-trash-2-outline"
                    color="negative"
                    @click="confirmDeleteExpense(expense, () => emit('refresh'))"
                  >
                    <q-tooltip v-if="!$q.screen.lt.md">Delete expense</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { formatDate } from 'src/utils/date'
import { useCategoryHelpers } from 'src/composables/useCategoryHelpers'
import { useExpenseActions } from 'src/composables/useExpenseActions'
import type { ExpenseWithCategory } from 'src/api'

defineProps<{
  modelValue: boolean
  expenses: ExpenseWithCategory[]
  currency: CurrencyCode
  canEdit: boolean
  planId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const { getCategoryName, getCategoryColor, getCategoryIcon } = useCategoryHelpers()
const { confirmDeleteExpense } = useExpenseActions()
</script>
