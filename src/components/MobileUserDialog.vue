<template>
  <q-dialog
    :model-value="modelValue"
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="column">
      <q-card-section class="text-center relative-position q-pt-lg">
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          class="absolute"
          style="top: 8px; right: 8px"
          @click="emit('update:modelValue', false)"
        />

        <UserAvatar
          :avatar-url="userStore.userProfile?.avatarUrl"
          :name-initial="userStore.userProfile?.nameInitial"
          size="72px"
        />
        <h3 class="text-center q-mt-sm text-weight-bold text-h6 q-mb-none">
          {{ userStore.userProfile?.displayName }}
        </h3>
        <p class="text-center text-caption q-mb-none">
          {{ userStore.userProfile?.email }}
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section class="col q-pa-none">
        <q-list>
          <q-item
            clickable
            to="/settings"
            exact
            class="q-py-md"
            @click="emit('update:modelValue', false)"
          >
            <q-item-section
              style="min-width: auto"
              avatar
            >
              <q-icon
                name="eva-settings-2-outline"
                size="sm"
              />
            </q-item-section>
            <q-item-section>Settings</q-item-section>
          </q-item>

          <q-separator />

          <q-item
            class="q-py-md text-negative"
            clickable
            @click="handleSignOut"
          >
            <q-item-section
              style="min-width: auto"
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
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import UserAvatar from './UserAvatar.vue'

const userStore = useUserStore()
const router = useRouter()

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const handleSignOut = async () => {
  emit('update:modelValue', false)
  await userStore.signOut()
  await router.push('/auth')
}
</script>
