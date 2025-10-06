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
      v-else-if="items.length > 0 && $q.screen.gt.xs"
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

    <!-- Mobile Carousel -->
    <q-carousel
      v-else-if="items.length > 0 && $q.screen.lt.sm"
      v-model="carouselSlide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="primary"
      control-type="flat"
      navigation-icon="eva-radio-button-off-outline"
      navigation-active-icon="eva-radio-button-on-outline"
      navigation
      padding
      height="auto"
      class="transparent"
    >
      <q-carousel-slide
        v-for="(item, index) in items"
        :key="item.id"
        :name="index"
        class="q-pa-none"
      >
        <slot
          name="card"
          :item="item"
        />
      </q-carousel-slide>
    </q-carousel>

    <!-- Empty State -->
    <div v-else>
      <slot name="empty" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed } from 'vue'
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
const carouselSlide = ref(0)

const showViewAll = computed(() => {
  return props.viewAllRoute && props.count > props.maxDisplayed
})

const gridGutterClass = computed(() => {
  return $q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'
})
</script>
