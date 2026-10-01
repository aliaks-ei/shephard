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
        <div class="row items-center no-wrap">
          <div class="col min-w-0 row items-center no-wrap q-gutter-x-xs">
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
          <!-- Menu sits in the title row, so the bar and amount use the full card width -->
          <q-btn
            v-if="!readonly"
            flat
            round
            size="sm"
            icon="eva-more-vertical-outline"
            :aria-label="menuButtonLabel"
            aria-haspopup="menu"
            :aria-expanded="String(isActionsMenuOpen)"
            :aria-controls="menuId"
            class="template-card__menu text-muted mobile-touch-target"
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
        </div>
        <div class="text-caption text-muted">
          {{ durationLabel }}<template v-if="composition">, {{ itemCountLabel }}</template>
        </div>

        <!-- What the template holds, before you open it -->
        <div
          v-if="composition && composition.segments.length > 0"
          class="template-card__composition q-mt-md"
          aria-hidden="true"
        >
          <div
            v-for="(segment, index) in composition.segments"
            :key="index"
            class="template-card__segment category-tone-fg"
            :style="[getCategoryToneStyle(segment.color), { flexGrow: segment.share }]"
          />
        </div>

        <div
          class="template-card__amount text-subtitle1 text-weight-bold text-amount text-ink q-mt-sm"
        >
          {{ formatAmount(template.total) }}
        </div>
      </q-item-section>
    </q-item>

    <DeleteDialog
      v-model="isDeleteDialogOpen"
      title="Delete template"
      warning-message="This action cannot be undone. All template data will be permanently removed."
      :confirmation-message="`Are you sure you want to delete &quot;${template.name}&quot;?`"
      cancel-label="Cancel"
      confirm-label="Delete template"
      @confirm="confirmDelete"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import TemplateCardMenu from './TemplateCardMenu.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { getCategoryToneStyle } from 'src/utils/categories'
import type { TemplateWithPermission } from 'src/api'
import type { TemplateComposition } from 'src/composables/useTemplatesPage'

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
    composition?: TemplateComposition | null
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

const DURATION_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}
const durationLabel = computed(
  () => DURATION_LABELS[props.template.duration] ?? props.template.duration,
)
const itemCountLabel = computed(() => {
  const count = props.composition?.itemCount ?? 0
  return `${count} item${count === 1 ? '' : 's'}`
})

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

.template-card__composition {
  display: flex;
  gap: 2px;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
}

.template-card__segment {
  flex-basis: 0;
  min-width: 3px;
  background: currentColor;
}

// Pull the round menu button into the card padding so its icon lines up with the edge
.template-card__menu {
  margin: -8px -10px -8px 4px;
}
</style>
