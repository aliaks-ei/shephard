import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref, type ComputedRef } from 'vue'
import { usePreferencesStore } from './preferences'
import { useAuthStore } from './auth'
import * as userApi from 'src/api/user'
import { useError } from 'src/composables/useError'
import { useTheme } from 'src/composables/useTheme'
import type { User } from 'src/api/user'

vi.mock('./auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/composables/useTheme', () => ({
  useTheme: vi.fn(),
}))

vi.mock('src/api/user', () => ({
  getUserPreferences: vi.fn(),
  saveUserPreferences: vi.fn(),
  DEFAULT_PREFERENCES: {
    theme: 'light',
    pushNotificationsEnabled: false,
    currency: 'EUR',
  },
}))

describe('Preferences Store', () => {
  const mockHandleError = vi.fn()
  const mockSystemDarkMode = ref(false)
  const mockIsDark = ref(false)
  let mockUser: User | null = null
  let preferencesStore: ReturnType<typeof usePreferencesStore>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    } as User

    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    vi.mocked(useTheme).mockReturnValue({
      systemDarkMode: mockSystemDarkMode,
      isDark: mockIsDark as unknown as ComputedRef<boolean>,
    })

    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    } as unknown as ReturnType<typeof useAuthStore>)

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        preferences: {
          preferences: { ...userApi.DEFAULT_PREFERENCES },
          isLoading: false,
        },
      },
    })

    preferencesStore = usePreferencesStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(preferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
      expect(preferencesStore.isLoading).toBe(false)
      expect(preferencesStore.theme).toBe('light')
      expect(preferencesStore.isDark).toBe(false)
      expect(preferencesStore.arePushNotificationsEnabled).toBe(false)
      expect(preferencesStore.currency).toBe('EUR')
    })
  })

  describe('initializeWithDefaults()', () => {
    it('should initialize with default preferences', () => {
      preferencesStore.initializeWithDefaults()

      expect(preferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
    })
  })

  describe('loadPreferences()', () => {
    it('should load user preferences successfully', async () => {
      const mockPreferences = {
        theme: 'dark' as const,
        pushNotificationsEnabled: true,
        currency: 'USD',
      }

      vi.mocked(userApi.getUserPreferences).mockResolvedValue(mockPreferences)

      await preferencesStore.loadPreferences()

      expect(userApi.getUserPreferences).toHaveBeenCalledWith('test-user-id')
      expect(preferencesStore.isLoading).toBe(false)
      expect(preferencesStore.preferences).toEqual(mockPreferences)
    })

    it('should initialize with defaults when user is not authenticated', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as unknown as ReturnType<typeof useAuthStore>)

      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      const freshPreferencesStore = usePreferencesStore()

      await freshPreferencesStore.loadPreferences()

      expect(userApi.getUserPreferences).not.toHaveBeenCalled()
      expect(freshPreferencesStore.preferences.theme).toBe('light')
    })

    it('should initialize with defaults and handle error when preferences load fails', async () => {
      const mockError = new Error('Failed to load preferences')
      vi.mocked(userApi.getUserPreferences).mockRejectedValue(mockError)

      await preferencesStore.loadPreferences()

      expect(userApi.getUserPreferences).toHaveBeenCalledWith('test-user-id')
      expect(mockHandleError).toHaveBeenCalledWith('USER.PREFERENCES_LOAD_FAILED', mockError, {
        userId: 'test-user-id',
      })
      expect(preferencesStore.isLoading).toBe(false)
      expect(preferencesStore.preferences.theme).toBe('light')
    })
  })

  describe('updatePreferences()', () => {
    it('should update preferences successfully', async () => {
      const updates = { theme: 'dark' as const }

      await preferencesStore.updatePreferences(updates)

      expect(preferencesStore.preferences).toEqual({
        ...userApi.DEFAULT_PREFERENCES,
        theme: 'dark',
      })
      expect(userApi.saveUserPreferences).toHaveBeenCalledWith('test-user-id', {
        ...userApi.DEFAULT_PREFERENCES,
        theme: 'dark',
      })
    })

    it('should not update preferences when user is not authenticated', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as unknown as ReturnType<typeof useAuthStore>)

      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      const freshPreferencesStore = usePreferencesStore()

      await freshPreferencesStore.updatePreferences({ theme: 'dark' })

      expect(userApi.saveUserPreferences).not.toHaveBeenCalled()
      expect(freshPreferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
    })

    it('should handle error when saving preferences fails', async () => {
      const mockError = new Error('Failed to save preferences')
      vi.mocked(userApi.saveUserPreferences).mockRejectedValue(mockError)

      await preferencesStore.updatePreferences({ theme: 'dark' })

      expect(preferencesStore.preferences).toEqual({
        ...userApi.DEFAULT_PREFERENCES,
        theme: 'dark',
      })

      expect(mockHandleError).toHaveBeenCalledWith('USER.PREFERENCES_SAVE_FAILED', mockError, {
        userId: 'test-user-id',
      })
    })
  })

  describe('reset()', () => {
    it('should reset preferences to defaults', () => {
      preferencesStore.preferences.theme = 'dark'
      preferencesStore.preferences.pushNotificationsEnabled = true
      preferencesStore.isLoading = true

      preferencesStore.reset()

      expect(preferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
      expect(preferencesStore.isLoading).toBe(false)
    })
  })

  describe('Computed properties', () => {
    it('theme should reflect theme preference', () => {
      expect(preferencesStore.theme).toBe('light')

      preferencesStore.preferences.theme = 'dark'

      expect(preferencesStore.theme).toBe('dark')
    })

    it('isDark should come from useTheme', () => {
      expect(preferencesStore.isDark).toBe(false)

      mockIsDark.value = true

      expect(preferencesStore.isDark).toBe(true)
    })

    it('arePushNotificationsEnabled should reflect pushNotificationsEnabled preference', () => {
      expect(preferencesStore.arePushNotificationsEnabled).toBe(false)

      preferencesStore.preferences.pushNotificationsEnabled = true

      expect(preferencesStore.arePushNotificationsEnabled).toBe(true)
    })
  })
})
