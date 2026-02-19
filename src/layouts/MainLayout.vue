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
            no-caps
          />
        </q-toolbar-title>

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
      class="bg-transparent mobile-nav-footer"
    >
      <MobileBottomNavigation @open-expense-dialog="showExpenseDialog = true" />
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
      v-model="showExpenseDialog"
      auto-select-recent-plan
    />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import PrivacyModeToggle from 'src/components/PrivacyModeToggle.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'
import MobileBottomNavigation from 'src/components/MobileBottomNavigation.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useUserStore } from 'src/stores/user'
import { usePwaInstall } from 'src/composables/usePwaInstall'
import { useNotificationStore } from 'src/stores/notification'

const userStore = useUserStore()
const route = useRoute()
const $q = useQuasar()
const { isInstallable, promptInstall, dismissInstall } = usePwaInstall()
const notificationStore = useNotificationStore()

const showExpenseDialog = ref(false)

watch(isInstallable, (installable) => {
  if (installable) {
    showPwaInstallNotification()
  }
})

function showPwaInstallNotification() {
  notificationStore.showNotification('Install Shephard for a better experience!', 'info', {
    timeout: 0, // Persistent notification
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

.mobile-nav-footer {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
