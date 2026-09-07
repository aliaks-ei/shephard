<template>
  <q-card
    class="plan-card full-height pressable"
    :style="heroStyle"
  >
    <q-item
      class="plan-card__row q-pa-md"
      clickable
      @click="openPlan"
    >
      <q-item-section class="plan-card__main">
        <div class="row items-center no-wrap q-gutter-x-xs">
          <div class="plan-card__name text-subtitle1 text-weight-bold ellipsis">
            {{ plan.name }}
          </div>
          <q-icon
            v-if="isViewOnly"
            name="eva-lock-outline"
            size="14px"
            class="text-warning"
          >
            <q-tooltip>View only</q-tooltip>
          </q-icon>
          <q-icon
            v-if="!isOwner"
            name="eva-people-outline"
            size="14px"
            class="text-info"
          >
            <q-tooltip>Shared with me</q-tooltip>
          </q-icon>
        </div>
        <div class="text-caption text-muted ellipsis">
          {{ formatDateRange(plan.start_date, plan.end_date) }}
        </div>
      </q-item-section>

      <q-item-section
        side
        class="plan-card__meta items-end"
      >
        <div class="text-subtitle1 text-weight-bold text-amount plan-card__amount">
          {{ formatAmount(plan.total) }}
        </div>
        <StatusPill
          :label="getStatusText(plan)"
          :icon="getStatusIcon(plan)"
          :tone="statusColorToTone(getStatusColor(plan))"
          class="q-mt-xs"
        />
      </q-item-section>

      <q-item-section
        side
        class="plan-card__actions"
      >
        <q-btn
          flat
          round
          size="sm"
          icon="eva-more-vertical-outline"
          :aria-label="menuButtonLabel"
          aria-haspopup="menu"
          :aria-expanded="String(isActionsMenuOpen)"
          :aria-controls="menuId"
          class="text-muted mobile-touch-target"
          @click.stop
        >
          <PlanCardMenu
            :id="menuId"
            v-model="isActionsMenuOpen"
            :can-edit="canEdit"
            :can-share="isOwner"
            :plan-status="planStatus"
            @export="emit('export', plan.id)"
            @share="emit('share', plan.id)"
            @delete="showDeleteDialog"
            @cancel="showCancelDialog"
          />
        </q-btn>
      </q-item-section>
    </q-item>

    <DeleteDialog
      v-model="isDeleteDialogOpen"
      title="Delete Plan"
      warning-message="This action cannot be undone. All plan data will be permanently removed."
      :confirmation-message="`Are you sure you want to delete &quot;${plan.name}&quot;?`"
      cancel-label="Cancel"
      confirm-label="Delete Plan"
      @confirm="confirmDelete"
    />

    <DeleteDialog
      v-model="isCancelDialogOpen"
      title="Cancel Plan"
      warning-message="This will mark the plan as cancelled and stop any active tracking."
      :confirmation-message="`Are you sure you want to cancel &quot;${plan.name}&quot;?`"
      cancel-label="Keep Active"
      confirm-label="Cancel Plan"
      @confirm="confirmCancel"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import PlanCardMenu from './PlanCardMenu.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import StatusPill from 'src/components/shared/StatusPill.vue'
import { statusColorToTone } from 'src/components/shared/status-tone'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { useSharedPlanTransition } from 'src/composables/useSharedPlanTransition'
import {
  getPlanStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from 'src/utils/plans'
import type { PlanWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'export', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', plan: PlanWithPermission): void
  (e: 'cancel', plan: PlanWithPermission): void
}>()

const props = defineProps<{
  plan: PlanWithPermission
}>()

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const { heroStyle, markShared } = useSharedPlanTransition(() => props.plan.id)

const isDeleteDialogOpen = ref(false)
const isCancelDialogOpen = ref(false)
const isActionsMenuOpen = ref(false)

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const canEdit = computed(() => isOwner.value || props.plan.permission_level === 'edit')
const planStatus = computed(() => getPlanStatus(props.plan))
const isViewOnly = computed(() => props.plan.permission_level === 'view')
const menuButtonLabel = computed(() => `Actions for ${props.plan.name}`)
const menuId = computed(() => `plan-actions-${props.plan.id}`)

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}

function openPlan(): void {
  // Mark before navigating so the list card and the detail summary morph into each other.
  markShared()
  emit('edit', props.plan.id)
}

function showDeleteDialog(): void {
  isDeleteDialogOpen.value = true
}

function showCancelDialog(): void {
  isCancelDialogOpen.value = true
}

function confirmDelete(): void {
  emit('delete', props.plan)
  isDeleteDialogOpen.value = false
}

function confirmCancel(): void {
  emit('cancel', props.plan)
  isCancelDialogOpen.value = false
}
</script>

<style scoped lang="scss">
.plan-card__row {
  min-height: 0;
}

.plan-card__main {
  min-width: 0;
}

.plan-card__name {
  min-width: 0;
  line-height: 1.3;
}

.plan-card__meta {
  padding-left: 12px;
}

.plan-card__amount {
  color: hsl(var(--foreground));
  line-height: 1.3;
}

.plan-card__actions {
  padding-left: 4px;
}
</style>
