import { vi, beforeEach, it, expect } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import { getUserPreferences, saveUserPreferences, DEFAULT_PREFERENCES } from './user'

const createPostgrestError = (message: string): PostgrestError =>
  ({
    message,
    details: '',
    hint: '',
    code: '23505',
  }) as PostgrestError

vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}))

const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date('2023-01-01T12:00:00Z'))
})

it('getUserPreferences should return preferences when user exists with preferences', async () => {
  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'user-id',
      preferences: {
        darkMode: true,
        pushNotificationsEnabled: true,
      },
    },
    error: null,
  })

  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'user-id'
  const result = await getUserPreferences(userId)

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockSelect).toHaveBeenCalledWith('*')
  expect(mockEq).toHaveBeenCalledWith('id', userId)
  expect(result).toEqual({
    darkMode: true,
    pushNotificationsEnabled: true,
  })
})

it('getUserPreferences should return null when user exists but has no preferences', async () => {
  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'user-id',
      preferences: null,
    },
    error: null,
  })

  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'user-id'
  const result = await getUserPreferences(userId)

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockSelect).toHaveBeenCalledWith('*')
  expect(mockEq).toHaveBeenCalledWith('id', userId)
  expect(result).toBeNull()
})

it('getUserPreferences should return null when user does not exist', async () => {
  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  })

  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'non-existent-user-id'
  const result = await getUserPreferences(userId)

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockSelect).toHaveBeenCalledWith('*')
  expect(mockEq).toHaveBeenCalledWith('id', userId)
  expect(result).toBeNull()
})

it('getUserPreferences should throw error when database query fails', async () => {
  const mockError = createPostgrestError('Failed to fetch user')

  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: null,
    error: mockError,
  })

  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'user-id'
  await expect(getUserPreferences(userId)).rejects.toThrow('Failed to fetch user')

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockSelect).toHaveBeenCalledWith('*')
  expect(mockEq).toHaveBeenCalledWith('id', userId)
})

it('saveUserPreferences should update user preferences successfully', async () => {
  const mockEq = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  })

  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'user-id'
  const preferences = { darkMode: true }

  await saveUserPreferences(userId, preferences)

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockUpdate).toHaveBeenCalledWith({
    preferences,
    updated_at: '2023-01-01T12:00:00.000Z',
  })
  expect(mockEq).toHaveBeenCalledWith('id', userId)
})

it('saveUserPreferences should throw error when update fails', async () => {
  const mockError = createPostgrestError('Failed to update user preferences')

  const mockEq = vi.fn().mockResolvedValue({
    data: null,
    error: mockError,
  })

  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

  mockSupabase.from.mockImplementation(mockFrom)

  const userId = 'user-id'
  const preferences = { pushNotificationsEnabled: false }

  await expect(saveUserPreferences(userId, preferences)).rejects.toThrow(
    'Failed to update user preferences',
  )

  expect(mockFrom).toHaveBeenCalledWith('users')
  expect(mockUpdate).toHaveBeenCalledWith({
    preferences,
    updated_at: '2023-01-01T12:00:00.000Z',
  })
  expect(mockEq).toHaveBeenCalledWith('id', userId)
})

it('DEFAULT_PREFERENCES should have expected default values', () => {
  expect(DEFAULT_PREFERENCES).toEqual({
    darkMode: false,
    pushNotificationsEnabled: false,
  })
})
