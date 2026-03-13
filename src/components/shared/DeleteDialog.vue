<template>
  <AppDialogShell
    :model-value="modelValue"
    :title="title"
    body-class="q-pa-md"
    :primary-action-label="confirmLabel"
    primary-action-color="negative"
    :primary-action-loading="isDeleting"
    :primary-action-disable="isDeleting"
    @update:model-value="emit('update:modelValue', $event)"
    @primary="emit('confirm')"
  >
    <q-banner
      rounded
      class="bg-red-1 text-red-8 q-mb-md"
    >
      <template #avatar>
        <q-icon
          size="sm"
          name="eva-alert-triangle-outline"
        />
      </template>
      {{ warningMessage }}
    </q-banner>

    <div>{{ confirmationMessage }}</div>

    <template #footer>
      <q-btn
        flat
        :label="cancelLabel"
        dense
        :disable="isDeleting"
        no-caps
        @click="emit('update:modelValue', false)"
      />
      <q-btn
        color="negative"
        :label="confirmLabel"
        dense
        :loading="isDeleting"
        no-caps
        @click="emit('confirm')"
      />
    </template>
  </AppDialogShell>
</template>

<script setup lang="ts">
import AppDialogShell from './AppDialogShell.vue'

type DeleteDialogProps = {
  modelValue: boolean
  title: string
  warningMessage: string
  confirmationMessage: string
  cancelLabel?: string
  confirmLabel?: string
  isDeleting?: boolean
}

withDefaults(defineProps<DeleteDialogProps>(), {
  cancelLabel: 'Cancel',
  confirmLabel: 'Delete',
  isDeleting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>
