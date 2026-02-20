<template>
  <ShareEntityDialog
    :model-value="modelValue"
    :entity-id="templateId"
    :owner-user-id="ownerUserId"
    entity-type="template"
    entity-name="Template"
    @update:model-value="emit('update:modelValue', $event)"
    @shared="emit('shared')"
  />
</template>

<script setup lang="ts">
import ShareEntityDialog from 'src/components/shared/ShareEntityDialog.vue'

defineProps<{
  templateId: string
  ownerUserId: string | undefined
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  shared: []
}>()
</script>
