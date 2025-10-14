<template>
  <q-card
    :bordered="$q.dark.isActive"
    class="full-height shadow-1"
  >
    <q-item
      class="full-height q-pa-md"
      clickable
      @click="emit('edit', plan.id)"
    >
      <q-item-section class="justify-between">
        <div class="row items-start justify-between">
          <div class="col">
            <h3 class="text-h6 q-mt-none q-mb-xs">
              {{ plan.name }}
            </h3>
          </div>
          <div class="col-auto row items-center q-gutter-xs">
            <!-- View only indicator -->
            <q-icon
              v-if="isViewOnly"
              name="eva-lock-outline"
              size="16px"
              class="text-warning"
            >
              <q-tooltip>View only</q-tooltip>
            </q-icon>
            <!-- Shared with me indicator -->
            <q-icon
              v-if="!isOwner"
              name="eva-people-outline"
              size="16px"
              class="text-info"
            >
              <q-tooltip>Shared with me</q-tooltip>
            </q-icon>
            <!-- Menu button -->
            <q-btn
              v-if="isOwner"
              flat
              round
              size="sm"
              icon="eva-more-vertical-outline"
              class="text-grey-7"
              @click.stop
            >
              <PlanCardMenu
                :is-owner="isOwner"
                :permission-level="plan.permission_level"
                :plan-status="planStatus"
                @share="emit('share', plan.id)"
                @delete="showDeleteDialog"
                @cancel="showCancelDialog"
              />
            </q-btn>
          </div>
        </div>

        <div class="q-mt-lg">
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-subtitle1 text-weight-bold text-primary">
                {{ formatAmount(plan.total) }}
              </div>
            </div>
            <div class="col-auto">
              <q-chip
                :color="getStatusColor(plan)"
                :icon="getStatusIcon(plan)"
                text-color="white"
                size="sm"
                square
              >
                {{ getStatusText(plan) }}
              </q-chip>
            </div>
          </div>

          <div class="row items-center">
            <div class="col">
              <div class="text-caption text-grey-6">
                {{ formatDateRange(plan.start_date, plan.end_date) }}
              </div>
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>

    <!-- Delete Plan Dialog -->
    <DeleteDialog
      v-model="isDeleteDialogOpen"
      title="Delete Plan"
      warning-message="This action cannot be undone. All plan data will be permanently removed."
      :confirmation-message="`Are you sure you want to delete &quot;${plan.name}&quot;?`"
      cancel-label="Cancel"
      confirm-label="Delete Plan"
      @confirm="confirmDelete"
    />

    <!-- Cancel Plan Dialog -->
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
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
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
  (e: 'share', id: string): void
  (e: 'delete', plan: PlanWithPermission): void
  (e: 'cancel', plan: PlanWithPermission): void
}>()

const props = withDefaults(
  defineProps<{
    plan: PlanWithPermission
    hideSharedBadge?: boolean
  }>(),
  {
    hideSharedBadge: false,
  },
)

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isDeleteDialogOpen = ref(false)
const isCancelDialogOpen = ref(false)

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const planStatus = computed(() => getPlanStatus(props.plan))
const isViewOnly = computed(() => props.plan.permission_level === 'view')

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
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
