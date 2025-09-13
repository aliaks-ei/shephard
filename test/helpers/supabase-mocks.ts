import { vi } from 'vitest'
import { createMockSession, createMockUser, createMockAuthError } from '../fixtures'

/**
 * Creates a comprehensive mock of the Supabase client
 */
export const createMockSupabaseClient = () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
  }

  return vi.mocked(mockSupabase, true)
}

/**
 * Sets up default successful auth responses
 */
export const setupSuccessfulAuthMocks = (
  mockSupabase: ReturnType<typeof createMockSupabaseClient>,
) => {
  const mockUser = createMockUser()
  const mockSession = createMockSession({ user: mockUser })

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  })

  mockSupabase.auth.signInWithIdToken.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  })

  mockSupabase.auth.signInWithOtp.mockResolvedValue({
    data: { user: null, session: null, messageId: 'message-123' },
    error: null,
  })

  mockSupabase.auth.verifyOtp.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  })

  mockSupabase.auth.signOut.mockResolvedValue({ error: null })

  mockSupabase.auth.updateUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  })

  return { mockUser, mockSession }
}

/**
 * Sets up auth error responses
 */
export const setupAuthErrorMocks = (
  mockSupabase: ReturnType<typeof createMockSupabaseClient>,
  errorMessage: string = 'Auth failed',
) => {
  const mockError = createMockAuthError(errorMessage)

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: mockError,
  })

  mockSupabase.auth.signInWithIdToken.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  mockSupabase.auth.signInWithOtp.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  mockSupabase.auth.verifyOtp.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

  mockSupabase.auth.updateUser.mockResolvedValue({
    data: { user: null },
    error: mockError,
  })

  return mockError
}

/**
 * Helper function to mock Supabase client module
 */
export const mockSupabaseModule = () => {
  const mockSupabase = createMockSupabaseClient()

  vi.mock('src/lib/supabase/client', () => ({
    supabase: mockSupabase,
  }))

  return mockSupabase
}
