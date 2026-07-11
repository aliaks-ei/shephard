<template>
  <div class="row items-center no-wrap q-gutter-xs">
    <q-btn
      flat
      round
      dense
      size="sm"
      icon="eva-settings-2-outline"
      aria-label="Notification settings"
      class="notifications-header-actions__icon-btn text-muted"
      :to="{ name: 'settings' }"
      v-close-popup
    />

    <q-btn
      flat
      round
      dense
      size="sm"
      icon="eva-more-horizontal-outline"
      aria-label="Notification actions"
      aria-haspopup="menu"
      :aria-expanded="String(showActionsMenu)"
      aria-controls="notification-actions-menu"
      class="notifications-header-actions__icon-btn text-muted"
    >
      <q-menu
        id="notification-actions-menu"
        v-model="showActionsMenu"
        auto-close
        anchor="bottom right"
        self="top right"
        :offset="[0, 6]"
        class="notifications-header-actions__menu menu-list--wide border-subtle shadow-elevated"
      >
        <q-list dense>
          <q-item
            clickable
            :disable="!hasNotifications || unreadCount === 0"
            @click="$emit('mark-all-read')"
          >
            <q-item-section
              class="min-w-auto"
              avatar
            >
              <q-icon
                name="eva-checkmark-outline"
                size="16px"
              />
            </q-item-section>
            <q-item-section>Mark all read</q-item-section>
          </q-item>

          <q-item
            clickable
            :disable="!hasNotifications"
            @click="$emit('clear-all')"
          >
            <q-item-section
              class="min-w-auto"
              avatar
            >
              <q-icon
                name="eva-trash-2-outline"
                size="16px"
                color="negative"
              />
            </q-item-section>
            <q-item-section class="text-negative">Delete all</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  hasNotifications: boolean
  unreadCount: number
}>()

defineEmits<{
  'mark-all-read': []
  'clear-all': []
}>()

const showActionsMenu = ref(false)
</script>

<style scoped lang="scss">
.notifications-header-actions__icon-btn {
  width: 44px;
  min-width: 44px;
  height: 44px;
}

.notifications-header-actions__menu {
  border-radius: var(--radius-lg);
  background: hsl(var(--card));
}
</style>
