<template>
  <ShareEntityDialog
    :model-value="modelValue"
    :entity-id="planId"
    :owner-user-id="ownerUserId"
    entity-type="plan"
    entity-name="Plan"
    @update:model-value="emit('update:modelValue', $event)"
    @shared="emit('shared')"
  />
</template>

<script setup lang="ts">
import ShareEntityDialog from 'src/components/shared/ShareEntityDialog.vue'

defineProps<{
  planId: string
  ownerUserId: string | undefined
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  shared: []
}>()
</script>
