<template>
  <q-dialog
    :model-value="modelValue"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="column no-wrap"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <!-- Header -->
      <q-card-section class="row items-center q-py-sm">
        <div class="text-h6 q-my-none">Share {{ entityName }}</div>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          size="sm"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section
        class="col overflow-auto"
        :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
      >
        <!-- Search & Add -->
        <SharedUsersSelect
          v-model="selectedUsers"
          :current-user-id="currentUserId"
          :search-results="userSearchResults"
          :shared-users="sharedUsers"
          :loading="isSearchingUsers"
          @update:search-query="debouncedSearch"
        />

        <!-- Permission toggle (shown when users selected) -->
        <div
          v-if="selectedUsers.length > 0"
          class="q-mt-sm"
        >
          <q-btn-toggle
            v-model="selectedPermission"
            :options="permissionOptions"
            unelevated
            toggle-color="primary"
            size="sm"
            no-caps
            dense
          />
        </div>

        <!-- People with access -->
        <div class="q-mt-md">
          <div class="text-caption text-grey-6 q-mb-xs">
            People with access{{
              !isLoadingShares && sharedUsers.length > 0 ? ` (${sharedUsers.length})` : ''
            }}
          </div>

          <!-- Loading skeleton -->
          <q-list
            v-if="isLoadingShares"
            bordered
            class="rounded-borders"
          >
            <q-item
              v-for="n in 2"
              :key="n"
              class="q-py-xs q-px-sm"
            >
              <q-item-section avatar>
                <q-skeleton
                  type="QAvatar"
                  size="24px"
                />
              </q-item-section>
              <q-item-section>
                <q-skeleton
                  type="text"
                  width="40%"
                />
              </q-item-section>
              <q-item-section side>
                <q-skeleton
                  type="QBtn"
                  width="60px"
                  height="24px"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Shared users list -->
          <SharedUsersList
            v-else-if="sharedUsers.length > 0"
            :users="sharedUsers"
            :permission-options="permissionOptions"
            @update:user-permission="handleUpdateUserPermission"
            @remove:user="handleRemoveUserAccess"
          />

          <!-- Empty state -->
          <div
            v-else
            class="text-caption text-grey-6 q-py-sm"
          >
            Not shared with anyone yet
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions
        align="right"
        class="q-pa-sm safe-area-bottom"
      >
        <q-btn
          label="Cancel"
          flat
          no-caps
          @click="closeDialog"
        />
        <q-btn
          label="Share"
          color="primary"
          unelevated
          no-caps
          :loading="isSharing"
          :disable="selectedUsers.length === 0"
          @click="handleShare"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import SharedUsersList from 'src/components/shared/SharedUsersList.vue'
import SharedUsersSelect from 'src/components/shared/SharedUsersSelect.vue'
import { useUserStore } from 'src/stores/user'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

type SharedUser = TemplateSharedUser

type ShareDialogProps = {
  entityId: string
  entityName: string
  modelValue: boolean
  sharedUsers: SharedUser[]
  userSearchResults: UserSearchResult[]
  isSharing: boolean
  isSearchingUsers: boolean
  isLoadingShares: boolean
}

const props = defineProps<ShareDialogProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'share-with-user': [entityId: string, email: string, permission: 'view' | 'edit']
  'update-user-permission': [entityId: string, userId: string, permission: 'view' | 'edit']
  'remove-user-access': [entityId: string, userId: string]
  'search-users': [query: string]
  'clear-user-search': []
}>()

const userStore = useUserStore()

const permissionOptions = [
  { label: 'View', value: 'view' },
  { label: 'Edit', value: 'edit' },
]

const selectedPermission = ref<'view' | 'edit'>('view')
const selectedUsers = ref<UserSearchResult[]>([])

const currentUserId = computed(() => userStore.userProfile?.id)

const debouncedSearch = useDebounceFn((query: string) => {
  if (!query.trim()) {
    emit('clear-user-search')
    return
  }
  emit('search-users', query)
}, 300)

function closeDialog() {
  emit('update:modelValue', false)
}

function reset() {
  selectedPermission.value = 'view'
  selectedUsers.value = []
  emit('clear-user-search')
}

function handleShare() {
  if (selectedUsers.value.length === 0) return

  selectedUsers.value.forEach((user) => {
    emit('share-with-user', props.entityId, user.email, selectedPermission.value)
  })

  selectedUsers.value = []
  emit('clear-user-search')
}

function handleUpdateUserPermission(userId: string, permission: 'view' | 'edit') {
  emit('update-user-permission', props.entityId, userId, permission)
}

function handleRemoveUserAccess(userId: string) {
  emit('remove-user-access', props.entityId, userId)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen || !props.entityId) {
      reset()
    }
  },
  { immediate: true },
)
</script>
