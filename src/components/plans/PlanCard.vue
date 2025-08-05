<template>
  <q-card
    class="full-height"
    flat
    bordered
  >
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
          <div class="col-2 text-right">
            <q-btn
              flat
              round
              size="sm"
              dense
              icon="eva-more-vertical-outline"
              class="text-grey-7"
              @click.stop
            >
              <PlanCardMenu
                :is-owner="isOwner"
                :permission-level="plan.permission_level"
                :plan-status="planStatus"
                @edit="emit('edit', plan.id)"
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
              <div class="text-caption text-grey-6 q-mb-xs">Total Amount</div>
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

          <div class="row items-center q-mt-sm">
            <div class="col">
              <div class="text-caption text-grey-6">
                {{ formatDateRange(plan.start_date, plan.end_date) }}
              </div>
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>

    <!-- Delete Confirmation Dialog -->
    <q-dialog
      v-model="isDeleteDialogOpen"
      persistent
    >
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Delete Plan</div>
          <p class="q-mb-md">
            Are you sure you want to delete "<strong>{{ plan.name }}</strong
            >"?
          </p>
          <p class="text-caption text-grey-6 q-mb-none">
            This action cannot be undone. All plan data will be permanently removed.
          </p>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-pt-none"
        >
          <q-btn
            flat
            label="Cancel"
            color="grey-7"
            @click="isDeleteDialogOpen = false"
          />
          <q-btn
            unelevated
            label="Delete Plan"
            color="negative"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cancel Confirmation Dialog -->
    <q-dialog
      v-model="isCancelDialogOpen"
      persistent
    >
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Cancel Plan</div>
          <p class="q-mb-md">
            Are you sure you want to cancel "<strong>{{ plan.name }}</strong
            >"?
          </p>
          <p class="text-caption text-grey-6 q-mb-none">
            This will mark the plan as cancelled and stop any active tracking.
          </p>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-pt-none"
        >
          <q-btn
            flat
            label="Keep Active"
            color="grey-7"
            @click="isCancelDialogOpen = false"
          />
          <q-btn
            unelevated
            label="Cancel Plan"
            color="warning"
            @click="confirmCancel"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import PlanCardMenu from './PlanCardMenu.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import {
  getPlanStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from 'src/utils/plans'
import {
  getPermissionText,
  getPermissionColor,
  getPermissionIcon,
} from 'src/utils/expense-templates'
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
