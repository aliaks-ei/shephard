<template>
  <div :class="containerClass">
    <!-- Section Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-icon
          :name="icon"
          class="q-mr-sm"
          size="20px"
        />
        <h2 class="text-h6 text-weight-medium q-my-none">
          {{ title }}
        </h2>
        <q-chip
          :label="count"
          color="primary"
          text-color="white"
          size="sm"
          class="q-ml-sm"
        />
      </div>
      <q-btn
        v-if="showViewAll"
        flat
        dense
        color="primary"
        label="View All"
        no-caps
        :to="viewAllRoute"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <slot name="skeleton">
        <DashboardSectionSkeleton />
      </slot>
    </div>

    <!-- Desktop Grid -->
    <div
      v-else-if="items.length > 0 && !$q.screen.lt.md"
      class="row"
      :class="gridGutterClass"
    >
      <div
        v-for="item in items"
        :key="item.id"
        :class="colClasses"
      >
        <slot
          name="card"
          :item="item"
        />
      </div>
    </div>

    <!-- Mobile: list mode if list-item slot provided, else stack cards -->
    <template v-else-if="items.length > 0 && $q.screen.lt.md">
      <q-card
        v-if="$slots['list-item']"
        :bordered="$q.dark.isActive"
      >
        <q-list>
          <template
            v-for="(item, index) in items"
            :key="item.id"
          >
            <slot
              name="list-item"
              :item="item"
            />
            <q-separator v-if="index < items.length - 1" />
          </template>
        </q-list>
      </q-card>
      <div
        v-else
        class="row q-col-gutter-sm"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="col-12"
        >
          <slot
            name="card"
            :item="item"
          />
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else>
      <slot name="empty" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import DashboardSectionSkeleton from './DashboardSectionSkeleton.vue'

interface Props {
  title: string
  icon: string
  items: T[]
  count: number
  loading?: boolean
  viewAllRoute?: string
  maxDisplayed?: number
  containerClass?: string
  colClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  viewAllRoute: '',
  maxDisplayed: 3,
  containerClass: '',
  colClasses: 'col-12 col-sm-6 col-md-4',
})

const $q = useQuasar()

const showViewAll = computed(() => {
  return props.viewAllRoute && props.count > props.maxDisplayed
})

const gridGutterClass = computed(() => {
  return $q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'
})
</script>
