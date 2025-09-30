<template>
  <q-card
    class="full-height"
    :flat="readonly"
    :bordered="readonly"
    :class="readonly ? '' : 'shadow-1'"
  >
    <q-item
      class="full-height q-pa-md"
      :clickable="!readonly"
      @click="!readonly && emit('edit', template.id)"
    >
      <q-item-section class="justify-between">
        <div class="row items-start justify-between">
          <div class="col-auto">
            <h3 class="text-h6 text-weight-bold q-mt-none q-mb-xs">
              {{ template.name }}
            </h3>
            <div
              v-if="!readonly"
              class="row items-center q-gutter-xs"
            >
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
          <div
            v-if="!readonly && isOwner"
            class="col-auto text-right"
          >
            <q-btn
              flat
              round
              size="sm"
              icon="eva-more-vertical-outline"
              class="text-grey-7"
              @click.stop
            >
              <TemplateCardMenu
                :is-owner="isOwner"
                :permission-level="template.permission_level"
                @share="emit('share', template.id)"
                @delete="showDeleteDialog"
              />
            </q-btn>
          </div>
        </div>

        <div class="q-mt-lg">
          <div class="row items-end justify-between">
            <div class="col">
              <div class="text-h6 text-weight-bold text-primary">
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
          <div class="row items-center">
            <div class="col">
              <div class="text-caption text-grey-6">Total amount</div>
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>

    <!-- Delete Template Dialog -->
    <DeleteDialog
      v-model="isDeleteDialogOpen"
      title="Delete Template"
      warning-message="This action cannot be undone. All template data will be permanently removed."
      :confirmation-message="`Are you sure you want to delete &quot;${template.name}&quot;?`"
      cancel-label="Cancel"
      confirm-label="Delete Template"
      @confirm="confirmDelete"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import TemplateCardMenu from './TemplateCardMenu.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { getPermissionText, getPermissionColor, getPermissionIcon } from 'src/utils/templates'
import type { TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: TemplateWithPermission): void
}>()

const props = withDefaults(
  defineProps<{
    template: TemplateWithPermission
    hideSharedBadge?: boolean
    readonly?: boolean
  }>(),
  {
    hideSharedBadge: false,
    readonly: false,
  },
)

const userStore = useUserStore()

const isDeleteDialogOpen = ref(false)

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

function showDeleteDialog(): void {
  isDeleteDialogOpen.value = true
}

function confirmDelete(): void {
  emit('delete', props.template)
  isDeleteDialogOpen.value = false
}
</script>
