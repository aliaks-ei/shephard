<template>
  <div class="row justify-center q-pa-md">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <!-- Header Section -->
      <div class="row items-center justify-between wrap q-col-gutter-md q-mb-lg">
        <div class="col-auto">
          <h1 class="text-h4 text-weight-medium q-mb-sm q-mt-none">
            {{ title }}
          </h1>
          <p class="text-body2 text-grey-6 q-mb-none">
            {{ description }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="eva-plus-outline"
            :label="createButtonLabel"
            unelevated
            @click="emit('create')"
          />
        </div>
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'create'): void
}>()

defineProps<{
  title: string
  description: string
  createButtonLabel: string
}>()
</script>
