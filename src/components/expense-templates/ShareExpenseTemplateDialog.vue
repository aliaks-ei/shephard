<template>
  <q-dialog
    :model-value="modelValue"
    transition-show="scale"
    transition-hide="scale"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 480px">
      <q-card-section class="row items-center q-pb-none">
        <h2 class="text-h6 q-my-none">
          <q-icon
            name="eva-share-outline"
            class="q-mr-sm"
          />
          Share Template
        </h2>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <q-card-section class="q-pt-md">
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon
              name="eva-people-outline"
              class="q-mr-xs"
            />
            People with access
            <q-chip
              v-if="!isLoadingShares && templatesStore.sharedUsers.length > 0"
              color="primary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            >
              {{ templatesStore.sharedUsers.length }}
            </q-chip>
          </div>

          <div v-if="isLoadingShares">
            <q-list
              bordered
              class="rounded-borders"
            >
              <q-item class="q-py-xs q-px-sm">
                <q-item-section avatar>
                  <q-skeleton
                    type="QAvatar"
                    size="32px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-skeleton
                    type="text"
                    width="60%"
                  />
                  <q-skeleton
                    type="text"
                    width="80%"
                  />
                  <q-skeleton
                    type="text"
                    width="40%"
                  />
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-skeleton
                      type="QBtn"
                      width="100px"
                      height="32px"
                    />
                    <q-skeleton
                      type="QBtn"
                      width="32px"
                      height="32px"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else-if="templatesStore.sharedUsers.length > 0">
            <SharedUsersList
              :users="templatesStore.sharedUsers"
              :permission-options="permissionOptions"
              @update:user-permission="updateUserPermission"
              @remove:user="removeUserAccess"
            />
          </div>

          <div
            v-else
            class="text-center q-py-md text-grey-6"
          >
            <q-icon
              name="eva-people-outline"
              size="2rem"
              class="q-mb-sm"
            />
            <div>This template is not shared with anyone yet</div>
          </div>
        </div>

        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon
              name="eva-person-add-outline"
              class="q-mr-xs"
            />
            Add people
          </div>

          <SharedUsersSelect
            v-model="selectedUsers"
            :current-user-id="currentUserId"
            :search-results="templatesStore.userSearchResults"
            :shared-users="templatesStore.sharedUsers"
            :loading="templatesStore.isSearchingUsers"
            @update:search-query="debouncedSearch"
          />

          <div class="text-caption text-grey-6 q-mt-sm">
            Search for existing users to share this template with
          </div>
        </div>

        <div v-if="selectedUsers.length > 0">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon
              name="eva-shield-outline"
              class="q-mr-xs"
            />
            Access level for selected users
          </div>
          <q-option-group
            v-model="selectedPermission"
            :options="permissionOptions"
            color="primary"
            class="q-mb-lg"
            inline
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md"
      >
        <q-btn
          label="Cancel"
          flat
          @click="closeDialog"
        />
        <q-btn
          label="Share"
          color="primary"
          unelevated
          :loading="isLoading || templatesStore.isSharing"
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

import SharedUsersList from './SharedUsersList.vue'
import SharedUsersSelect from './SharedUsersSelect.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useUserStore } from 'src/stores/user'
import type { UserSearchResult } from 'src/api'

const props = defineProps<{
  templateId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shared'): void
}>()

const templatesStore = useTemplatesStore()
const userStore = useUserStore()

const permissionOptions = [
  { label: 'Can view', value: 'view' },
  { label: 'Can edit', value: 'edit' },
]

const selectedPermission = ref<'view' | 'edit'>('view')
const selectedUsers = ref<UserSearchResult[]>([])
const isLoading = ref(false)
const isLoadingShares = ref(false)

const currentUserId = computed(() => userStore.userProfile?.id)

const debouncedSearch = useDebounceFn(async (query: string) => {
  if (!query.trim()) {
    templatesStore.clearUserSearch()
    return
  }
  await templatesStore.searchUsers(query)
}, 300)

function closeDialog() {
  emit('update:modelValue', false)
}

function reset() {
  selectedPermission.value = 'view'
  selectedUsers.value = []
  isLoadingShares.value = false
  templatesStore.clearUserSearch()
}

async function handleShare() {
  if (selectedUsers.value.length === 0) return

  isLoading.value = true

  try {
    const sharePromises = selectedUsers.value.map((user) =>
      templatesStore.shareTemplateWithUser(props.templateId, user.email, selectedPermission.value),
    )

    await Promise.all(sharePromises)

    selectedUsers.value = []
    templatesStore.clearUserSearch()

    emit('shared')
  } finally {
    isLoading.value = false
  }
}

async function updateUserPermission(userId: string, permission: 'view' | 'edit') {
  await templatesStore.updateUserPermission(props.templateId, userId, permission)
}

async function removeUserAccess(userId: string) {
  await templatesStore.unshareTemplateWithUser(props.templateId, userId)
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen || !props.templateId) {
      reset()
      return
    }

    try {
      isLoadingShares.value = true
      await templatesStore.loadTemplateShares(props.templateId)
    } finally {
      isLoadingShares.value = false
    }
  },
  { immediate: true },
)
</script>
