<template>
  <div class="row justify-center page-content-spacing">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <!-- Profile Hero -->
      <div class="row items-center q-mb-lg q-pa-sm">
        <div class="col-auto q-mr-md">
          <UserAvatar
            :avatar-url="userStore.userProfile?.avatarUrl"
            :name-initial="userStore.userProfile?.nameInitial"
            :size="$q.screen.lt.md ? '72px' : '80px'"
          />
        </div>
        <div class="col">
          <div class="text-h5 q-mb-xs">
            {{ userStore.userProfile?.displayName }}
          </div>
          <div class="text-caption">{{ userStore.userProfile?.email }}</div>
        </div>
      </div>

      <!-- Preferences -->
      <q-card
        :bordered="$q.dark.isActive"
        class="shadow-1 q-mb-lg"
      >
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">Preferences</div>

          <q-list>
            <q-item class="q-pa-sm">
              <q-item-section avatar>
                <q-avatar
                  size="36px"
                  class="settings-icon-avatar"
                  text-color="primary"
                >
                  <q-icon
                    name="eva-credit-card-outline"
                    size="18px"
                  />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">Currency</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  :model-value="selectedCurrency"
                  :options="currencyOptions"
                  dense
                  outlined
                  emit-value
                  hide-bottom-space
                  @update:model-value="updatePreference('currency', $event)"
                />
              </q-item-section>
            </q-item>

            <q-item class="q-pa-sm">
              <q-item-section avatar>
                <q-avatar
                  size="36px"
                  class="settings-icon-avatar"
                  text-color="primary"
                >
                  <q-icon
                    :name="themeIcon"
                    size="18px"
                  />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">Theme</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  :model-value="selectedTheme"
                  :options="themeOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  hide-bottom-space
                  @update:model-value="updatePreference('theme', $event)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Sign Out -->
      <div class="text-center">
        <q-btn
          flat
          no-caps
          color="negative"
          icon="eva-log-out-outline"
          label="Sign Out"
          padding="sm lg"
          :loading="isSigningOut"
          @click="handleSignOut"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import UserAvatar from 'src/components/UserAvatar.vue'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
const router = useRouter()

const isSigningOut = ref(false)

const currencyOptions = [
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'British Pound (GBP)', value: 'GBP' },
  { label: 'Japanese Yen (JPY)', value: 'JPY' },
]

const themeOptions = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const selectedCurrency = computed(() => userStore.preferences.currency)
const selectedTheme = computed(() => userStore.preferences.theme)

const themeIcon = computed(() => {
  const theme = selectedTheme.value
  if (theme === 'system') return 'eva-monitor-outline'
  if (theme === 'dark') return 'eva-moon-outline'
  return 'eva-sun-outline'
})

function updatePreference(
  preferenceKey: 'pushNotificationsEnabled' | 'theme' | 'currency',
  value: boolean | string,
) {
  userStore.updateUserPreferences({
    preferences: { [preferenceKey]: value },
  })
}

async function handleSignOut() {
  isSigningOut.value = true

  await userStore.signOut()
  await router.push('/auth')

  isSigningOut.value = false
}
</script>

<style lang="scss" scoped>
.settings-icon-avatar {
  background: hsl(var(--muted));
}

:global(.body--dark) .settings-icon-avatar {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid hsl(var(--border));
}
</style>
