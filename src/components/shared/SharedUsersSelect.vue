<template>
  <q-select
    :model-value="modelValue"
    :options="searchOptions"
    input-debounce="300"
    placeholder="Search by email address"
    use-input
    use-chips
    multiple
    outlined
    dense
    :loading="loading"
    hide-bottom-space
    @filter="filterUsers"
    @update:model-value="emit('update:model-value', $event)"
  >
    <template #prepend>
      <q-icon name="eva-search-outline" />
    </template>

    <template #option="{ itemProps, opt: user }">
      <q-item v-bind="itemProps">
        <q-item-section avatar>
          <q-avatar
            color="primary"
            text-color="white"
            size="24px"
            class="text-caption"
          >
            {{ getUserInitial(user.email) }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ getUserDisplayName(user.name, user.email) }}
          </q-item-label>
          <q-item-label caption>
            {{ user.email }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #selected-item="{ tabindex, index, removeAtIndex, opt: user }">
      <q-chip
        removable
        dense
        :tabindex="tabindex"
        color="primary"
        text-color="white"
        @remove="removeAtIndex(index)"
      >
        {{ getUserDisplayName(user.name, user.email) }}
      </q-chip>
    </template>

    <template #no-option>
      <q-item>
        <q-item-section class="text-center">
          <div v-if="loading">
            <q-spinner-dots />
            <div class="text-grey-6">Searching...</div>
          </div>
          <div v-else-if="searchQuery?.trim()">
            <q-icon
              name="eva-search-outline"
              size="2rem"
              class="text-grey-5 q-mb-sm"
            />
            <div class="text-grey-7">No users found for "{{ searchQuery }}"</div>
            <div class="text-caption text-grey-5 q-mt-xs">Try a different email address</div>
          </div>
          <div v-else>
            <div class="text-grey-6">Type an email address to search</div>
          </div>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import { getUserInitial, getUserDisplayName } from 'src/utils/name'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

const props = defineProps<{
  modelValue: UserSearchResult[]
  searchResults: UserSearchResult[]
  sharedUsers: TemplateSharedUser[]
  currentUserId: string | undefined
  ownerUserId: string | undefined
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:model-value': [value: UserSearchResult[]]
  'update:search-query': [value: string]
}>()

const searchQuery = ref('')

const searchOptions = computed(() =>
  props.searchResults.filter((user) => {
    const isAlreadyShared = props.sharedUsers.some((u) => u.user_id === user.id)
    const isCurrentUser = user.id === props.currentUserId
    const isOwner = user.id === props.ownerUserId
    const isAlreadySelected = props.modelValue.some((u) => u.id === user.id)

    return !isAlreadyShared && !isCurrentUser && !isOwner && !isAlreadySelected
  }),
)

function filterUsers(val: string, update: (fn: () => void) => void) {
  searchQuery.value = val
  update(() => {
    emit('update:search-query', val)
  })
}
</script>
