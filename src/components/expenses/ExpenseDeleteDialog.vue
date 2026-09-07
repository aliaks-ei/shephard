<template>
  <DeleteDialog
    :model-value="pendingDeleteExpense !== null"
    title="Delete Expense"
    warning-message="This action cannot be undone."
    :confirmation-message="confirmationMessage"
    confirm-label="Delete"
    :is-deleting="isDeletingExpense"
    @confirm="confirmPendingDelete"
    @update:model-value="handleModelValueUpdate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { useExpenseActions } from 'src/composables/useExpenseActions'

const { pendingDeleteExpense, isDeletingExpense, confirmPendingDelete, cancelPendingDelete } =
  useExpenseActions()

const confirmationMessage = computed(() =>
  pendingDeleteExpense.value
    ? `Are you sure you want to delete "${pendingDeleteExpense.value.name}"?`
    : '',
)

function handleModelValueUpdate(value: boolean) {
  if (!value) {
    cancelPendingDelete()
  }
}
</script>
