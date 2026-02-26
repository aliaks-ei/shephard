<template>
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
      @update:model-value="emit('update:expenseDate', $event)"
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
              @update:model-value="emit('update:expenseDate', $event)"
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
</template>

<script setup lang="ts">
defineProps<{
  expenseDate: string
}>()

const emit = defineEmits<{
  (e: 'update:expenseDate', value: string | number | null): void
}>()
</script>
