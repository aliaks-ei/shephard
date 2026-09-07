<template>
  <q-card
    class="template-card full-height"
    :class="readonly ? '' : 'pressable'"
    :flat="readonly"
    :bordered="readonly"
  >
    <q-item
      class="template-card__row q-pa-md"
      :clickable="!readonly"
      @click="onCardClick"
    >
      <q-item-section class="template-card__main">
        <div class="row items-center no-wrap q-gutter-x-xs">
          <div class="template-card__name text-subtitle1 text-weight-bold ellipsis">
            {{ template.name }}
          </div>
          <template v-if="!readonly">
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
          </template>
        </div>
        <div class="text-caption text-muted">Total amount</div>
      </q-item-section>

      <q-item-section
        side
        class="template-card__meta items-end"
      >
        <div class="text-subtitle1 text-weight-bold text-amount template-card__amount">
          {{ formatAmount(template.total) }}
        </div>
        <StatusPill
          :label="template.duration"
          icon="eva-clock-outline"
          tone="info"
          class="q-mt-xs"
        />
      </q-item-section>

      <q-item-section
        v-if="!readonly"
        side
        class="template-card__actions"
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
          <TemplateCardMenu
            :id="menuId"
            v-model="isActionsMenuOpen"
            :can-edit="canEdit"
            :can-share="isOwner"
            @export="emit('export', template.id)"
            @share="emit('share', template.id)"
            @delete="showDeleteDialog"
          />
        </q-btn>
      </q-item-section>
    </q-item>

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
import StatusPill from 'src/components/shared/StatusPill.vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import type { TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'export', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: TemplateWithPermission): void
}>()

const props = withDefaults(
  defineProps<{
    template: TemplateWithPermission
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isDeleteDialogOpen = ref(false)
const isActionsMenuOpen = ref(false)

const isOwner = computed(() => props.template.owner_id === userStore.userProfile?.id)
const canEdit = computed(() => isOwner.value || props.template.permission_level === 'edit')
const isViewOnly = computed(() => props.template.permission_level === 'view')
const menuButtonLabel = computed(() => `Actions for ${props.template.name}`)
const menuId = computed(() => `template-actions-${props.template.id}`)

function formatAmount(amount: number | null | undefined): string {
  const currency = props.template.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}

function onCardClick(): void {
  if (!props.readonly) {
    emit('edit', props.template.id)
  }
}

function showDeleteDialog(): void {
  isDeleteDialogOpen.value = true
}

function confirmDelete(): void {
  emit('delete', props.template)
  isDeleteDialogOpen.value = false
}
</script>

<style scoped lang="scss">
.template-card__row {
  min-height: 0;
}

.template-card__main {
  min-width: 0;
}

.template-card__name {
  min-width: 0;
  line-height: 1.3;
}

.template-card__meta {
  padding-left: 12px;
}

.template-card__amount {
  color: hsl(var(--foreground));
  line-height: 1.3;
}

.template-card__actions {
  padding-left: 4px;
}
</style>
