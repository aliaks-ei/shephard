<template>
  <q-page
    padding
    class="row justify-center"
  >
    <div class="col-12 col-md-8 col-lg-6 q-pt-md">
      <div class="q-mb-md">
        <div class="row items-center">
          <div class="col-auto q-mr-lg">
            <UserAvatar
              :user="userStore.userProfile"
              size="100px"
            />
          </div>
          <div class="col">
            <div class="text-h4 q-mb-xs section-title">
              {{ userStore.userProfile?.displayName }}
            </div>
            <div class="text-subtitle1">{{ userStore.userProfile?.email }}</div>
          </div>
        </div>
      </div>

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
                :model-value="userStore.preferences.arePushNotificationsEnabled"
                @update:model-value="
                  (value) =>
                    userStore.updateUserProfile({
                      preferences: { pushNotificationsEnabled: value },
                    })
                "
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-item class="q-pa-sm card-bg">
            <q-item-section avatar>
              <q-icon
                :name="userStore.preferences.isDark ? 'dark_mode' : 'light_mode'"
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
                :model-value="userStore.preferences.isDark"
                color="primary"
                @update:model-value="
                  (value) => userStore.updateUserProfile({ preferences: { darkMode: value } })
                "
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="q-mb-xl">
        <h5 class="q-mt-none q-mb-md section-title text-primary">Account Information</h5>
        <q-separator class="q-mb-md separator" />

        <div class="row q-col-gutter-md q-col-gutter-y-xs">
          <InfoItem
            icon="email"
            label="Email"
            :value="userStore.userProfile?.email"
          />

          <InfoItem
            v-if="userStore.userProfile?.displayName"
            icon="person"
            label="Full Name"
            :value="userStore.userProfile.displayName"
          />

          <InfoItem
            v-if="userStore.userProfile?.authProvider"
            icon="login"
            label="Sign-in Provider"
            :value="userStore.userProfile.authProvider"
          />

          <InfoItem
            v-if="userStore.userProfile?.createdAt"
            icon="calendar_today"
            label="Joined On"
            :value="userStore.userProfile.formattedCreatedAt"
          />

          <InfoItem
            v-if="userStore.userProfile?.id"
            icon="fingerprint"
            label="User ID"
            :value="userStore.userProfile.id"
            full-width
          />
        </div>
      </div>

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

async function handleSignOut() {
  isSigningOut.value = true

  await userStore.signOut()

  await router.push('/auth')
  isSigningOut.value = false
}
</script>
