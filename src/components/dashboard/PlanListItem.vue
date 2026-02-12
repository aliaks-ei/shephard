<template>
  <q-item
    clickable
    @click="emit('click', plan.id)"
  >
    <q-item-section
      side
      class="q-pr-sm"
    >
      <q-badge
        rounded
        color="green"
        class="plan-status-dot"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="row items-center no-wrap">
        <span class="ellipsis">{{ plan.name }}</span>
        <q-icon
          v-if="isViewOnly"
          name="eva-lock-outline"
          size="14px"
          class="text-warning q-ml-xs"
        />
        <q-icon
          v-if="!isOwner"
          name="eva-people-outline"
          size="14px"
          class="text-info q-ml-xs"
        />
      </q-item-label>
      <q-item-label caption>
        {{ formatDateRange(plan.start_date, plan.end_date) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <span class="text-weight-medium text-body2">
        {{ formatAmount(plan.total) }}
      </span>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { formatDateRange } from 'src/utils/plans'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import type { PlanWithPermission } from 'src/api'

const emit = defineEmits<{
  click: [planId: string]
}>()

const props = defineProps<{
  plan: PlanWithPermission
}>()

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const isViewOnly = computed(() => props.plan.permission_level === 'view')

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}
</script>

<style lang="scss" scoped>
.plan-status-dot {
  width: 10px;
  height: 10px;
  min-height: 10px;
  padding: 0;
}
</style>
