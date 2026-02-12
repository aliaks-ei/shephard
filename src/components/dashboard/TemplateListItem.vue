<template>
  <q-item
    clickable
    @click="emit('click', template.id)"
  >
    <q-item-section
      side
      class="q-pr-sm"
    >
      <q-icon
        name="eva-bookmark-outline"
        color="primary"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="row items-center no-wrap">
        <span class="ellipsis">{{ template.name }}</span>
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
        {{ formatDuration(template.duration) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <span class="text-weight-medium text-body2">
        {{ formatAmount(template.total) }}
      </span>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import type { TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  click: [templateId: string]
}>()

const props = defineProps<{
  template: TemplateWithPermission
}>()

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isOwner = computed(() => props.template.owner_id === userStore.userProfile?.id)
const isViewOnly = computed(() => props.template.permission_level === 'view')

function formatDuration(duration: string): string {
  return duration.charAt(0).toUpperCase() + duration.slice(1)
}

function formatAmount(amount: number | null | undefined): string {
  const currency = props.template.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}
</script>
