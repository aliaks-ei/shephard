<template>
  <!-- Mobile: small greeting next to the avatar, so the money figure leads the screen -->
  <div
    v-if="$q.screen.lt.md"
    class="dashboard-header row items-center no-wrap q-mb-md q-mt-xs"
  >
    <q-btn
      to="/settings"
      round
      flat
      dense
      :ripple="false"
      class="dashboard-header__avatar pressable"
      aria-label="Settings"
    >
      <UserAvatar
        :avatar-url="userStore.userProfile?.avatarUrl"
        :name-initial="userStore.userProfile?.nameInitial"
        size="40px"
      />
    </q-btn>
    <div class="col min-w-0 q-ml-md">
      <div class="dashboard-header__date">{{ today }}</div>
      <h1 class="dashboard-header__greeting q-my-none ellipsis">
        {{ greeting }}
      </h1>
    </div>
  </div>

  <div
    v-else
    class="q-mb-lg"
  >
    <h1 class="page-title q-my-none text-h4">
      {{ greeting }}
    </h1>
    <p class="q-ma-none text-muted text-body1">What would you like to do today?</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import UserAvatar from 'src/components/UserAvatar.vue'

const $q = useQuasar()
const userStore = useUserStore()

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  let timeGreeting: string

  if (hour < 12) {
    timeGreeting = 'Morning'
  } else if (hour < 18) {
    timeGreeting = 'Afternoon'
  } else {
    timeGreeting = 'Evening'
  }

  const displayName = userStore.userProfile?.displayName || ''
  const firstName = displayName.split(' ')[0] || displayName || 'there'

  return `${timeGreeting}, ${firstName}`
})
</script>

<style lang="scss" scoped>
.dashboard-header__avatar {
  display: inline-flex;
  border-radius: var(--radius-full);
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5);
  }
}

.dashboard-header__date {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.dashboard-header__greeting {
  font-size: 17px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.01em;
}
</style>
