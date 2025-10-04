<template>
  <q-layout view="lHh Lpr fff">
    <q-inner-loading
      :showing="userStore.isLoading"
      label="Setting up your profile..."
      color="primary"
    />

    <template v-if="!userStore.isLoading">
      <q-header elevated>
        <q-toolbar>
          <q-btn
            v-if="$q.screen.gt.sm"
            icon="eva-menu-outline"
            aria-label="Menu"
            flat
            round
            @click="toggleLeftDrawer"
          />
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
        </q-toolbar>
      </q-header>

      <q-drawer
        v-if="$q.screen.gt.sm"
        v-model="leftDrawerOpen"
        class="q-py-md"
        bordered
        behavior="mobile"
      >
        <NavigationDrawer :items="navigationItems" />
      </q-drawer>

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

      <ExpenseRegistrationDialog
        v-model="showExpenseDialog"
        auto-select-recent-plan
      />
    </template>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import UserDropdownMenu from 'src/components/UserDropdownMenu.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'
import MobileBottomNavigation from 'src/components/MobileBottomNavigation.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
const route = useRoute()
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const showExpenseDialog = ref(false)

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
  // Detail pages have :id parameter in route
  return !!route.params.id
})

const showMobileBottomNav = computed(() => {
  return $q.screen.lt.md && !isDetailPage.value
})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style lang="scss" scoped>
.navigation-sticky-bg {
  background-color: var(--bg-color);
}

.mobile-with-bottom-nav {
  padding-bottom: 70px;
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 115px;
  }
}
</style>
