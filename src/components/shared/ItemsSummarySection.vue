<template>
  <div v-if="itemCount > 0">
    <q-separator class="q-mb-lg" />
    <div class="row items-center justify-between">
      <div class="row items-center">
        <q-icon
          name="eva-credit-card-outline"
          class="q-mr-sm"
          size="20px"
        />
        <component
          :is="headingTag"
          class="q-my-none"
          :class="headingClass"
        >
          {{ summaryLabel }}
        </component>
      </div>
      <div
        :class="[
          'text-primary text-weight-bold',
          $q.screen.lt.md ? amountSizeMobile : amountSizeDesktop,
        ]"
      >
        {{ formattedAmount }}
      </div>
    </div>
    <div class="text-body2 text-grey-6">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  formattedAmount: string
  itemCount: number
  itemType?: 'category' | 'categories' | 'item' | 'items'
  summaryLabel?: string
  headingLevel?: 'h2' | 'h3' | 'h4'
  amountSizeMobile?: string
  amountSizeDesktop?: string
}

const props = withDefaults(defineProps<Props>(), {
  itemType: 'categories',
  summaryLabel: 'Total Amount',
  headingLevel: 'h3',
  amountSizeMobile: 'text-h6',
  amountSizeDesktop: 'text-h5',
})

const headingTag = computed(() => props.headingLevel)
const headingClass = computed(() => {
  const levelMap: Record<string, string> = {
    h2: 'text-h6',
    h3: 'text-h6',
    h4: 'text-subtitle1',
  }
  return levelMap[props.headingLevel] || 'text-h6'
})

const description = computed(() => {
  const count = props.itemCount
  let type = props.itemType

  // Auto-pluralize if needed
  if (type === 'category' || type === 'categories') {
    type = count === 1 ? 'category' : 'categories'
  } else if (type === 'item' || type === 'items') {
    type = count === 1 ? 'item' : 'items'
  }

  return `Total across ${count} ${type}`
})
</script>
