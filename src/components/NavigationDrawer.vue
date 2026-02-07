<template>
  <div class="column full-height">
    <q-list>
      <q-item
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        :active="isActive(item.to)"
        clickable
      >
        <q-item-section
          class="min-w-0"
          avatar
        >
          <q-icon :name="item.icon" />
        </q-item-section>
        <q-item-section> {{ item.label }} </q-item-section>
      </q-item>
    </q-list>

    <q-space />

    <div>
      <q-btn
        flat
        no-caps
        full-width
        align="left"
        class="q-pa-sm"
      >
        <UserAvatar
          size="36px"
          :avatar-url="userStore.userProfile?.avatarUrl"
          :name-initial="userStore.userProfile?.nameInitial"
        />
        <div class="col justify-start q-ml-sm text-left min-w-0">
          <div class="ellipsis">{{ userStore.userProfile?.displayName }}</div>
          <div class="text-caption ellipsis">
            {{ userStore.userProfile?.email }}
          </div>
        </div>
        <q-icon
          name="eva-chevron-up-outline"
          size="xs"
          class="q-ml-sm"
        />

        <q-menu
          anchor="top left"
          self="top right"
          :offset="[4, 0]"
        >
          <q-list style="min-width: 260px">
            <div class="row no-wrap items-center q-pa-sm">
              <UserAvatar
                :avatar-url="userStore.userProfile?.avatarUrl"
                :name-initial="userStore.userProfile?.nameInitial"
                size="40px"
              />
              <div class="q-ml-sm min-w-0">
                <div class="text-subtitle2 ellipsis">
                  {{ userStore.userProfile?.displayName }}
                </div>
                <div class="text-caption ellipsis">
                  {{ userStore.userProfile?.email }}
                </div>
              </div>
            </div>

            <q-separator />

            <q-item
              clickable
              v-close-popup
              to="/settings"
              exact
              class="q-py-sm"
            >
              <q-item-section
                class="min-w-0"
                avatar
              >
                <q-icon
                  name="eva-settings-2-outline"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>Settings</q-item-section>
            </q-item>

            <q-item
              clickable
              v-close-popup
              class="q-py-sm"
              @click="handleTogglePrivacy"
            >
              <q-item-section
                class="min-w-0"
                avatar
              >
                <q-icon
                  :name="privacyIcon"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>{{ privacyLabel }}</q-item-section>
            </q-item>

            <q-item
              clickable
              v-close-popup
              class="q-py-sm text-negative"
              @click="handleSignOut"
            >
              <q-item-section
                class="min-w-0"
                avatar
              >
                <q-icon
                  name="eva-log-out-outline"
                  size="sm"
                  color="negative"
                />
              </q-item-section>
              <q-item-section>Sign Out</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { useRouteActive } from 'src/composables/useRouteActive'
import UserAvatar from './UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const { isActive } = useRouteActive()

defineProps<{
  items: {
    icon: string
    label: string
    to: string
  }[]
}>()

const privacyIcon = computed(() => {
  return preferencesStore.isPrivacyModeEnabled ? 'eva-eye-off-outline' : 'eva-eye-outline'
})

const privacyLabel = computed(() => {
  return preferencesStore.isPrivacyModeEnabled ? 'Show amounts' : 'Hide amounts'
})

function handleTogglePrivacy() {
  void preferencesStore.togglePrivacyMode()
}

async function handleSignOut() {
  await userStore.signOut()
  await router.push('/auth')
}
</script>
