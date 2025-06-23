import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useTemplatesStore } from 'src/stores/templates'
import { useUserStore } from 'src/stores/user'
import type { UserSearchResult } from 'src/api'

export function useTemplateSharing(templateId?: string) {
  const templatesStore = useTemplatesStore()
  const userStore = useUserStore()

  // Local state for the sharing dialog
  const isDialogOpen = ref(false)
  const selectedPermission = ref<'view' | 'edit'>('view')
  const searchQuery = ref('')
  const selectedUsers = ref<UserSearchResult[]>([])

  // Computed properties
  const currentUserId = computed(() => userStore.userProfile?.id)
  const isLoading = computed(() => templatesStore.isSharing)
  const isSearching = computed(() => templatesStore.isSearchingUsers)
  const searchResults = computed(() => templatesStore.userSearchResults)
  const sharedUsers = computed(() => templatesStore.sharedUsers)

  // Debounced search function to prevent excessive API calls
  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (!query.trim()) {
      templatesStore.clearUserSearch()
      return
    }
    await templatesStore.searchUsers(query)
  }, 300)

  // Search for users
  async function searchUsers(query: string) {
    searchQuery.value = query
    await debouncedSearch(query)
  }

  // Clear search results
  function clearSearch() {
    searchQuery.value = ''
    selectedUsers.value = []
    templatesStore.clearUserSearch()
  }

  // Add user to selection
  function selectUser(user: UserSearchResult) {
    const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)
    const isAlreadyShared = sharedUsers.value.some((u) => u.user_id === user.id)
    const isCurrentUser = user.id === currentUserId.value

    if (!isAlreadySelected && !isAlreadyShared && !isCurrentUser) {
      selectedUsers.value.push(user)
    }
  }

  // Remove user from selection
  function deselectUser(userId: string) {
    selectedUsers.value = selectedUsers.value.filter((u) => u.id !== userId)
  }

  // Get filtered search results (exclude already shared users and current user)
  const filteredSearchResults = computed(() => {
    return searchResults.value.filter((user) => {
      const isAlreadyShared = sharedUsers.value.some((u) => u.user_id === user.id)
      const isCurrentUser = user.id === currentUserId.value
      const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)

      return !isAlreadyShared && !isCurrentUser && !isAlreadySelected
    })
  })

  // Load shared users for a template
  async function loadShares(id: string) {
    if (!id) return
    await templatesStore.loadTemplateShares(id)
  }

  // Share template with selected users
  async function shareWithSelectedUsers(id: string) {
    if (!id || selectedUsers.value.length === 0) return

    const promises = selectedUsers.value.map((user) =>
      templatesStore.shareTemplateWithUser(id, user.email, selectedPermission.value),
    )

    await Promise.all(promises)

    // Clear selection after successful sharing
    selectedUsers.value = []
    clearSearch()
  }

  // Remove access for a user
  async function removeAccess(id: string, userId: string) {
    if (!id || !userId) return
    await templatesStore.unshareTemplateWithUser(id, userId)
  }

  // Update user permission
  async function updatePermission(id: string, userId: string, permission: 'view' | 'edit') {
    if (!id || !userId) return
    await templatesStore.updateUserPermission(id, userId, permission)
  }

  // Open sharing dialog
  function openDialog() {
    isDialogOpen.value = true
    if (templateId) {
      loadShares(templateId)
    }
  }

  // Close sharing dialog and reset state
  function closeDialog() {
    isDialogOpen.value = false
    selectedPermission.value = 'view'
    clearSearch()
  }

  // Get permission display text
  function getPermissionText(permission: string): string {
    switch (permission) {
      case 'view':
        return 'Can view'
      case 'edit':
        return 'Can edit'
      default:
        return 'Unknown'
    }
  }

  // Get permission color for UI
  function getPermissionColor(permission: string): string {
    switch (permission) {
      case 'view':
        return 'blue'
      case 'edit':
        return 'green'
      default:
        return 'grey'
    }
  }

  // Check if user can be shared with
  function canShareWith(user: UserSearchResult): boolean {
    const isAlreadyShared = sharedUsers.value.some((u) => u.user_id === user.id)
    const isCurrentUser = user.id === currentUserId.value
    const isAlreadySelected = selectedUsers.value.some((u) => u.id === user.id)

    return !isAlreadyShared && !isCurrentUser && !isAlreadySelected
  }

  return {
    // State
    isDialogOpen,
    selectedPermission,
    searchQuery,
    selectedUsers,

    // Computed
    isLoading,
    isSearching,
    searchResults: filteredSearchResults,
    sharedUsers,

    // Actions
    searchUsers,
    clearSearch,
    selectUser,
    deselectUser,
    loadShares,
    shareWithSelectedUsers,
    removeAccess,
    updatePermission,
    openDialog,
    closeDialog,

    // Utilities
    getPermissionText,
    getPermissionColor,
    canShareWith,
  }
}
