<template>
  <SettingsSectionCard
    title="Notifications"
    description="Inbox alerts stay on. Push is optional and can be tailored by activity."
  >
    <q-list separator>
      <q-item
        class="notification-settings__item bg-transparent no-border-radius q-pl-sm q-pr-none q-py-sm"
      >
        <q-item-section avatar>
          <q-avatar
            size="36px"
            class="settings-section-card__icon-avatar"
            text-color="primary"
          >
            <q-icon
              name="eva-bell-outline"
              size="18px"
            />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2">Push notifications</q-item-label>
          <q-item-label
            caption
            class="notification-settings__helper"
            :class="helperToneClass"
          >
            {{ pushHelperText }}
          </q-item-label>
        </q-item-section>
        <q-item-section
          side
          class="q-pr-none q-pl-md"
        >
          <q-toggle
            :model-value="globalPushEnabled"
            checked-icon="eva-checkmark-outline"
            unchecked-icon="eva-close-outline"
            color="primary"
            :disable="globalToggleDisabled"
            data-testid="notification-global-toggle"
            @update:model-value="handleGlobalToggle"
          />
        </q-item-section>
      </q-item>

      <q-item
        clickable
        :disable="customizeDisabled"
        class="notification-settings__item bg-transparent no-border-radius q-pl-sm q-pr-none q-py-sm"
        data-testid="notification-customize-row"
        :data-disabled="customizeDisabled ? 'true' : 'false'"
        @click="toggleExpanded"
      >
        <q-item-section avatar>
          <q-avatar
            size="36px"
            class="settings-section-card__icon-avatar"
            text-color="primary"
          >
            <q-icon
              name="eva-options-2-outline"
              size="18px"
            />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2">Customize alerts</q-item-label>
          <q-item-label
            caption
            class="notification-settings__helper"
            :class="helperToneClass"
          >
            {{ customizeHelperText }}
          </q-item-label>
        </q-item-section>
        <q-item-section
          side
          class="q-pr-none q-pl-md"
        >
          <q-icon
            name="eva-chevron-down-outline"
            size="18px"
            class="notification-settings__chevron"
            :class="{ 'notification-settings__chevron--expanded': isExpanded }"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-slide-transition>
      <div
        v-show="isExpanded"
        class="q-pt-md"
        data-testid="notification-customize-panel"
        :data-expanded="isExpanded ? 'true' : 'false'"
      >
        <div
          v-for="group in notificationPreferenceGroups"
          :key="group.key"
          class="notification-settings__group"
        >
          <div class="notification-settings__group-title q-mb-xs">
            {{ group.title }}
          </div>

          <q-list
            dense
            separator
            class="q-mt-xs"
          >
            <q-item
              v-for="type in group.types"
              :key="type"
              class="notification-settings__toggle-item bg-transparent no-border-radius q-pl-sm q-pr-none q-py-xs"
            >
              <q-item-section>
                <q-item-label class="text-body2">
                  {{ notificationTypeLabels[type] }}
                </q-item-label>
              </q-item-section>
              <q-item-section
                side
                class="q-pr-none q-pl-md"
              >
                <q-toggle
                  :model-value="pushPreferences[type]"
                  checked-icon="eva-checkmark-outline"
                  unchecked-icon="eva-close-outline"
                  color="primary"
                  :disable="typeToggleDisabled"
                  :data-testid="`notification-type-toggle-${type}`"
                  @update:model-value="(value) => handleTypeToggle(type, value)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-slide-transition>
  </SettingsSectionCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from 'src/stores/user'
import {
  notificationPreferenceGroups,
  notificationTypeLabels,
  type NotificationType,
} from 'src/types/notifications'
import { usePushNotifications } from 'src/composables/usePushNotifications'
import SettingsSectionCard from './SettingsSectionCard.vue'

const userStore = useUserStore()
const {
  permission,
  isSupported,
  isSubscribed,
  isConfigLoading,
  isGlobalToggleLoading,
  canManagePush,
  pushConfig,
  pushPreferences,
  setPushNotificationsEnabled,
  updateNotificationTypePreference,
} = usePushNotifications()

const isExpanded = ref(false)

const globalPushEnabled = computed(() => userStore.preferences.arePushNotificationsEnabled)
const globalToggleDisabled = computed(() => {
  return (
    isConfigLoading.value ||
    isGlobalToggleLoading.value ||
    (!canManagePush.value && !globalPushEnabled.value)
  )
})
const customizeDisabled = computed(() => !canManagePush.value)
const typeToggleDisabled = computed(() => !globalPushEnabled.value || !canManagePush.value)

const helperToneClass = computed(() =>
  permission.value === 'denied' ? 'text-negative' : 'text-grey-6',
)

const pushHelperText = computed(() => {
  if (isConfigLoading.value) {
    return 'Checking push availability...'
  }

  if (!isSupported.value) {
    return 'Push is unavailable on this device. Inbox notifications still work.'
  }

  if (!pushConfig.value.configured) {
    return 'Push is not configured yet. Inbox notifications still work.'
  }

  if (permission.value === 'denied') {
    return 'Push is blocked in browser settings. Re-enable it there to resume delivery.'
  }

  if (globalPushEnabled.value && isSubscribed.value) {
    return 'Enabled for this browser.'
  }

  if (globalPushEnabled.value) {
    return 'Enabled in preferences. Waiting for browser subscription to finish.'
  }

  return 'Turn on push to receive alerts outside the in-app inbox.'
})

const customizeHelperText = computed(() => {
  if (isConfigLoading.value) {
    return 'Available after push setup is checked.'
  }

  if (!isSupported.value) {
    return 'Per-activity push alerts are unavailable on this device.'
  }

  if (!pushConfig.value.configured) {
    return 'Per-activity push alerts will appear once push is configured.'
  }

  if (permission.value === 'denied') {
    return 'Browser permission is blocked. Re-enable notifications to adjust alert types.'
  }

  if (!globalPushEnabled.value) {
    return 'Enable push first to choose which alerts reach this device.'
  }

  return 'Choose which activity types should trigger push notifications.'
})

async function handleGlobalToggle(value: boolean) {
  await setPushNotificationsEnabled(value)
}

async function handleTypeToggle(type: NotificationType, value: boolean) {
  await updateNotificationTypePreference(type, value)
}

function toggleExpanded() {
  if (customizeDisabled.value) {
    return
  }

  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
.notification-settings__item {
  min-height: 64px;
}

.notification-settings__helper {
  line-height: 1.4;
}

.notification-settings__chevron {
  color: hsl(var(--muted-foreground));
  transition: transform 180ms ease;
}

.notification-settings__chevron--expanded {
  transform: rotate(180deg);
}

.notification-settings__group + .notification-settings__group {
  margin-top: 14px;
}

.notification-settings__group-title {
  color: hsl(var(--muted-foreground));
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.notification-settings__toggle-item {
  min-height: 48px;
}

@media (max-width: 599px) {
  .notification-settings__item {
    min-height: 58px;
  }

  .notification-settings__item :deep(.text-body2),
  .notification-settings__toggle-item :deep(.text-body2) {
    font-size: 0.86rem;
    line-height: 1.24;
  }

  .notification-settings__helper {
    font-size: 0.72rem;
    line-height: 1.32;
  }

  .notification-settings__group-title {
    font-size: 0.68rem;
  }
}
</style>
