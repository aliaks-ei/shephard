<template>
  <q-card class="plan-card full-height pressable">
    <q-item
      class="plan-card__row q-pa-md"
      clickable
      @click="openPlan"
    >
      <q-item-section class="plan-card__main">
        <div class="row items-center no-wrap">
          <div class="col min-w-0 row items-center no-wrap q-gutter-x-xs">
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
            <!-- Who else uses this plan, not only that it is shared -->
            <span
              v-if="visibleInitials.length > 0"
              class="plan-card__members"
              :aria-label="`Shared with ${memberInitials?.length} ${memberInitials?.length === 1 ? 'person' : 'people'}`"
              role="img"
            >
              <span
                v-for="(initial, index) in visibleInitials"
                :key="index"
                class="plan-card__member"
                >{{ initial }}</span
              >
            </span>
          </div>
          <StatusPill
            :label="statusPill.label"
            :tone="statusPill.tone"
            class="q-ml-sm"
          />
          <!-- Desktop: menu in the title row, so the bar uses the full card width.
               Mobile: long-press opens the same menu. -->
          <q-btn
            v-if="!$q.screen.lt.md"
            flat
            round
            size="sm"
            icon="eva-more-vertical-outline"
            :aria-label="menuButtonLabel"
            aria-haspopup="menu"
            :aria-expanded="String(isActionsMenuOpen)"
            :aria-controls="menuId"
            class="plan-card__menu text-muted mobile-touch-target"
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
        </div>
        <div class="text-caption text-muted ellipsis q-mt-xs">
          {{ dateCaption }}
        </div>

        <template v-if="hasSpend">
          <q-linear-progress
            :value="spentRatio"
            size="6px"
            class="plan-card__bar q-mt-md"
            :class="`plan-card__bar--${statusPill.tone}`"
            :aria-label="`${formatAmount(spent)} of ${formatAmount(plan.total)} spent`"
          />
          <div class="plan-card__spend q-mt-sm">
            <span class="text-ink text-amount text-weight-bold">{{ formatAmount(spent) }}</span>
            <span class="text-muted"> of </span>
            <span class="text-amount">{{ formatAmount(plan.total) }}</span>
          </div>
        </template>
        <div
          v-else
          class="plan-card__spend q-mt-sm text-ink text-amount text-weight-bold"
        >
          {{ formatAmount(plan.total) }}
        </div>
      </q-item-section>
    </q-item>

    <PlanCardMenu
      v-if="$q.screen.lt.md"
      :id="menuId"
      v-model="isActionsMenuOpen"
      context-menu
      touch-position
      :can-edit="canEdit"
      :can-share="isOwner"
      :plan-status="planStatus"
      @export="emit('export', plan.id)"
      @share="emit('share', plan.id)"
      @delete="showDeleteDialog"
      @cancel="showCancelDialog"
    />

    <DeleteDialog
      v-model="isDeleteDialogOpen"
      title="Delete plan"
      warning-message="This action cannot be undone. All plan data will be permanently removed."
      :confirmation-message="`Are you sure you want to delete &quot;${plan.name}&quot;?`"
      cancel-label="Cancel"
      confirm-label="Delete plan"
      @confirm="confirmDelete"
    />

    <DeleteDialog
      v-model="isCancelDialogOpen"
      title="Cancel plan"
      warning-message="This will mark the plan as cancelled and stop any active tracking."
      :confirmation-message="`Are you sure you want to cancel &quot;${plan.name}&quot;?`"
      cancel-label="Keep active"
      confirm-label="Cancel plan"
      @confirm="confirmCancel"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'

import PlanCardMenu from './PlanCardMenu.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import StatusPill from 'src/components/shared/StatusPill.vue'
import { statusColorToTone, type StatusTone } from 'src/components/shared/status-tone'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import {
  getPlanPace,
  getPlanStatus,
  getStatusText,
  getStatusColor,
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
  // Total spent in the plan. Null while unknown: the card then shows only the budget.
  spent?: number | null
  // Initials of the people this plan is shared with
  memberInitials?: string[]
}>()

const MAX_VISIBLE_MEMBERS = 3
const visibleInitials = computed(() => {
  const initials = props.memberInitials ?? []
  if (initials.length <= MAX_VISIBLE_MEMBERS) return initials
  const shown = MAX_VISIBLE_MEMBERS - 1
  return [...initials.slice(0, shown), `+${initials.length - shown}`]
})

const $q = useQuasar()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isDeleteDialogOpen = ref(false)
const isCancelDialogOpen = ref(false)
const isActionsMenuOpen = ref(false)

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const canEdit = computed(() => isOwner.value || props.plan.permission_level === 'edit')
const planStatus = computed(() => getPlanStatus(props.plan))
const isViewOnly = computed(() => props.plan.permission_level === 'view')
const menuButtonLabel = computed(() => `Actions for ${props.plan.name}`)
const menuId = computed(() => `plan-actions-${props.plan.id}`)

const hasSpend = computed(() => typeof props.spent === 'number' && (props.plan.total ?? 0) > 0)
const spentRatio = computed(() =>
  hasSpend.value ? Math.min((props.spent ?? 0) / (props.plan.total ?? 1), 1) : 0,
)

// "31 days left" goes in the caption only when the pill shows pace instead of it
const dateCaption = computed(() => {
  const range = formatDateRange(props.plan.start_date, props.plan.end_date)
  return planStatus.value === 'active' && hasSpend.value
    ? `${range}, ${getStatusText(props.plan)}`
    : range
})

// Active plans answer "how is it going?"; other plans show their lifecycle state.
const statusPill = computed((): { label: string; tone: StatusTone } => {
  const total = props.plan.total ?? 0
  const spent = props.spent ?? 0
  if (hasSpend.value && spent > total) {
    return { label: `${formatAmount(spent - total)} over`, tone: 'over' }
  }
  if (planStatus.value === 'active' && hasSpend.value) {
    const pace = getPlanPace(props.plan, total, spent)
    if (pace?.status === 'ahead') return { label: 'Ahead of plan', tone: 'pace' }
    return { label: 'On track', tone: 'success' }
  }
  return {
    label: getStatusText(props.plan),
    tone: statusColorToTone(getStatusColor(props.plan)),
  }
})

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}

function openPlan(): void {
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

.plan-card__members {
  display: inline-flex;
  flex: 0 0 auto;
  padding-left: 4px;
}

// Overlapping initial discs, ringed with the card colour
.plan-card__member {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: -6px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px hsl(var(--card));
  background: hsl(var(--muted));
  color: hsl(var(--primary));
  font-size: 10px;
  font-weight: 700;

  &:first-child {
    margin-left: 0;
  }
}

.plan-card__spend {
  font-size: 14px;
}

.plan-card__bar--pace {
  color: hsl(var(--pace-bar));
}

.plan-card__bar--over {
  color: hsl(var(--over));
}

// Pull the round menu button into the card padding so its icon lines up with the edge
.plan-card__menu {
  margin: -8px -10px -8px 0;
}
</style>
