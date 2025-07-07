<template>
  <q-card
    class="full-height"
    flat
    bordered
  >
    <q-item
      class="full-height q-pa-md"
      clickable
      @click="emit('edit', template.id)"
    >
      <q-item-section class="justify-between">
        <div class="row items-start justify-between">
          <div class="col-10">
            <h3 class="text-h6 text-weight-bold q-mt-none q-mb-xs">
              {{ template.name }}
            </h3>
            <div class="row items-center q-gutter-xs">
              <q-badge
                v-for="badge in templateBadges"
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
              <ExpenseTemplateCardMenu
                :is-owner="isOwner"
                :permission-level="template.permission_level"
                @edit="emit('edit', template.id)"
                @share="emit('share', template.id)"
                @delete="emit('delete', template)"
              />
            </q-btn>
          </div>
        </div>

        <div class="q-mt-md">
          <div class="row items-end justify-between">
            <div class="col">
              <div class="text-caption text-grey-6 q-mb-xs">Total Amount</div>
              <div class="text-h5 text-weight-bold text-primary">
                {{ formatAmount(template.total) }}
              </div>
            </div>
            <div class="col-auto">
              <q-badge
                color="primary"
                text-color="white"
                class="q-px-sm q-py-xs"
              >
                <q-icon
                  name="eva-clock-outline"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ template.duration }}
              </q-badge>
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import ExpenseTemplateCardMenu from './ExpenseTemplateCardMenu.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import {
  getPermissionText,
  getPermissionColor,
  getPermissionIcon,
} from 'src/utils/expense-template'
import type { ExpenseTemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: ExpenseTemplateWithPermission): void
}>()

const props = withDefaults(
  defineProps<{
    template: ExpenseTemplateWithPermission
    hideSharedBadge?: boolean
  }>(),
  {
    hideSharedBadge: false,
  },
)

const userStore = useUserStore()

const isOwner = computed(() => props.template.owner_id === userStore.userProfile?.id)
const hasShares = computed(() => isOwner.value && !!props.template.is_shared)
const templateBadges = computed(() => {
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

  if (props.template.permission_level) {
    badges.push({
      text: getPermissionText(props.template.permission_level),
      color: getPermissionColor(props.template.permission_level),
      icon: getPermissionIcon(props.template.permission_level),
    })
  }

  return badges
})

function formatAmount(amount: number | null | undefined): string {
  const currency = props.template.currency as CurrencyCode
  return formatCurrency(amount, currency)
}
</script>
