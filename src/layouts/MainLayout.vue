<template>
  <q-layout view="lHh Lpr fff">
    <q-inner-loading
      :showing="userStore.isLoading"
      label="Setting up your profile..."
      color="primary"
    />

    <template v-if="!userStore.isLoading">
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

          <UserDropdownMenu v-if="$q.screen.gt.sm" />

          <q-btn
            v-else
            round
            flat
            @click="showMobileUserDialog = true"
          >
            <UserAvatar
              :avatar-url="userStore.userProfile?.avatarUrl"
              :name-initial="userStore.userProfile?.nameInitial"
            />
          </q-btn>
        </q-toolbar>
      </q-header>

      <q-page-container
        class="page-container"
        :class="{ 'mobile-with-bottom-nav': showMobileBottomNav }"
      >
        <q-page
          :class="$q.screen.gt.sm ? 'shadow-1' : ''"
          padding
        >
          <router-view />
        </q-page>

        <q-page-sticky
          v-if="$q.screen.gt.sm"
          position="left"
          class="navigation-sticky-bg"
          expand
        >
          <NavigationDrawer
            class="fit q-py-xl q-px-sm"
            :items="navigationItems"
            is-mini-mode
          />
        </q-page-sticky>

        <MobileBottomNavigation
          v-if="showMobileBottomNav"
          @open-expense-dialog="showExpenseDialog = true"
        />
      </q-page-container>

      <!-- Dialogs -->
      <ExpenseRegistrationDialog
        v-model="showExpenseDialog"
        auto-select-recent-plan
      />

      <MobileUserDialog v-model="showMobileUserDialog" />
    </template>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import UserDropdownMenu from 'src/components/UserDropdownMenu.vue'
import UserAvatar from 'src/components/UserAvatar.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'
import MobileBottomNavigation from 'src/components/MobileBottomNavigation.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import MobileUserDialog from 'src/components/MobileUserDialog.vue'
import { useUserStore } from 'src/stores/user'
import { usePwaInstall } from 'src/composables/usePwaInstall'
import { useNotificationStore } from 'src/stores/notification'

const userStore = useUserStore()
const route = useRoute()
const $q = useQuasar()
const { isInstallable, promptInstall, dismissInstall } = usePwaInstall()
const notificationStore = useNotificationStore()

const showExpenseDialog = ref(false)
const showMobileUserDialog = ref(false)

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
          void promptInstall().then((result) => {
            if (result === 'accepted') {
              notificationStore.showSuccess('App installed successfully!')
            }
          })
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

const navigationItems = ref([
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
  {
    icon: 'eva-grid-outline',
    label: 'Categories',
    to: '/categories',
  },
])

const isDetailPage = computed(() => {
  return !!route.params.id || route.path.includes('/new')
})

const showMobileBottomNav = computed(() => {
  return $q.screen.lt.md && !isDetailPage.value
})
</script>

<style lang="scss" scoped>
.navigation-sticky-bg {
  background-color: var(--bg-color);
}

.mobile-with-bottom-nav {
  padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 115px;
  }
}
</style>
