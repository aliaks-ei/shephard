<template>
  <div class="row justify-center q-pa-md">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <div class="q-mb-md">
        <div class="row items-center">
          <div class="col-auto q-mr-lg">
            <UserAvatar
              :avatar-url="userStore.userProfile?.avatarUrl"
              :name-initial="userStore.userProfile?.nameInitial"
              size="100px"
            />
          </div>
          <div class="col">
            <div class="text-h4 q-mb-xs">
              {{ userStore.userProfile?.displayName }}
            </div>
            <div class="text-subtitle1">{{ userStore.userProfile?.email }}</div>
          </div>
        </div>
      </div>

      <q-card
        flat
        bordered
        class="q-my-lg"
      >
        <q-card-section>
          <h5 class="text-h6 q-mt-none q-mb-md">Preferences</h5>
          <q-separator class="q-mb-md separator" />

          <q-list>
            <q-item class="q-pa-sm card-bg q-mb-sm">
              <q-item-section avatar>
                <q-icon
                  name="eva-credit-card-outline"
                  color="primary"
                  size="md"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>Currency</q-item-label>
                <q-item-label caption> Select your preferred currency </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  :model-value="selectedCurrency"
                  :options="currencyOptions"
                  dense
                  outlined
                  emit-value
                  @update:model-value="updatePreference('currency', $event)"
                />
              </q-item-section>
            </q-item>

            <q-item class="q-pa-sm">
              <q-item-section avatar>
                <q-icon
                  :name="userStore.preferences.isDark ? 'eva-moon-outline' : 'eva-sun-outline'"
                  color="primary"
                  size="md"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>Dark Mode</q-item-label>
                <q-item-label caption> Toggle between light and dark theme </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  color="primary"
                  :model-value="userStore.preferences.isDark"
                  @update:model-value="updatePreference('darkMode', $event)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="q-mb-xl"
      >
        <q-card-section>
          <h5 class="text-h6 q-mt-none q-mb-md">Account Information</h5>
          <q-separator class="q-mb-md separator" />

          <div class="row q-col-gutter-md q-col-gutter-y-xs">
            <InfoItem
              icon="eva-email-outline"
              label="Email"
              :value="userStore.userProfile?.email"
            />

            <InfoItem
              v-if="userStore.userProfile?.displayName"
              icon="eva-person-outline"
              label="Full Name"
              :value="userStore.userProfile.displayName"
            />

            <InfoItem
              v-if="userStore.userProfile?.authProvider"
              icon="eva-log-in-outline"
              label="Sign-in Provider"
              :value="userStore.userProfile.authProvider"
            />

            <InfoItem
              v-if="userStore.userProfile?.createdAt"
              icon="eva-calendar-outline"
              label="Joined On"
              :value="userStore.userProfile.formattedCreatedAt"
            />
          </div>
        </q-card-section>
      </q-card>

      <div class="text-center">
        <q-btn
          color="negative"
          text-color="white"
          icon="eva-log-out-outline"
          label="Sign Out"
          padding="sm lg"
          no-caps
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
import InfoItem from 'src/components/InfoItem.vue'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
const router = useRouter()

const isSigningOut = ref(false)

const currencyOptions = [
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'British Pound (GBP)', value: 'GBP' },
]

const selectedCurrency = computed(() => userStore.preferences.currency)

function updatePreference(
  preferenceKey: 'pushNotificationsEnabled' | 'darkMode' | 'currency',
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
