<template>
  <div v-if="visible !== false">
    <!-- Bottom Navigation Bar -->
    <q-page-sticky
      position="bottom"
      expand
      :offset="[0, 0]"
      class="mobile-bottom-nav"
    >
      <div
        class="full-width q-pa-sm shadow-up-1"
        :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white'"
      >
        <div class="row q-gutter-xs items-end">
          <!-- Home -->
          <div class="col">
            <q-btn
              icon="eva-home-outline"
              label="Home"
              to="/"
              :color="isActive('/') ? 'primary' : undefined"
              flat
              stack
              dense
              no-caps
              class="full-width"
            />
          </div>

          <!-- Plans -->
          <div class="col">
            <q-btn
              icon="eva-calendar-outline"
              label="Plans"
              to="/plans"
              :color="isActive('/plans') ? 'primary' : undefined"
              flat
              stack
              no-caps
              dense
              class="full-width"
            />
          </div>

          <!-- Spacer for FAB -->
          <div class="col relative-position">
            <q-btn
              fab
              icon="eva-plus-outline"
              color="primary"
              class="absolute"
              style="bottom: 36px; left: 50%; transform: translateX(-50%)"
              @click="emit('open-expense-dialog')"
            />
          </div>

          <!-- Templates -->
          <div class="col">
            <q-btn
              icon="eva-file-text-outline"
              label="Templates"
              to="/templates"
              :color="isActive('/templates') ? 'primary' : undefined"
              flat
              stack
              no-caps
              dense
              class="full-width"
            />
          </div>

          <!-- User Avatar -->
          <div class="col text-center">
            <q-btn
              flat
              no-caps
              class="q-pa-xs q-my-xs q-ml-md q-mr-md"
            >
              <UserAvatar
                size="48px"
                :avatar-url="userStore.userProfile?.avatarUrl"
                :name-initial="userStore.userProfile?.nameInitial"
              />

              <MobileUserMenu />
            </q-btn>
          </div>
        </div>
      </div>
    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import UserAvatar from './UserAvatar.vue'
import MobileUserMenu from './MobileUserMenu.vue'

const emit = defineEmits<{
  (e: 'open-expense-dialog'): void
}>()

withDefaults(
  defineProps<{
    visible?: boolean
  }>(),
  {
    visible: true,
  },
)

const route = useRoute()
const $q = useQuasar()
const userStore = useUserStore()

const isActive = (itemTo: string) => {
  if (itemTo === '/') {
    return route.fullPath === '/'
  }

  return route.fullPath.startsWith(itemTo)
}
</script>

<style scoped>
.mobile-bottom-nav {
  z-index: 2000;
}
</style>
