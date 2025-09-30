<template>
  <q-card class="full-height shadow-1">
    <q-item
      class="full-height q-pa-md"
      clickable
      @click="emit('edit', plan.id)"
    >
      <q-item-section class="justify-between">
        <div class="row items-start justify-between">
          <div class="col-10">
            <h3 class="text-h6 text-weight-bold q-mt-none q-mb-xs">
              {{ plan.name }}
            </h3>
            <div class="row items-center q-gutter-xs">
              <q-badge
                v-for="badge in planBadges"
                :key="badge.text"
                :color="badge.color"
                class="q-px-sm q-py-xs"
                outline
              >
                <q-icon
                  :name="badge.icon"
                  class="q-mr-xs"
                  size="12px"
                />
                {{ badge.text }}
              </q-badge>
            </div>
          </div>
          <div
            v-if="isOwner"
            class="col-2 text-right"
          >
            <q-btn
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

        <div class="q-mt-md">
          <div class="row items-end justify-between">
            <div class="col">
              <div class="text-h5 text-weight-bold text-primary">
                {{ formatAmount(plan.total) }}
              </div>
            </div>
            <div class="col-auto">
              <q-chip
                :color="getStatusColor(plan)"
                :icon="getStatusIcon(plan)"
                text-color="white"
                class="q-px-sm q-py-xs"
                size="sm"
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
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import {
  getPlanStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from 'src/utils/plans'
import { getPermissionText, getPermissionColor, getPermissionIcon } from 'src/utils/templates'
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

const isDeleteDialogOpen = ref(false)
const isCancelDialogOpen = ref(false)

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const hasShares = computed(() => isOwner.value && !!props.plan.is_shared)
const planStatus = computed(() => getPlanStatus(props.plan))

const planBadges = computed(() => {
  const badges: {
    text: string
    color: string
    icon: string
  }[] = []

  if (isOwner.value && hasShares.value && !props.hideSharedBadge) {
    badges.push({
      text: 'shared',
      color: 'info',
      icon: 'eva-people-outline',
    })
  }

  if (props.plan.permission_level) {
    badges.push({
      text: getPermissionText(props.plan.permission_level),
      color: getPermissionColor(props.plan.permission_level),
      icon: getPermissionIcon(props.plan.permission_level),
    })
  }

  return badges
})

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode
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
