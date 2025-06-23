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
        <!-- User Search Section -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Add people</div>

          <!-- Search Input -->
          <q-input
            :model-value="searchQuery"
            label="Search by email address"
            outlined
            :loading="templatesStore.isSearchingUsers"
            @update:model-value="searchUsers"
          >
            <template #prepend>
              <q-icon name="eva-search-outline" />
            </template>
          </q-input>

          <!-- Search Results -->
          <div
            v-if="filteredSearchResults.length > 0"
            class="q-mt-sm"
          >
            <q-list
              bordered
              class="rounded-borders"
            >
              <q-item
                v-for="user in filteredSearchResults"
                :key="user.id"
                clickable
                @click="selectUser(user)"
              >
                <q-item-section avatar>
                  <q-avatar
                    color="primary"
                    text-color="white"
                    size="32px"
                  >
                    {{ getUserInitial(user.email) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ user.name || getUserDisplayName(user.email) }}</q-item-label>
                  <q-item-label caption>{{ user.email }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="eva-plus-outline"
                    flat
                    round
                    size="sm"
                    color="primary"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- No Results Message -->
          <div
            v-else-if="searchQuery && !templatesStore.isSearchingUsers"
            class="text-center q-mt-md q-py-md text-grey-6"
          >
            <q-icon
              name="eva-search-outline"
              size="2rem"
              class="q-mb-sm"
            />
            <div>No users found with that email address</div>
          </div>
        </div>

        <!-- Selected Users Section -->
        <div
          v-if="selectedUsers.length > 0"
          class="q-mb-lg"
        >
          <div class="text-subtitle2 q-mb-sm">Selected users</div>
          <q-list
            bordered
            class="rounded-borders"
          >
            <q-item
              v-for="user in selectedUsers"
              :key="user.id"
            >
              <q-item-section avatar>
                <q-avatar
                  color="primary"
                  text-color="white"
                  size="32px"
                >
                  {{ getUserInitial(user.email) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name || getUserDisplayName(user.email) }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  icon="eva-close-outline"
                  flat
                  round
                  size="sm"
                  @click="deselectUser(user.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Permission Selection -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Access level</div>
          <q-option-group
            v-model="selectedPermission"
            :options="permissionOptions"
            color="primary"
            inline
            class="q-mt-sm"
          />
        </div>

        <!-- Current Shares Section -->
        <div v-if="templatesStore.sharedUsers.length > 0">
          <div class="text-subtitle2 q-mb-sm">People with access</div>
          <q-list
            bordered
            class="rounded-borders"
          >
            <q-item
              v-for="user in templatesStore.sharedUsers"
              :key="user.user_id"
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
                <q-item-label>{{
                  user.user_name || getUserDisplayName(user.user_email)
                }}</q-item-label>
                <q-item-label caption>{{ user.user_email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="column items-end q-gutter-sm">
                  <q-option-group
                    :model-value="user.permission_level"
                    :options="permissionSelectOptions"
                    color="primary"
                    inline
                    dense
                    @update:model-value="(value) => updateUserPermission(user.user_id, value)"
                  />
                  <q-btn
                    icon="eva-trash-2-outline"
                    flat
                    round
                    size="sm"
                    color="negative"
                    @click="removeUserAccess(user.user_id)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
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
import { useTemplatesStore } from 'src/stores/templates'
import { useUserStore } from 'src/stores/user'
import { getUserInitial } from 'src/utils/name'
import { useDebounceFn } from '@vueuse/core'
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

// Local state
const selectedPermission = ref<'view' | 'edit'>('view')
const searchQuery = ref('')
const selectedUsers = ref<UserSearchResult[]>([])
const isLoading = ref(false)

// Computed properties
const currentUserId = computed(() => userStore.userProfile?.id)

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
      await templatesStore.loadTemplateShares(props.templateId)
    } else {
      // Reset state when closing
      selectedPermission.value = 'view'
      searchQuery.value = ''
      selectedUsers.value = []
      templatesStore.clearUserSearch()
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

// Filtered search results
const filteredSearchResults = computed(() => {
  return templatesStore.userSearchResults.filter((user) => {
    const isAlreadyShared = templatesStore.sharedUsers.some((u) => u.user_id === user.id)
    const isCurrentUser = user.id === currentUserId.value
    const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)

    return !isAlreadyShared && !isCurrentUser && !isAlreadySelected
  })
})

function getUserDisplayName(email: string): string {
  const atIndex = email.indexOf('@')
  return atIndex > 0 ? email.substring(0, atIndex) : email
}

function closeDialog() {
  emit('update:modelValue', false)
}

async function searchUsers(query: string | number | null) {
  if (!query) return

  searchQuery.value = query.toString()
  await debouncedSearch(query.toString())
}

function selectUser(user: UserSearchResult) {
  const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)
  const isAlreadyShared = templatesStore.sharedUsers.some((u) => u.user_id === user.id)
  const isCurrentUser = user.id === currentUserId.value

  if (!isAlreadySelected && !isAlreadyShared && !isCurrentUser) {
    selectedUsers.value.push(user)
  }
}

function deselectUser(userId: string) {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== userId)
}

async function handleShare() {
  if (selectedUsers.value.length === 0) return

  isLoading.value = true
  try {
    const promises = selectedUsers.value.map((user) =>
      templatesStore.shareTemplateWithUser(props.templateId, user.email, selectedPermission.value),
    )

    await Promise.all(promises)

    // Clear selection after successful sharing
    selectedUsers.value = []
    searchQuery.value = ''
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
</script>
