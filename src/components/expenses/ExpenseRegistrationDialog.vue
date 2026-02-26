<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
    @hide="handleDialogHide"
  >
    <q-card
      class="column no-wrap"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <!-- Fixed Header -->
      <q-card-section class="row items-center">
        <q-icon
          name="eva-plus-circle-outline"
          :size="$q.screen.lt.md ? '24px' : '32px'"
          class="q-mr-sm"
        />
        <h2
          class="q-my-none"
          :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
        >
          Register New Expense
        </h2>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          :size="$q.screen.lt.md ? 'sm' : 'md'"
          @click="closeDialog"
        />
      </q-card-section>
      <q-separator />

      <!-- Fixed Tabs -->
      <q-tabs
        v-model="currentMode"
        no-caps
        inline-label
        align="justify"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-7"
      >
        <q-tab
          name="custom-entry"
          label="Custom Entry"
          icon="eva-edit-outline"
        />
        <q-tab
          name="quick-select"
          label="Quick Select Items"
          icon="eva-checkmark-square-2-outline"
        />
      </q-tabs>

      <q-separator />

      <q-form
        class="column no-wrap"
        style="flex: 1; min-height: 0"
        ref="formRef"
        @submit="handleSubmit"
      >
        <!-- Scrollable Content Area -->
        <q-tab-panels
          v-model="currentMode"
          animated
          :swipeable="$q.screen.lt.md"
          :transition-prev="$q.screen.lt.md ? 'slide-right' : 'fade'"
          :transition-next="$q.screen.lt.md ? 'slide-left' : 'fade'"
          class="col overflow-auto bg-transparent"
          style="flex: 1; min-height: 0"
        >
          <!-- Custom Entry Mode -->
          <q-tab-panel
            name="custom-entry"
            class="q-pa-none"
          >
            <CustomEntryPanel
              v-model:plan-id="form.planId"
              v-model:category-id="form.categoryId"
              v-model:name="form.name"
              v-model:amount="form.amount"
              v-model:currency="form.currency"
              v-model:expense-date="form.expenseDate"
              :selected-plan="selectedPlan"
              :plan-options="planOptions"
              :plan-display-value="planDisplayValue"
              :category-options="categoryOptions"
              :name-rules="nameRules"
              :amount-rules="amountRules"
              :default-expense-currency="defaultExpenseCurrency"
              :readonly="!!defaultPlanId"
              :loading="false"
              :show-auto-select-hint="didAutoSelectPlan"
              :default-category-id="defaultCategoryId ?? null"
              @plan-selected="handlePlanSelected"
            />
          </q-tab-panel>

          <!-- Quick Select Items Mode -->
          <q-tab-panel
            name="quick-select"
            class="q-pa-none"
          >
            <QuickSelectPanel
              ref="quickSelectPanelRef"
              :phase="quickSelectPhase"
              v-model:plan-id="form.planId"
              v-model:expense-date="form.expenseDate"
              :selected-plan="selectedPlan"
              :plan-options="planOptions"
              :plan-display-value="planDisplayValue"
              :plan-items="planItems"
              :selected-plan-items="selectedPlanItems"
              :selected-items-total="selectedItemsTotal"
              :readonly="!!defaultPlanId"
              :loading="false"
              :show-auto-select-hint="didAutoSelectPlan"
              :is-loading-plan-items="isLoadingPlanItems"
              :selected-category-id="defaultCategoryId ?? null"
              @plan-selected="handlePlanSelected"
              @items-selected="onItemsSelected"
              @selection-changed="onSelectionChanged"
              @remove-item="handleRemoveItem"
            />
          </q-tab-panel>
        </q-tab-panels>

        <!-- Fixed Footer Actions -->
        <q-card-actions
          align="right"
          class="q-pa-sm safe-area-bottom"
        >
          <q-btn
            label="Cancel"
            flat
            no-caps
            :disable="isLoading"
            @click="closeDialog"
          />
          <q-btn
            v-if="showBackButton"
            label="Back"
            flat
            no-caps
            :disable="isLoading"
            class="q-mr-sm"
            @click="goBackToSelection"
          />
          <q-btn
            :label="getSubmitButtonLabel"
            type="submit"
            color="primary"
            unelevated
            no-caps
            :loading="isLoading"
            :disable="!canSubmit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import QuickSelectPanel from './QuickSelectPanel.vue'
import CustomEntryPanel from './CustomEntryPanel.vue'
import { useExpenseRegistration } from 'src/composables/useExpenseRegistration'
import type { QForm } from 'quasar'

const props = defineProps<{
  modelValue: boolean
  defaultPlanId?: string | null
  defaultCategoryId?: string | null
  autoSelectRecentPlan?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'expense-created': []
}>()

const formRef = ref<QForm>()
const quickSelectPanelRef = ref()

const defaultPlanIdRef = toRef(props, 'defaultPlanId')

const {
  form,
  isLoading,
  isLoadingPlanItems,
  didAutoSelectPlan,
  currentMode,
  quickSelectPhase,
  planItems,
  selectedPlanItems,
  planOptions,
  selectedPlan,
  planDisplayValue,
  defaultExpenseCurrency,
  categoryOptions,
  selectedItemsTotal,
  nameRules,
  amountRules,
  getSubmitButtonLabel,
  canSubmit,
  showBackButton,
  onPlanSelected,
  onItemsSelected,
  onSelectionChanged,
  goBackToSelection,
  proceedToFinalize,
  removeSelectedItem,
  resetForm,
  handleQuickSelectSubmit,
  handleCustomEntrySubmit,
  initialize,
  determineInitialMode,
} = useExpenseRegistration(defaultPlanIdRef)

function closeDialog() {
  emit('update:modelValue', false)
}

function handleDialogHide() {
  resetForm()
}

function handlePlanSelected(planId: string | null) {
  const planItemSelector = quickSelectPanelRef.value?.planItemSelectorRef
  onPlanSelected(planId, planItemSelector)
}

function handleRemoveItem(itemId: string) {
  const planItemSelector = quickSelectPanelRef.value?.planItemSelectorRef
  removeSelectedItem(itemId, planItemSelector)
}

async function handleSubmit() {
  if (!formRef.value) return

  if (currentMode.value === 'quick-select' && quickSelectPhase.value === 'selection') {
    proceedToFinalize()
    return
  }

  isLoading.value = true

  try {
    if (currentMode.value === 'quick-select') {
      await handleQuickSelectSubmit(() => {
        emit('expense-created')
        closeDialog()
      })
    } else {
      const isValid = await formRef.value.validate()
      await handleCustomEntrySubmit(isValid, () => {
        emit('expense-created')
        closeDialog()
      })
    }
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      initialize(props.autoSelectRecentPlan || false)

      if (props.defaultCategoryId && form.value.planId) {
        const categoryExists = categoryOptions.value.some(
          (c) => c.value === props.defaultCategoryId,
        )
        if (categoryExists) {
          form.value.categoryId = props.defaultCategoryId
        }
      }

      determineInitialMode()
    }
  },
)
</script>
