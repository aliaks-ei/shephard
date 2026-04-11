<template>
  <div
    class="column no-wrap notifications-inbox"
    :class="mobile ? 'notifications-inbox--mobile' : 'notifications-inbox--desktop'"
  >
    <div
      v-if="showHeader"
      class="notifications-inbox__topbar col-auto"
    >
      <div class="notifications-inbox__title-block">
        <div class="notifications-inbox__title">Notifications</div>
      </div>

      <NotificationInboxHeaderActions
        :has-notifications="hasNotifications"
        :unread-count="unreadCount"
        @mark-all-read="$emit('mark-all-read')"
        @clear-all="$emit('clear-all')"
      />
    </div>

    <q-separator v-if="showHeader" />

    <q-scroll-area
      class="col notifications-scroll-area fit"
      :class="{ 'notifications-scroll-area--empty': !hasNotifications && !loading }"
    >
      <q-inner-loading
        :showing="loading"
        color="primary"
      />

      <div
        v-if="!hasNotifications && !loading"
        class="notifications-inbox__empty column items-center justify-center text-center"
      >
        <q-icon
          name="eva-bell-off-outline"
          size="28px"
          class="text-grey-5 q-mb-sm"
        />
        <div class="text-subtitle2 q-mb-xs">No notifications yet</div>
        <div class="notifications-inbox__empty-copy">
          Shared plans, templates, and access changes will appear here.
        </div>
      </div>

      <div
        v-else
        class="notifications-inbox__sections"
      >
        <section
          v-for="section in sections"
          :key="section.key"
          class="notifications-inbox__section"
          :data-section-key="section.key"
        >
          <div class="notifications-inbox__section-header">
            <span>{{ section.title }}</span>
            <span>{{ section.notifications.length }}</span>
          </div>

          <q-list>
            <template
              v-for="(notification, index) in section.notifications"
              :key="notification.id"
            >
              <q-item
                clickable
                class="notifications-inbox__item"
                :class="
                  mobile
                    ? 'notifications-inbox__item--mobile'
                    : 'notifications-inbox__item--desktop-row'
                "
                data-testid="notification-item"
                @click="$emit('open', notification)"
              >
                <q-item-section
                  avatar
                  top
                  class="notifications-inbox__avatar-section"
                >
                  <div class="notifications-inbox__leading">
                    <q-icon
                      :name="getNotificationIcon(notification.type)"
                      size="16px"
                    />
                  </div>
                </q-item-section>

                <q-item-section class="notifications-inbox__content">
                  <div class="row items-start justify-between no-wrap q-col-gutter-sm">
                    <div class="col notifications-inbox__title-col">
                      <div
                        class="notifications-inbox__item-title row items-center no-wrap"
                        :class="{ 'text-weight-medium': !notification.read_at }"
                      >
                        <span
                          v-if="!notification.read_at"
                          data-testid="notification-unread-dot"
                          class="notifications-inbox__dot q-mr-sm"
                        />
                        <span class="ellipsis">
                          {{ notification.title }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="notifications-inbox__actions row items-center no-wrap"
                      :class="mobile ? 'q-gutter-xs' : 'notifications-inbox__actions--desktop'"
                    >
                      <q-btn
                        v-if="!notification.read_at"
                        flat
                        round
                        dense
                        size="sm"
                        icon="eva-checkmark-outline"
                        class="notifications-inbox__icon-action"
                        aria-label="Mark notification as read"
                        @click.stop="$emit('mark-read', notification.id)"
                      >
                        <q-tooltip v-if="!mobile && !$q.screen.lt.md">Mark read</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        round
                        dense
                        size="sm"
                        icon="eva-trash-2-outline"
                        color="negative"
                        class="notifications-inbox__icon-action"
                        aria-label="Remove notification"
                        @click.stop="$emit('remove', notification.id)"
                      >
                        <q-tooltip v-if="!mobile && !$q.screen.lt.md"
                          >Remove notification</q-tooltip
                        >
                      </q-btn>
                    </div>
                  </div>

                  <div
                    class="notifications-inbox__item-body q-mt-xs"
                    :class="{ 'notifications-inbox__item-body--desktop': !mobile }"
                  >
                    {{ notification.body }}
                  </div>

                  <div class="row justify-end q-mt-xs">
                    <span class="notifications-inbox__time">
                      {{ formatNotificationRelativeTime(notification.created_at) }}
                    </span>
                  </div>
                </q-item-section>
              </q-item>

              <q-separator
                v-if="index < section.notifications.length - 1"
                inset
                class="no-border-radius"
              />
            </template>
          </q-list>
        </section>
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NotificationRecord } from 'src/api/notifications'
import NotificationInboxHeaderActions from './NotificationInboxHeaderActions.vue'
import {
  formatNotificationRelativeTime,
  getNotificationIcon,
  getNotificationSections,
} from 'src/utils/notifications'

const props = withDefaults(
  defineProps<{
    notifications: NotificationRecord[]
    unreadCount: number
    loading?: boolean
    mobile?: boolean
    showHeader?: boolean
  }>(),
  {
    loading: false,
    mobile: false,
    showHeader: true,
  },
)

defineEmits<{
  open: [notification: NotificationRecord]
  'mark-read': [notificationId: string]
  remove: [notificationId: string]
  'mark-all-read': []
  'clear-all': []
}>()

const hasNotifications = computed(() => props.notifications.length > 0)
const sections = computed(() => getNotificationSections(props.notifications))
</script>

<style lang="scss" scoped>
.notifications-inbox {
  width: 100%;
  background: hsl(var(--card));
}

.notifications-inbox--desktop {
  height: min(560px, 72vh);
  min-height: 420px;
}

.notifications-inbox--mobile {
  height: 100%;
  min-height: 0;
}

.notifications-inbox__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.notifications-inbox__title-block {
  min-width: 0;
}

.notifications-inbox__title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.2;
}

.notifications-inbox__avatar-section {
  min-width: 28px;
  padding-right: 8px;
}

.notifications-scroll-area {
  min-height: 0;
}

.notifications-scroll-area--empty :deep(.q-scrollarea__content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.notifications-inbox__empty {
  padding: 36px 20px;
}

.notifications-inbox__empty-copy {
  max-width: 260px;
  color: hsl(var(--muted-foreground));
  font-size: 0.87rem;
  line-height: 1.45;
}

.notifications-inbox__sections {
  padding: 2px 0 6px;
}

.notifications-inbox__section + .notifications-inbox__section {
  margin-top: 6px;
}

.notifications-inbox__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 5px;
  color: hsl(var(--muted-foreground));
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.notifications-inbox__item {
  align-items: flex-start;
  background: transparent;
  transition: background-color 0.18s ease;
}

.notifications-inbox__item--mobile {
  padding: 10px 12px;
}

.notifications-inbox__item--desktop-row {
  padding: 10px 14px;
}

.notifications-inbox__item:hover,
.notifications-inbox__item:focus-within {
  background: hsl(var(--muted) / 0.24);
}

.notifications-inbox__leading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.72);
}

.notifications-inbox__content {
  min-width: 0;
}

.notifications-inbox__title-col {
  min-width: 0;
}

.notifications-inbox__item-title {
  min-width: 0;
  color: hsl(var(--foreground));
  font-size: 0.9rem;
  line-height: 1.28;
}

.notifications-inbox__item-body {
  overflow: hidden;
  color: hsl(var(--muted-foreground));
  font-size: 0.82rem;
  line-height: 1.36;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.notifications-inbox__item-body--desktop {
  max-width: 100%;
}

.notifications-inbox__time {
  color: hsl(var(--muted-foreground));
  font-size: 0.71rem;
  white-space: nowrap;
}

.notifications-inbox__actions {
  flex: 0 0 auto;
}

.notifications-inbox__actions--desktop {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.notifications-inbox__item--desktop-row:hover .notifications-inbox__actions--desktop,
.notifications-inbox__item--desktop-row:focus-within .notifications-inbox__actions--desktop {
  opacity: 1;
  pointer-events: auto;
}

.notifications-inbox__dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: hsl(var(--primary));
}

.notifications-inbox__icon-action {
  color: hsl(var(--muted-foreground));
}

@media (max-width: 599px) {
  .notifications-inbox__section-header {
    padding: 9px 12px 5px;
  }
}
</style>
