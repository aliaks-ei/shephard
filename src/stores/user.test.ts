import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { computed } from 'vue'
import { useUserStore } from './user'
import { useAuthStore } from './auth'
import { usePreferencesStore } from './preferences'
import * as nameUtils from 'src/utils/name'
import type { UserPreferences } from 'src/api/user'

vi.mock('./auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./preferences', () => ({
  usePreferencesStore: vi.fn(),
}))

vi.mock('src/utils/name', () => ({
  getUserInitial: vi.fn(),
  getDisplayName: vi.fn(),
}))

vi.mock('@vueuse/core', () => ({
  useDateFormat: () => computed(() => 'January 1, 2023'),
}))

describe('User Store', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { avatar_url: 'https://example.com/avatar.jpg' },
    aud: 'authenticated',
    confirmed_at: '2023-01-01T00:00:00.000Z',
    role: 'authenticated',
  }

  const mockPreferences: UserPreferences = {
    darkMode: true,
    pushNotificationsEnabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(nameUtils.getUserInitial).mockReturnValue('T')
    vi.mocked(nameUtils.getDisplayName).mockReturnValue('Test User')

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state when authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        init: vi.fn().mockResolvedValue(undefined),
        signOut: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof useAuthStore>)

      vi.mocked(usePreferencesStore).mockReturnValue({
        preferences: mockPreferences,
        isLoading: false,
        loadPreferences: vi.fn().mockResolvedValue(undefined),
        updatePreferences: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof usePreferencesStore>)

      const userStore = useUserStore()

      expect(userStore.isAuthenticated).toBe(true)
      expect(userStore.isLoading).toBe(false)
      expect(userStore.userProfile).not.toBeNull()
    })

    it('should have null userProfile when not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        init: vi.fn().mockResolvedValue(undefined),
        signOut: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof useAuthStore>)

      vi.mocked(usePreferencesStore).mockReturnValue({
        preferences: mockPreferences,
        isLoading: false,
        loadPreferences: vi.fn().mockResolvedValue(undefined),
        updatePreferences: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof usePreferencesStore>)

      const userStore = useUserStore()

      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.userProfile).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should compute userProfile correctly from auth and preferences', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      } as unknown as ReturnType<typeof useAuthStore>)

      vi.mocked(usePreferencesStore).mockReturnValue({
        preferences: mockPreferences,
        isLoading: false,
      } as unknown as ReturnType<typeof usePreferencesStore>)

      const userStore = useUserStore()

      expect(userStore.userProfile).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        nameInitial: 'T',
        authProvider: 'google',
        createdAt: '2023-01-01T00:00:00.000Z',
        formattedCreatedAt: 'January 1, 2023',
        preferences: mockPreferences,
      })

      expect(nameUtils.getDisplayName).toHaveBeenCalledWith(mockUser)
      expect(nameUtils.getUserInitial).toHaveBeenCalledWith('test@example.com')
    })
  })

  describe('Methods', () => {
    describe('initUser()', () => {
      it('should initialize user when authenticated', async () => {
        const mockInit = vi.fn().mockResolvedValue(undefined)
        const mockLoadPreferences = vi.fn().mockResolvedValue(undefined)

        vi.mocked(useAuthStore).mockReturnValue({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          init: mockInit,
        } as unknown as ReturnType<typeof useAuthStore>)

        vi.mocked(usePreferencesStore).mockReturnValue({
          preferences: mockPreferences,
          isLoading: false,
          loadPreferences: mockLoadPreferences,
        } as unknown as ReturnType<typeof usePreferencesStore>)

        const userStore = useUserStore()
        await userStore.initUser()

        expect(mockInit).toHaveBeenCalled()
        expect(mockLoadPreferences).toHaveBeenCalled()
      })

      it('should not load preferences when not authenticated', async () => {
        const mockInit = vi.fn().mockResolvedValue(undefined)
        const mockLoadPreferences = vi.fn().mockResolvedValue(undefined)

        vi.mocked(useAuthStore).mockReturnValue({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          init: mockInit,
        } as unknown as ReturnType<typeof useAuthStore>)

        vi.mocked(usePreferencesStore).mockReturnValue({
          preferences: null,
          isLoading: false,
          loadPreferences: mockLoadPreferences,
        } as unknown as ReturnType<typeof usePreferencesStore>)

        const userStore = useUserStore()
        await userStore.initUser()

        expect(mockInit).toHaveBeenCalled()
        expect(mockLoadPreferences).not.toHaveBeenCalled()
      })
    })

    describe('updateUserPreferences()', () => {
      it('should update user preferences', async () => {
        const mockUpdatePreferences = vi.fn().mockResolvedValue(undefined)

        vi.mocked(useAuthStore).mockReturnValue({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        } as unknown as ReturnType<typeof useAuthStore>)

        vi.mocked(usePreferencesStore).mockReturnValue({
          preferences: mockPreferences,
          isLoading: false,
          updatePreferences: mockUpdatePreferences,
        } as unknown as ReturnType<typeof usePreferencesStore>)

        const userStore = useUserStore()
        const updates = { preferences: { darkMode: false } }

        await userStore.updateUserPreferences(updates)

        expect(mockUpdatePreferences).toHaveBeenCalledWith(updates.preferences)
      })
    })

    describe('signOut()', () => {
      it('should sign out user', async () => {
        const mockSignOut = vi.fn().mockResolvedValue(undefined)

        vi.mocked(useAuthStore).mockReturnValue({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          signOut: mockSignOut,
        } as unknown as ReturnType<typeof useAuthStore>)

        vi.mocked(usePreferencesStore).mockReturnValue({
          preferences: mockPreferences,
          isLoading: false,
        } as unknown as ReturnType<typeof usePreferencesStore>)

        const userStore = useUserStore()
        await userStore.signOut()

        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Store References', () => {
    it('should expose references to auth and preferences stores', () => {
      const mockAuthStoreInstance = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      } as unknown as ReturnType<typeof useAuthStore>

      const mockPreferencesStoreInstance = {
        preferences: mockPreferences,
        isLoading: false,
      } as unknown as ReturnType<typeof usePreferencesStore>

      vi.mocked(useAuthStore).mockReturnValue(mockAuthStoreInstance)
      vi.mocked(usePreferencesStore).mockReturnValue(mockPreferencesStoreInstance)

      const userStore = useUserStore()

      expect(userStore.auth).toEqual(mockAuthStoreInstance)
      expect(userStore.preferences).toEqual(mockPreferencesStoreInstance)
    })
  })
})
