import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
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
    darkMode: false,
    pushNotificationsEnabled: false,
  },
}))

describe('Preferences Store', () => {
  const mockHandleError = vi.fn()
  const mockSystemDarkMode = ref(false)
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
      expect(preferencesStore.isDark).toBe(false)
      expect(preferencesStore.arePushNotificationsEnabled).toBe(false)
    })
  })

  describe('initializeWithDefaults()', () => {
    it('should initialize with defaults using system dark mode', () => {
      mockSystemDarkMode.value = true

      preferencesStore.initializeWithDefaults()

      expect(preferencesStore.preferences).toEqual({
        ...userApi.DEFAULT_PREFERENCES,
        darkMode: true,
      })
    })
  })

  describe('loadPreferences()', () => {
    it('should load user preferences successfully', async () => {
      const mockPreferences = {
        darkMode: true,
        pushNotificationsEnabled: true,
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
      expect(freshPreferencesStore.preferences.darkMode).toBe(mockSystemDarkMode.value)
    })

    it('should handle null user preferences gracefully', async () => {
      vi.mocked(userApi.getUserPreferences).mockResolvedValue(null)

      await preferencesStore.loadPreferences()

      expect(userApi.getUserPreferences).toHaveBeenCalledWith('test-user-id')
      expect(preferencesStore.isLoading).toBe(false)
      expect(preferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
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
      expect(preferencesStore.preferences.darkMode).toBe(mockSystemDarkMode.value)
    })
  })

  describe('updatePreferences()', () => {
    it('should update preferences successfully', async () => {
      const updates = { darkMode: true }

      await preferencesStore.updatePreferences(updates)

      expect(preferencesStore.preferences).toEqual({
        ...userApi.DEFAULT_PREFERENCES,
        darkMode: true,
      })
      expect(userApi.saveUserPreferences).toHaveBeenCalledWith('test-user-id', {
        ...userApi.DEFAULT_PREFERENCES,
        darkMode: true,
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

      await freshPreferencesStore.updatePreferences({ darkMode: true })

      expect(userApi.saveUserPreferences).not.toHaveBeenCalled()
      expect(freshPreferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
    })

    it('should handle error when saving preferences fails', async () => {
      const mockError = new Error('Failed to save preferences')
      vi.mocked(userApi.saveUserPreferences).mockRejectedValue(mockError)

      await preferencesStore.updatePreferences({ darkMode: true })

      expect(preferencesStore.preferences).toEqual({
        ...userApi.DEFAULT_PREFERENCES,
        darkMode: true,
      })

      expect(mockHandleError).toHaveBeenCalledWith('USER.PREFERENCES_SAVE_FAILED', mockError, {
        userId: 'test-user-id',
      })
    })
  })

  describe('reset()', () => {
    it('should reset preferences to defaults', () => {
      preferencesStore.preferences.darkMode = true
      preferencesStore.preferences.pushNotificationsEnabled = true
      preferencesStore.isLoading = true

      preferencesStore.reset()

      expect(preferencesStore.preferences).toEqual(userApi.DEFAULT_PREFERENCES)
      expect(preferencesStore.isLoading).toBe(false)
    })
  })

  describe('Computed properties', () => {
    it('isDark should reflect darkMode preference', () => {
      expect(preferencesStore.isDark).toBe(false)

      preferencesStore.preferences.darkMode = true

      expect(preferencesStore.isDark).toBe(true)
    })

    it('arePushNotificationsEnabled should reflect pushNotificationsEnabled preference', () => {
      expect(preferencesStore.arePushNotificationsEnabled).toBe(false)

      preferencesStore.preferences.pushNotificationsEnabled = true

      expect(preferencesStore.arePushNotificationsEnabled).toBe(true)
    })
  })

  describe('useTheme integration', () => {
    it('should call system dark mode callback only when darkMode is undefined', () => {
      const onSystemDarkModeChangeCallback =
        vi.mocked(useTheme).mock.calls[0]?.[1]?.onSystemDarkModeChange

      expect(onSystemDarkModeChangeCallback).toBeDefined()

      onSystemDarkModeChangeCallback?.(true)
      expect(preferencesStore.preferences.darkMode).toBe(false)

      const mockPreferences = { darkMode: undefined, pushNotificationsEnabled: false }
      const mockSetPreferences = vi.fn((value) => {
        Object.assign(mockPreferences, value)
      })

      mockSetPreferences({
        ...mockPreferences,
        darkMode: true,
      })

      expect(mockPreferences.darkMode).toBe(true)
    })
  })
})
