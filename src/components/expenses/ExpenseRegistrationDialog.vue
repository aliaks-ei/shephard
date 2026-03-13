<template>
  <AppDialogShell
    :model-value="modelValue"
    title="Register New Expense"
    body-class="q-pa-none"
    :body-scrollable="false"
    persistent-desktop
    :footer-separator="false"
    :primary-action-label="getSubmitButtonLabel"
    :primary-action-icon="submitButtonIcon"
    :primary-action-loading="isLoading"
    :primary-action-disable="!canSubmit"
    @update:model-value="emit('update:modelValue', $event)"
    @hide="handleDialogHide"
    @primary="void handleSubmit()"
  >
    <template #header-prefix>
      <q-icon
        name="eva-plus-circle-outline"
        size="32px"
        class="q-mr-sm"
      />
    </template>

    <template #mobile-header-extra>
      <q-btn
        v-if="showBackButton"
        label="Back"
        flat
        dense
        no-caps
        :disable="isLoading"
        @click="goBackToSelection"
      />
    </template>

    <q-form
      ref="formRef"
      class="column no-wrap expense-registration-dialog__form"
      @submit="handleSubmit"
    >
      <!-- Fixed Tabs -->
      <q-tabs
        v-model="currentMode"
        dense
        no-caps
        align="justify"
        active-color="primary"
        indicator-color="transparent"
        class="q-mx-md q-mt-md q-mb-md"
      >
        <q-tab
          name="custom-entry"
          label="Custom Entry"
          :ripple="false"
        />
        <q-tab
          name="quick-select"
          label="Quick Select"
          :ripple="false"
        />
      </q-tabs>

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
    </q-form>

    <template #footer>
      <q-btn
        label="Cancel"
        flat
        dense
        no-caps
        :disable="isLoading"
        @click="closeDialog"
      />
      <q-btn
        v-if="showBackButton"
        label="Back"
        flat
        dense
        no-caps
        :disable="isLoading"
        class="q-mr-sm"
        @click="goBackToSelection"
      />
      <q-btn
        :label="getSubmitButtonLabel"
        :icon="submitButtonIcon"
        color="primary"
        unelevated
        dense
        no-caps
        :loading="isLoading"
        :disable="!canSubmit"
        @click="void handleSubmit()"
      />
    </template>
  </AppDialogShell>
</template>

<script setup lang="ts">
import { computed, ref, watch, toRef } from 'vue'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
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
} = useExpenseRegistration(defaultPlanIdRef)

const submitButtonIcon = computed(() => {
  if (currentMode.value === 'quick-select' && quickSelectPhase.value === 'selection') {
    return 'eva-arrow-forward-outline'
  }

  if (currentMode.value === 'custom-entry') {
    return 'eva-plus-circle-outline'
  }

  return 'eva-checkmark-circle-2-outline'
})

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
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.expense-registration-dialog__form {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
