<template>
  <q-dialog
    :model-value="modelValue"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="column"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <q-card-section>
        <h2 class="text-h6">{{ title }}</h2>
      </q-card-section>

      <q-card-section class="q-pt-none col">
        <q-banner class="bg-red-1 text-red-8 q-mb-md">
          <template #avatar>
            <q-icon name="eva-alert-triangle-outline" />
          </template>
          {{ warningMessage }}
        </q-banner>
        {{ confirmationMessage }}
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-mt-auto"
      >
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
import { useQuasar } from 'quasar'

const $q = useQuasar()

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
