<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      style="min-width: 500px; max-width: 600px"
      class="q-pa-none"
    >
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon
            name="eva-share-outline"
            class="q-mr-sm"
          />
          Share Template
        </div>
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

      <!-- Content -->
      <q-card-section class="q-pt-md">
        <!-- Current Shares Section - Moved to top -->
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

          <!-- Loading State -->
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

          <!-- Actual Content -->
          <div v-else-if="templatesStore.sharedUsers.length > 0">
            <q-list
              bordered
              class="rounded-borders"
            >
              <q-item
                v-for="user in templatesStore.sharedUsers"
                :key="user.user_id"
                class="q-pa-sm"
              >
                <q-item-section avatar>
                  <q-avatar
                    color="secondary"
                    text-color="white"
                    size="32px"
                  >
                    {{ getUserInitial(user.user_email) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ user.user_name || getUserDisplayName(user.user_email) }}
                  </q-item-label>
                  <q-item-label caption>{{ user.user_email }}</q-item-label>
                  <q-item-label caption> Shared {{ formatDate(user.shared_at) }} </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-select
                      :model-value="user.permission_level"
                      :options="permissionSelectOptions"
                      outlined
                      dense
                      emit-value
                      map-options
                      style="min-width: 100px"
                      @update:model-value="(value) => updateUserPermission(user.user_id, value)"
                    />
                    <q-btn
                      icon="eva-trash-2-outline"
                      flat
                      round
                      size="sm"
                      color="negative"
                      @click="confirmRemoveUser(user)"
                    >
                      <q-tooltip>Remove access</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Empty State -->
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

        <!-- Add People Section -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon
              name="eva-person-add-outline"
              class="q-mr-xs"
            />
            Add people
          </div>

          <!-- User Search with QSelect -->
          <q-select
            v-model="selectedUsers"
            :options="searchOptions"
            use-input
            use-chips
            multiple
            input-debounce="300"
            label="Search by email address"
            outlined
            :loading="templatesStore.isSearchingUsers"
            @filter="filterUsers"
          >
            <template #prepend>
              <q-icon name="eva-search-outline" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar
                    color="primary"
                    text-color="white"
                    size="32px"
                  >
                    {{ getUserInitial(scope.opt.email) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{
                    scope.opt.name || getUserDisplayName(scope.opt.email)
                  }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #selected-item="scope">
              <q-chip
                removable
                dense
                :tabindex="scope.tabindex"
                color="primary"
                text-color="white"
                @remove="scope.removeAtIndex(scope.index)"
              >
                <q-avatar
                  color="primary"
                  text-color="white"
                  size="20px"
                  class="q-mr-xs"
                >
                  {{ getUserInitial(scope.opt.email) }}
                </q-avatar>
                {{ scope.opt.name || getUserDisplayName(scope.opt.email) }}
              </q-chip>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-center">
                  <div v-if="templatesStore.isSearchingUsers">
                    <q-spinner-dots />
                    <div class="text-grey-6">Searching...</div>
                  </div>
                  <div v-else-if="currentSearchQuery && currentSearchQuery.trim()">
                    <q-icon
                      name="eva-search-outline"
                      size="2rem"
                      class="text-grey-5 q-mb-sm"
                    />
                    <div class="text-grey-7">No users found for "{{ currentSearchQuery }}"</div>
                    <div class="text-caption text-grey-5 q-mt-xs">
                      Try a different email address
                    </div>
                  </div>
                  <div v-else>
                    <div class="text-grey-6">Type an email address to search for users</div>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Help text -->
          <div class="text-caption text-grey-6 q-mt-sm">
            Search for existing users to share this template with
          </div>
        </div>

        <!-- Permission Selection -->
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
            inline
            class="q-mb-lg"
          />
        </div>
      </q-card-section>

      <!-- Actions -->
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
import { useQuasar, date } from 'quasar'
import { useTemplatesStore } from 'src/stores/templates'
import { useUserStore } from 'src/stores/user'
import { getUserInitial } from 'src/utils/name'
import { useDebounceFn } from '@vueuse/core'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

const props = defineProps<{
  templateId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shared'): void
}>()

const $q = useQuasar()
const templatesStore = useTemplatesStore()
const userStore = useUserStore()

// Local state
const selectedPermission = ref<'view' | 'edit'>('view')
const selectedUsers = ref<UserSearchResult[]>([])
const isLoading = ref(false)
const currentSearchQuery = ref('')
const isLoadingShares = ref(false)

// Computed properties
const currentUserId = computed(() => userStore.userProfile?.id)

// Search options for QSelect
const searchOptions = computed(() => {
  return templatesStore.userSearchResults.filter((user) => {
    const isAlreadyShared = templatesStore.sharedUsers.some((u) => u.user_id === user.id)
    const isCurrentUser = user.id === currentUserId.value
    const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)

    return !isAlreadyShared && !isCurrentUser && !isAlreadySelected
  })
})

// Debounced search
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (!query.trim()) {
    templatesStore.clearUserSearch()
    return
  }
  await templatesStore.searchUsers(query)
}, 300)

// Watch for dialog open to load shares
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.templateId) {
      isLoadingShares.value = true
      try {
        await templatesStore.loadTemplateShares(props.templateId)
      } finally {
        isLoadingShares.value = false
      }
    } else {
      // Reset state when closing
      selectedPermission.value = 'view'
      selectedUsers.value = []
      currentSearchQuery.value = ''
      isLoadingShares.value = false
      templatesStore.clearUserSearch()
    }
  },
  { immediate: true },
)

// Watch for templateId changes while dialog is open
watch(
  () => props.templateId,
  async (newTemplateId) => {
    if (props.modelValue && newTemplateId) {
      isLoadingShares.value = true
      try {
        await templatesStore.loadTemplateShares(newTemplateId)
      } finally {
        isLoadingShares.value = false
      }
    }
  },
)

const permissionOptions = [
  { label: 'Can view', value: 'view' },
  { label: 'Can edit', value: 'edit' },
]

const permissionSelectOptions = [
  { label: 'Can view', value: 'view' },
  { label: 'Can edit', value: 'edit' },
]

function getUserDisplayName(email: string): string {
  const atIndex = email.indexOf('@')
  return atIndex > 0 ? email.substring(0, atIndex) : email
}

function formatDate(dateString: string): string {
  return date.formatDate(dateString, 'MMM D, YYYY')
}

function closeDialog() {
  emit('update:modelValue', false)
}

function filterUsers(val: string, update: (fn: () => void) => void) {
  currentSearchQuery.value = val
  update(() => {
    debouncedSearch(val)
  })
}

function confirmRemoveUser(user: TemplateSharedUser) {
  $q.dialog({
    title: 'Remove Access',
    message: `Are you sure you want to remove access for ${user.user_name || user.user_email}?`,
    persistent: true,
    ok: {
      label: 'Remove',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    removeUserAccess(user.user_id)
  })
}

async function handleShare() {
  if (selectedUsers.value.length === 0) return

  isLoading.value = true
  try {
    const sharePromises = selectedUsers.value.map((user) =>
      templatesStore.shareTemplateWithUser(props.templateId, user.email, selectedPermission.value),
    )

    await Promise.all(sharePromises)

    // Clear selection after successful sharing
    selectedUsers.value = []
    templatesStore.clearUserSearch()

    emit('shared')
  } catch (error) {
    // Error is already handled by the store, but we can add additional UX feedback here
    console.error('Failed to share template:', error)
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
</script>
