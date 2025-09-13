<template>
  <div class="row justify-center q-pa-sm q-pa-md-md">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <!-- Header Section -->
      <div class="row items-center q-col-gutter-sm q-col-gutter-md-md q-mb-lg">
        <div class="col-12 col-sm col-grow">
          <h1 class="text-h4 text-weight-medium q-mb-sm q-mt-none">
            {{ title }}
          </h1>
          <p class="text-body2 text-grey-6 q-mb-none">
            {{ description }}
          </p>
        </div>
        <div
          v-if="showCreateButton"
          class="col-12 col-sm-auto"
        >
          <q-btn
            color="primary"
            icon="eva-plus-outline"
            :label="createButtonLabel"
            unelevated
            :class="$q.screen.xs ? 'full-width' : ''"
            @click="emit('create')"
          />
        </div>
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()

const emit = defineEmits<{
  (e: 'create'): void
}>()

withDefaults(
  defineProps<{
    title: string
    description: string
    createButtonLabel?: string
    showCreateButton?: boolean
  }>(),
  {
    showCreateButton: true,
  },
)
</script>
