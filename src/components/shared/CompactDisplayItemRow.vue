<template>
  <q-item
    :clickable="clickable"
    :dense="dense"
    class="compact-display-item q-px-sm q-py-xs"
    :class="{
      'compact-display-item--interactive': clickable,
      'compact-display-item--muted': muted,
      'text-strike': strike,
    }"
    @click="emit('click')"
  >
    <q-item-section
      v-if="$slots.leading"
      avatar
      class="compact-display-item__leading min-w-auto q-pr-sm"
    >
      <slot name="leading" />
    </q-item-section>

    <q-item-section class="compact-display-item__content min-w-auto">
      <q-item-label
        class="compact-display-item__name ellipsis"
        :class="nameClass"
      >
        {{ name }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      class="compact-display-item__amount-section"
    >
      <q-item-label
        class="compact-display-item__amount"
        :class="amountClass"
      >
        {{ formattedAmount }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'

const emit = defineEmits<{
  (e: 'click'): void
}>()

const props = withDefaults(
  defineProps<{
    name: string
    amount: number
    currency: CurrencyCode
    clickable?: boolean
    dense?: boolean
    muted?: boolean
    strike?: boolean
  }>(),
  {
    clickable: false,
    dense: false,
    muted: false,
    strike: false,
  },
)

const formattedAmount = computed(() => formatCurrency(props.amount, props.currency))

const nameClass = computed(() => {
  if (props.muted) {
    return props.strike ? 'text-grey-5' : 'text-grey-6'
  }

  return props.strike ? 'text-grey-6' : 'text-weight-medium'
})

const amountClass = computed(() => {
  if (props.muted) {
    return props.strike ? 'text-grey-5' : 'text-grey-7'
  }

  return props.strike ? 'text-grey-5' : ''
})
</script>

<style scoped lang="scss">
.compact-display-item {
  min-height: 46px;
}

.compact-display-item__content {
  flex: 1 1 auto;
}

.compact-display-item__name {
  line-height: 1.25;
}

.compact-display-item__amount-section {
  flex: 0 0 auto;
  min-width: 88px;
  padding-left: 12px;
}

.compact-display-item__amount {
  text-align: right;
  white-space: nowrap;
  line-height: 1.25;
}

.compact-display-item--muted {
  opacity: 0.9;
}

@media (min-width: 1024px) {
  .compact-display-item {
    min-height: 48px;
  }

  .compact-display-item__amount-section {
    min-width: 108px;
  }
}
</style>
