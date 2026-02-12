<template>
  <!-- Mobile: list skeleton -->
  <q-card
    v-if="$q.screen.lt.sm"
    :bordered="$q.dark.isActive"
  >
    <q-list>
      <template
        v-for="i in skeletonCount"
        :key="`skeleton-${i}`"
      >
        <q-item>
          <q-item-section
            side
            class="q-pr-sm"
          >
            <q-skeleton
              type="QAvatar"
              size="10px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton
                type="text"
                width="50%"
              />
            </q-item-label>
            <q-item-label>
              <q-skeleton
                type="text"
                width="35%"
              />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-skeleton
              type="text"
              width="60px"
            />
          </q-item-section>
        </q-item>
        <q-separator v-if="i < skeletonCount" />
      </template>
    </q-list>
  </q-card>

  <!-- Desktop: card grid skeleton -->
  <div
    v-else
    class="row"
    :class="gridGutterClass"
  >
    <div
      v-for="i in maxDisplayed"
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
  return Math.min(props.maxDisplayed, 3)
})

const gridGutterClass = computed(() => {
  return $q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'
})
</script>
