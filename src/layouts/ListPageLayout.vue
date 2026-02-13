<template>
  <div class="row justify-center page-content-spacing">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <!-- Header Section -->
      <div
        class="row items-center"
        :class="
          $q.screen.lt.md
            ? 'q-col-gutter-sm section-spacing-compact'
            : 'q-col-gutter-md section-spacing-compact'
        "
      >
        <div class="col col-grow">
          <h1
            :class="$q.screen.xs ? 'text-h5' : 'text-h4'"
            class="text-weight-medium q-my-none"
          >
            {{ title }}
          </h1>
          <p class="text-body2 text-grey-6 q-mb-none gt-xs">
            {{ description }}
          </p>
        </div>
        <div
          v-if="showCreateButton"
          class="col-auto"
        >
          <q-btn
            color="primary"
            :label="createButtonLabel"
            unelevated
            no-caps
            @click="emit('create')"
          />
        </div>
      </div>

      <BannerContainer />

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import BannerContainer from 'src/components/shared/BannerContainer.vue'

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
