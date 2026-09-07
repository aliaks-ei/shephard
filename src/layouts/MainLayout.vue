<template>
  <q-layout view="hHh Lpr fFf">
    <q-header
      v-if="!hideHeader"
      class="app-header"
      :class="{
        'app-header--mobile': $q.screen.lt.md,
        'app-header--scrolled': isScrolled,
      }"
    >
      <q-toolbar>
        <q-toolbar-title>
          <q-btn
            v-if="!$q.screen.lt.md"
            class="text-h6 app-header__brand"
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
          :aria-controls="notificationsPopupId"
          class="q-mr-sm mobile-touch-target"
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
            id="notifications-menu"
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

        <q-btn
          v-if="$q.screen.lt.md"
          flat
          round
          dense
          icon="eva-settings-2-outline"
          aria-label="Settings"
          to="/settings"
          class="q-mr-sm mobile-touch-target"
        />

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
      class="bg-transparent safe-area-bottom-toolbar--glass app-footer"
    >
      <MobileBottomNavigation
        :can-add-expense="canAddExpense"
        @open-expense-dialog="openExpenseDialog"
      />
    </q-footer>

    <q-page-container>
      <q-page
        :class="!$q.screen.lt.md ? 'shadow-1' : ''"
        padding
      >
        <q-banner
          v-if="isOffline"
          dense
          rounded
          role="status"
          class="offline-banner bg-warning-soft text-warning-strong q-mb-md"
        >
          <template #avatar>
            <q-icon name="eva-wifi-off-outline" />
          </template>
          You are offline. Financial data may be out of date, and changes require a connection.
        </q-banner>

        <div
          v-if="userStore.isLoading"
          class="profile-bootstrap-skeleton page-content-spacing"
          role="status"
          aria-label="Setting up your profile"
        >
          <div class="row items-center q-mb-lg">
            <q-skeleton
              type="QAvatar"
              size="44px"
              class="q-mr-md"
            />
            <div class="col">
              <q-skeleton
                type="text"
                width="38%"
              />
              <q-skeleton
                type="text"
                width="58%"
              />
            </div>
          </div>
          <q-skeleton
            type="rect"
            height="144px"
            class="rounded-borders q-mb-md"
          />
          <q-skeleton
            type="rect"
            height="96px"
            class="rounded-borders"
          />
        </div>

        <router-view v-else />
      </q-page>
    </q-page-container>

    <!-- Dialogs -->
    <ExpenseDeleteDialog />

    <ExpenseRegistrationDialog
      v-if="canAddExpense && hasOpenedExpenseDialog"
      v-model="showExpenseDialog"
      auto-select-recent-plan
    />

    <AppDialogShell
      id="notifications-dialog"
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
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Notify, useQuasar } from 'quasar'

import PrivacyModeToggle from 'src/components/PrivacyModeToggle.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'
import MobileBottomNavigation from 'src/components/MobileBottomNavigation.vue'
import NotificationInbox from 'src/components/notifications/NotificationInbox.vue'
import NotificationInboxHeaderActions from 'src/components/notifications/NotificationInboxHeaderActions.vue'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
import ExpenseDeleteDialog from 'src/components/expenses/ExpenseDeleteDialog.vue'
import { useScrolledHeader } from 'src/composables/useScrolledHeader'
import { useUserStore } from 'src/stores/user'
import { usePwaInstall } from 'src/composables/usePwaInstall'
import { useInstallPromptGate } from 'src/composables/useInstallPromptGate'
import { useNotifications } from 'src/composables/useNotifications'
import { usePlansQuery } from 'src/queries/plans'
import { startNetworkMonitoring, useNetworkStatus } from 'src/composables/useNetworkStatus'

const userStore = useUserStore()
const userId = computed(() => userStore.userProfile?.id)
const { plansForExpenses } = usePlansQuery(userId)
const { isOnline, isOffline } = useNetworkStatus()
const canAddExpense = computed(() => isOnline.value && plansForExpenses.value.length > 0)
const route = useRoute()
const $q = useQuasar()
const { isScrolled } = useScrolledHeader()
const { isInstallable, isIosInstallGuidanceAvailable, promptInstall, dismissInstall } =
  usePwaInstall()
const { canShowInstallPrompt, markInstallPromptShown } = useInstallPromptGate()
const ExpenseRegistrationDialog = defineAsyncComponent(
  () => import('src/components/expenses/ExpenseRegistrationDialog.vue'),
)

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)
const showNotificationsMenu = ref(false)
const showNotificationsDialog = ref(false)
let stopNetworkMonitoring: (() => void) | null = null

onMounted(() => {
  stopNetworkMonitoring = startNetworkMonitoring()
})

onUnmounted(() => {
  stopNetworkMonitoring?.()
})

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
  if (!isOnline.value || !canAddExpense.value) return

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
const notificationsPopupId = computed(() => {
  return showNotificationsDesktopMenu.value ? 'notifications-menu' : 'notifications-dialog'
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

// Promote install only after the user has experienced value (first saved expense)
const shouldPromptInstall = computed(
  () => canShowInstallPrompt.value && (isInstallable.value || isIosInstallGuidanceAvailable.value),
)

watch(shouldPromptInstall, (promptable) => {
  if (promptable) {
    showPwaInstallNotification()
  }
})

function showPwaInstallNotification() {
  markInstallPromptShown()

  if (isIosInstallGuidanceAvailable.value) {
    Notify.create({
      message: 'Install Shephard: tap Share, then Add to Home Screen.',
      type: 'info',
      icon: 'eva-smartphone-outline',
      timeout: 0,
      actions: [
        {
          label: 'Not now',
          color: 'white',
          handler: dismissInstall,
        },
      ],
    })
    return
  }

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
    icon: 'eva-activity-outline',
    label: 'Activity',
    to: '/expenses',
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

// Detail pages carry their own back-button toolbar on mobile; a second bar on top
// of it is the biggest "old Material app" signal, so the global header steps aside.
const hideHeader = computed(() => $q.screen.lt.md && isDetailPage.value)
</script>

<style lang="scss" scoped>
// Neutral header: no brand-colored band. Desktop gets a card surface with a
// hairline; mobile is transparent over the page and turns into glass on scroll.
.app-header {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
  transition:
    background-color var(--duration-base) ease,
    border-color var(--duration-base) ease,
    box-shadow var(--duration-base) ease;

  :deep(.q-toolbar) {
    min-height: 56px;
  }
}

.app-header__brand {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.app-header--mobile {
  background: transparent;
  border-bottom-color: transparent;

  &.app-header--scrolled {
    background: hsl(var(--glass-bg-fallback));
    border-bottom-color: hsl(var(--glass-border-inner));

    @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
      background: hsl(var(--glass-bg));
      -webkit-backdrop-filter: saturate(var(--glass-saturation)) blur(var(--glass-blur));
      backdrop-filter: saturate(var(--glass-saturation)) blur(var(--glass-blur));
    }

    @media (prefers-reduced-transparency: reduce) {
      background: hsl(var(--card));
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
}

// Scrim behind the floating nav: scrolling rows fade out before they reach the bar
.app-footer {
  padding-top: 20px;
  background: linear-gradient(
    to top,
    hsl(var(--background)) 0%,
    hsl(var(--background) / 0.92) 55%,
    hsl(var(--background) / 0) 100%
  );
}

.navigation-drawer-bg {
  background-color: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
}

.profile-bootstrap-skeleton {
  max-width: 960px;
  margin-inline: auto;
}

:deep(.notifications-menu-panel) {
  border: 1px solid hsl(var(--glass-border-outer));
  border-radius: var(--radius-xl);
  background: hsl(var(--glass-bg-fallback));
  box-shadow: var(--glass-shadow);

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: hsl(var(--glass-bg));
    -webkit-backdrop-filter: saturate(var(--glass-saturation)) blur(var(--glass-blur));
    backdrop-filter: saturate(var(--glass-saturation)) blur(var(--glass-blur));
  }

  @media (prefers-reduced-transparency: reduce) {
    background: hsl(var(--card));
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
