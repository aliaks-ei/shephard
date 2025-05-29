<template>
  <q-page
    padding
    class="row justify-center"
  >
    <div class="col-12 col-md-8 col-lg-6 q-pt-md">
      <!-- User Profile Header -->
      <div class="q-mb-md">
        <div class="row items-center">
          <div class="col-auto q-mr-lg">
            <UserAvatar
              :user="userStore.currentUser"
              size="100px"
            />
          </div>
          <div class="col">
            <div class="text-h4 q-mb-xs section-title">{{ userStore.displayName }}</div>
            <div class="text-subtitle1">{{ userStore.userEmail }}</div>
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="q-mt-lg q-mb-xl">
        <h5 class="q-mt-none q-mb-md section-title text-primary">Preferences</h5>
        <q-separator class="q-mb-md separator" />

        <q-list>
          <q-item class="q-pa-sm card-bg q-mb-sm">
            <q-item-section avatar>
              <q-icon
                name="notifications"
                color="primary"
                size="md"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-primary">Notifications</q-item-label>
              <q-item-label
                caption
                class="text-caption"
              >
                Enable push notifications
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                :model-value="userStore.arePushNotificationsEnabled"
                @update:model-value="
                  (value) => userStore.updatePreferences({ pushNotificationsEnabled: value })
                "
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-item class="q-pa-sm card-bg">
            <q-item-section avatar>
              <q-icon
                :name="userStore.isDarkMode ? 'dark_mode' : 'light_mode'"
                color="primary"
                size="md"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-primary">Dark Mode</q-item-label>
              <q-item-label
                caption
                class="text-caption"
              >
                Toggle between light and dark theme
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                :model-value="userStore.isDarkMode"
                color="primary"
                @update:model-value="(value) => userStore.updatePreferences({ darkMode: value })"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Account Information Section -->
      <div class="q-mb-xl">
        <h5 class="q-mt-none q-mb-md section-title text-primary">Account Information</h5>
        <q-separator class="q-mb-md separator" />

        <div class="row q-col-gutter-md q-col-gutter-y-xs">
          <InfoItem
            icon="email"
            label="Email"
            :value="userStore.userEmail"
          />

          <InfoItem
            v-if="userStore.displayName"
            icon="person"
            label="Full Name"
            :value="userStore.displayName"
          />

          <InfoItem
            v-if="userStore.authProvider"
            icon="login"
            label="Sign-in Provider"
            :value="userStore.authProvider"
          />

          <InfoItem
            v-if="userStore.createdAt"
            icon="calendar_today"
            label="Joined On"
            :value="userStore.formattedCreatedAt"
          />

          <InfoItem
            v-if="userStore.userId"
            icon="fingerprint"
            label="User ID"
            :value="userStore.userId"
            fullWidth
            valueClass="ellipsis text-primary"
          />
        </div>
      </div>

      <!-- Sign Out Button -->
      <div class="q-mt-xl text-center">
        <q-btn
          color="negative"
          text-color="white"
          icon="logout"
          label="Sign Out"
          padding="sm lg"
          :loading="isSigningOut"
          @click="handleSignOut"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import UserAvatar from 'src/components/UserAvatar.vue'
import InfoItem from 'src/components/InfoItem.vue'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
const router = useRouter()

const isSigningOut = ref(false)

// Handle sign out
async function handleSignOut() {
  isSigningOut.value = true

  const { error } = await userStore.signOut()

  if (error) return

  await router.push('/auth')
  isSigningOut.value = false
}
</script>
