<template>
  <div class="color-picker">
    <div class="text-subtitle2 q-mb-sm">Category Color</div>

    <div class="row items-center q-gutter-md q-mb-md">
      <div class="col-auto">
        <q-avatar
          size="32px"
          :style="{ backgroundColor: modelValue }"
          text-color="white"
        >
          <q-icon name="eva-pricetags-outline" />
        </q-avatar>
      </div>
      <div class="col">
        <div class="text-caption text-weight-medium text-grey-8">Selected: {{ modelValue }}</div>
      </div>
    </div>

    <q-color
      :model-value="modelValue"
      no-header
      no-footer
      class="category-color-picker"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

defineProps<{
  modelValue: string
}>()
</script>
