<template>
  <q-layout view="hHh Lpr fFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>
          <q-btn
            class="text-h6"
            label="Shephard"
            to="/"
            flat
            dense
            no-caps
          />
        </q-toolbar-title>

        <q-btn
          flat
          round
          dense
          icon="eva-bell-outline"
          aria-label="Notifications"
          :aria-haspopup="notificationsPopupType"
          :aria-expanded="String(notificationsPopupExpanded)"
          class="q-mr-sm"
          @click="handleNotificationsButtonClick"
        >
          <q-badge
            v-if="unreadCount > 0"
            floating
            rounded
            color="negative"
          >
            {{ unreadCountLabel }}
          </q-badge>

          <q-menu
            v-if="showNotificationsDesktopMenu"
            v-model="showNotificationsMenu"
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            class="notifications-menu-panel overflow-hidden"
            :style="notificationsMenuStyle"
          >
            <NotificationInbox
              :notifications="notifications"
              :unread-count="unreadCount"
              :loading="isNotificationsLoading"
              @open="handleOpenNotification"
              @mark-read="markAsRead"
              @remove="removeNotification"
              @mark-all-read="markAllAsRead"
              @clear-all="clearAllNotifications"
            />
          </q-menu>
        </q-btn>

        <PrivacyModeToggle
          v-if="$q.screen.lt.md"
          class="q-mr-sm"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      side="left"
      :width="250"
      :breakpoint="1024"
      no-swipe-open
      no-swipe-close
      class="navigation-drawer-bg"
    >
      <NavigationDrawer
        class="fit q-pt-lg q-pb-sm q-px-sm"
        :items="navigationItems"
      />
    </q-drawer>

    <q-footer
      v-if="showMobileBottomNav"
      class="bg-transparent safe-area-bottom-toolbar--glass"
    >
      <MobileBottomNavigation @open-expense-dialog="openExpenseDialog" />
    </q-footer>

    <q-page-container>
      <q-page
        :class="$q.screen.gt.sm ? 'shadow-1' : ''"
        padding
      >
        <q-inner-loading
          :showing="userStore.isLoading"
          label="Setting up your profile..."
          color="primary"
        />

        <router-view v-if="!userStore.isLoading" />
      </q-page>
    </q-page-container>

    <!-- Dialogs -->
    <ExpenseRegistrationDialog
      v-if="hasOpenedExpenseDialog"
      v-model="showExpenseDialog"
      auto-select-recent-plan
    />

    <AppDialogShell
      v-model="showNotificationsDialog"
      title="Notifications"
      body-class="q-pa-none"
      :body-scrollable="false"
    >
      <template #mobile-header-extra>
        <NotificationInboxHeaderActions
          :has-notifications="notifications.length > 0"
          :unread-count="unreadCount"
          @mark-all-read="markAllAsRead"
          @clear-all="clearAllNotifications"
        />
      </template>

      <NotificationInbox
        mobile
        class="col"
        :notifications="notifications"
        :unread-count="unreadCount"
        :loading="isNotificationsLoading"
        :show-header="false"
        @open="handleOpenNotification"
        @mark-read="markAsRead"
        @remove="removeNotification"
        @mark-all-read="markAllAsRead"
        @clear-all="clearAllNotifications"
      />
    </AppDialogShell>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar, useMeta, Notify } from 'quasar'

import PrivacyModeToggle from 'src/components/PrivacyModeToggle.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'
import MobileBottomNavigation from 'src/components/MobileBottomNavigation.vue'
import NotificationInbox from 'src/components/notifications/NotificationInbox.vue'
import NotificationInboxHeaderActions from 'src/components/notifications/NotificationInboxHeaderActions.vue'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
import { useUserStore } from 'src/stores/user'
import { usePwaInstall } from 'src/composables/usePwaInstall'
import { useNotifications } from 'src/composables/useNotifications'

useMeta({
  titleTemplate: (title) => `${title} | Shephard`,
})

const userStore = useUserStore()
const route = useRoute()
const $q = useQuasar()
const { isInstallable, promptInstall, dismissInstall } = usePwaInstall()
const ExpenseRegistrationDialog = defineAsyncComponent(
  () => import('src/components/expenses/ExpenseRegistrationDialog.vue'),
)

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)
const showNotificationsMenu = ref(false)
const showNotificationsDialog = ref(false)

const {
  notifications,
  unreadCount,
  isLoading: isNotificationsLoading,
  openNotification,
  markAsRead,
  removeNotification,
  markAllAsRead,
  clearAllNotifications,
} = useNotifications()

function openExpenseDialog() {
  hasOpenedExpenseDialog.value = true
  showExpenseDialog.value = true
}

const unreadCountLabel = computed(() => {
  return unreadCount.value > 99 ? '99+' : String(unreadCount.value)
})

const showNotificationsDesktopMenu = computed(() => !$q.screen.lt.md)
const notificationsPopupType = computed(() => {
  return showNotificationsDesktopMenu.value ? 'menu' : 'dialog'
})
const notificationsPopupExpanded = computed(() => {
  return showNotificationsDesktopMenu.value
    ? showNotificationsMenu.value
    : showNotificationsDialog.value
})

const notificationsMenuStyle = {
  width: 'min(420px, calc(100vw - 16px))',
  maxWidth: '420px',
}

function handleNotificationsButtonClick() {
  if (!showNotificationsDesktopMenu.value) {
    showNotificationsDialog.value = true
  }
}

async function handleOpenNotification(notification: (typeof notifications.value)[number]) {
  await openNotification(notification)
  showNotificationsMenu.value = false
  showNotificationsDialog.value = false
}

watch(isInstallable, (installable) => {
  if (installable) {
    showPwaInstallNotification()
  }
})

function showPwaInstallNotification() {
  Notify.create({
    message: 'Install Shephard for a better experience!',
    type: 'info',
    icon: 'eva-info-outline',
    timeout: 0,
    actions: [
      {
        label: 'Install',
        color: 'white',
        handler: () => {
          void promptInstall()
        },
      },
      {
        label: 'Not now',
        color: 'white',
        handler: () => {
          dismissInstall()
        },
      },
    ],
  })
}

const navigationItems = [
  {
    icon: 'eva-home-outline',
    label: 'Home',
    to: '/',
  },
  {
    icon: 'eva-calendar-outline',
    label: 'Plans',
    to: '/plans',
  },
  {
    icon: 'eva-file-text-outline',
    label: 'Templates',
    to: '/templates',
  },
]

const isDetailPage = computed(() => {
  return !!route.params.id || route.path.includes('/new')
})

const showMobileBottomNav = computed(() => {
  return $q.screen.lt.md && !isDetailPage.value
})
</script>

<style lang="scss" scoped>
.navigation-drawer-bg {
  background-color: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
}

:deep(.notifications-menu-panel) {
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-xl);
  background: hsl(var(--card));
  box-shadow: var(--shadow-lg);
}
</style>
