<template>
  <q-dialog
    :model-value="modelValue"
    transition-show="scale"
    transition-hide="scale"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="column"
      :class="$q.screen.lt.md ? 'full-height' : ''"
    >
      <q-card-section class="row items-center q-pb-none">
        <h2 class="text-h6 q-my-none">
          <q-icon
            name="eva-share-outline"
            class="q-mr-sm"
          />
          Share {{ entityName }}
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

      <q-card-section class="q-pt-md col overflow-auto">
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon
              name="eva-people-outline"
              class="q-mr-xs"
            />
            People with access
            <q-chip
              v-if="!isLoadingShares && sharedUsers.length > 0"
              color="primary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            >
              {{ sharedUsers.length }}
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

          <div v-else-if="sharedUsers.length > 0">
            <SharedUsersList
              :users="sharedUsers"
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
            <div>This {{ entityName.toLowerCase() }} is not shared with anyone yet</div>
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
            :search-results="userSearchResults"
            :shared-users="sharedUsers"
            :loading="isSearchingUsers"
            @update:search-query="debouncedSearch"
          />

          <div class="text-caption text-grey-6 q-mt-sm">
            Search for existing users to share this {{ entityName.toLowerCase() }} with
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
        class="q-pa-md q-mt-auto"
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
          :loading="isLoading || isSharing"
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
import { useQuasar } from 'quasar'

import SharedUsersList from 'src/components/shared/SharedUsersList.vue'
import SharedUsersSelect from 'src/components/shared/SharedUsersSelect.vue'
import { useUserStore } from 'src/stores/user'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

const $q = useQuasar()

type SharedUser = TemplateSharedUser

interface ShareDialogProps {
  entityId: string
  entityName: string
  modelValue: boolean
  sharedUsers: SharedUser[]
  userSearchResults: UserSearchResult[]
  isSharing: boolean
  isSearchingUsers: boolean
}

const props = defineProps<ShareDialogProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shared'): void
  (e: 'load-shared-users', entityId: string): void
  (e: 'share-with-user', entityId: string, email: string, permission: 'view' | 'edit'): void
  (e: 'update-user-permission', entityId: string, userId: string, permission: 'view' | 'edit'): void
  (e: 'remove-user-access', entityId: string, userId: string): void
  (e: 'search-users', query: string): void
  (e: 'clear-user-search'): void
}>()

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
  isLoadingShares.value = false
  emit('clear-user-search')
}

function handleShare() {
  if (selectedUsers.value.length === 0) return

  isLoading.value = true

  try {
    selectedUsers.value.forEach((user) =>
      emit('share-with-user', props.entityId, user.email, selectedPermission.value),
    )

    selectedUsers.value = []
    emit('clear-user-search')
    emit('shared')
  } finally {
    isLoading.value = false
  }
}

function updateUserPermission(userId: string, permission: 'view' | 'edit') {
  emit('update-user-permission', props.entityId, userId, permission)
}

function removeUserAccess(userId: string) {
  emit('remove-user-access', props.entityId, userId)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen || !props.entityId) {
      reset()
      return
    }

    isLoadingShares.value = true
    emit('load-shared-users', props.entityId)
    isLoadingShares.value = false
  },
  { immediate: true },
)
</script>
