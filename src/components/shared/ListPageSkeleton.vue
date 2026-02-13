<template>
  <div
    class="row"
    :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
  >
    <div
      v-for="n in displayCount"
      :key="n"
      :class="columnClass"
    >
      <q-card
        :bordered="$q.dark.isActive"
        class="shadow-1 full-height"
      >
        <slot>
          <q-card-section class="q-pa-md">
            <!-- Title -->
            <q-skeleton
              type="text"
              width="65%"
              height="20px"
            />

            <!-- Amount + chip row -->
            <div class="row items-center justify-between q-mt-lg">
              <q-skeleton
                type="text"
                width="35%"
                height="18px"
              />
              <q-skeleton
                type="QChip"
                width="70px"
                height="24px"
              />
            </div>

            <!-- Caption -->
            <q-skeleton
              type="text"
              width="50%"
              height="12px"
              class="q-mt-xs"
            />
          </q-card-section>
        </slot>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = withDefaults(
  defineProps<{
    count?: number
    mobileCount?: number
    columnClass?: string
  }>(),
  {
    count: 6,
    mobileCount: 3,
    columnClass: 'col-12 col-sm-6 col-md-4',
  },
)

const $q = useQuasar()

const displayCount = computed(() => {
  return $q.screen.lt.md ? props.mobileCount : props.count
})
</script>
