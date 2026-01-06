<template>
  <div
    v-if="errors.length > 0"
    role="alert"
    aria-live="assertive"
    :class="bannerClasses"
  >
    <q-icon
      name="eva-alert-triangle-outline"
      size="20px"
      class="q-mr-sm"
    />

    <span v-if="errors.length === 1">
      {{ errors[0] }}
    </span>
    <span v-else> Please fix {{ errors.length }} errors before saving </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  errors: string[]
}

defineProps<Props>()

const bannerClasses = computed(() => [
  'row',
  'items-center',
  'q-pa-sm',
  'q-px-md',
  'q-mb-md',
  'bg-red-1',
  'text-red-6',
])
</script>

<style lang="scss" scoped>
div[role='alert'] {
  width: 100%;
  border-radius: $generic-border-radius;
}
</style>
