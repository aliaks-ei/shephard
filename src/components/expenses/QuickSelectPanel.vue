<template>
  <div>
    <!-- Phase 1: Item Selection -->
    <q-slide-transition>
      <div v-show="phase === 'selection'">
        <q-card-section>
          <PlanSelectorField
            v-model="localPlanId"
            :plan-options="planOptions"
            :readonly="readonly ?? false"
            :loading="loading ?? false"
            :show-auto-select-banner="(showAutoSelectBanner ?? false) && !!selectedPlan"
            :display-value="planDisplayValue"
            @plan-selected="handlePlanSelected"
          />
        </q-card-section>

        <!-- Plan Item Selector -->
        <q-card-section
          v-if="selectedPlan"
          class="q-pt-none"
        >
          <PlanItemSelector
            :plan-items="planItems"
            :currency="(selectedPlan.currency as CurrencyCode) || 'USD'"
            :is-loading="isLoadingPlanItems ?? false"
            :selected-category-id="selectedCategoryId || null"
            ref="planItemSelectorRef"
            @item-selected="handleItemsSelected"
            @selection-changed="handleSelectionChanged"
          />
        </q-card-section>
      </div>
    </q-slide-transition>

    <!-- Phase 2: Finalize Expense -->
    <q-slide-transition>
      <div v-show="phase === 'finalize'">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-icon
              name="eva-clipboard-outline"
              class="q-mr-sm"
              size="20px"
            />
            <h2 class="text-h6 q-my-none">Review & Finalize</h2>
          </div>

          <!-- Selected Plan Info -->
          <q-card
            flat
            bordered
            class="q-mb-md"
          >
            <q-card-section class="q-pa-sm">
              <div class="text-body2 text-grey-7 q-mb-xs">Selected Plan</div>
              <div class="text-subtitle1 text-weight-medium">
                {{ selectedPlan?.name }}
              </div>
            </q-card-section>
          </q-card>

          <!-- Selected Items Summary -->
          <q-card
            flat
            bordered
            class="q-mb-md"
          >
            <q-card-section class="q-pa-sm">
              <div class="text-body2 text-grey-7 q-mb-xs">
                Selected Items ({{ selectedPlanItems.length }})
              </div>
              <q-list dense>
                <q-item
                  v-for="item in selectedPlanItems"
                  :key="item.id"
                  class="q-pa-none q-my-xs"
                >
                  <q-item-section>
                    <div class="text-body2">{{ item.name }}</div>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-body2 text-weight-medium">
                      {{
                        formatCurrency(
                          item.amount,
                          (selectedPlan?.currency as CurrencyCode) || 'USD',
                        )
                      }}
                    </div>
                  </q-item-section>
                  <q-item-section
                    side
                    class="q-ml-sm"
                  >
                    <q-btn
                      icon="eva-close-outline"
                      flat
                      round
                      dense
                      size="sm"
                      color="grey-7"
                      @click="handleRemoveItem(item.id)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
              <q-separator class="q-my-sm" />
              <div class="row items-center">
                <div class="text-subtitle2 text-weight-medium">Total</div>
                <q-space />
                <div class="text-subtitle2 text-weight-bold text-primary">
                  {{
                    formatCurrency(
                      selectedItemsTotal,
                      (selectedPlan?.currency as CurrencyCode) || 'USD',
                    )
                  }}
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Expense Date Selection -->
          <q-input
            :model-value="expenseDate"
            label="Expense Date *"
            outlined
            no-error-icon
            :rules="[(val: string) => !!val || 'Date is required']"
            class="q-mb-md"
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
        </q-card-section>
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PlanSelectorField, { type PlanOption } from './PlanSelectorField.vue'
import PlanItemSelector from './PlanItemSelector.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { PlanItem } from 'src/api/plans'

interface Plan {
  id: string
  name: string
  currency: string | null
}

interface Props {
  phase: 'selection' | 'finalize'
  planId: string | null
  selectedPlan: Plan | null
  planOptions: PlanOption[]
  planDisplayValue: string
  planItems: PlanItem[]
  selectedPlanItems: PlanItem[]
  selectedItemsTotal: number
  expenseDate: string
  readonly?: boolean
  loading?: boolean
  showAutoSelectBanner?: boolean
  isLoadingPlanItems?: boolean
  selectedCategoryId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false,
  showAutoSelectBanner: false,
  isLoadingPlanItems: false,
  selectedCategoryId: null,
})

const emit = defineEmits<{
  (e: 'update:planId', value: string | null): void
  (e: 'update:expenseDate', value: string): void
  (e: 'plan-selected', value: string | null): void
  (e: 'items-selected', items: PlanItem[]): void
  (e: 'selection-changed', items: PlanItem[]): void
  (e: 'remove-item', itemId: string): void
}>()

const planItemSelectorRef = ref()

const localPlanId = computed({
  get: () => props.planId,
  set: (value: string | null) => emit('update:planId', value),
})

const handlePlanSelected = (planId: string | null) => {
  emit('plan-selected', planId)
}

const handleItemsSelected = (items: PlanItem[]) => {
  emit('items-selected', items)
}

const handleSelectionChanged = (items: PlanItem[]) => {
  emit('selection-changed', items)
}

const handleRemoveItem = (itemId: string) => {
  emit('remove-item', itemId)
}

const handleUpdateExpenseDate = (value: string | number | null) => {
  emit('update:expenseDate', String(value || ''))
}

defineExpose({
  planItemSelectorRef,
})
</script>
