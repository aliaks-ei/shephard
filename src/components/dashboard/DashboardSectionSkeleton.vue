<template>
  <div
    class="row"
    :class="[gridGutterClass, $q.screen.lt.sm ? 'q-mb-xl' : 'q-mb-lg']"
  >
    <div
      v-for="i in skeletonCount"
      :key="`skeleton-${i}`"
      class="col-12 col-sm-6 col-md-4"
    >
      <q-card
        :bordered="$q.dark.isActive"
        class="shadow-1"
      >
        <q-card-section>
          <q-skeleton
            type="text"
            width="60%"
          />
          <q-skeleton
            type="text"
            width="40%"
            class="q-mt-xl"
          />
          <q-skeleton
            type="text"
            width="30%"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

interface Props {
  maxDisplayed?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplayed: 3,
})

const $q = useQuasar()

const skeletonCount = computed(() => {
  return $q.screen.lt.sm ? 1 : props.maxDisplayed
})

const gridGutterClass = computed(() => {
  return $q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'
})
</script>
