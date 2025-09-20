<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-banner class="bg-red-1 text-red-8 q-mb-md">
          <template #avatar>
            <q-icon name="eva-alert-triangle-outline" />
          </template>
          {{ warningMessage }}
        </q-banner>
        {{ confirmationMessage }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="cancelLabel"
          :disabled="isDeleting"
          no-caps
          @click="emit('update:modelValue', false)"
        />
        <q-btn
          color="negative"
          :label="confirmLabel"
          :loading="isDeleting"
          no-caps
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
interface DeleteDialogProps {
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
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()
</script>
