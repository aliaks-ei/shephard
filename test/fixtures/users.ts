import type { Session, User, AuthError } from '@supabase/supabase-js'
import type { UserSearchResult } from 'src/api/user'

/**
 * Creates a mock user profile with optional overrides
 */
export const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }) as User

/**
 * Creates a mock session with optional overrides
 */
export const createMockSession = (overrides: Partial<Session> = {}): Session =>
  ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides,
  }) as Session

/**
 * Creates a mock auth error with optional overrides
 */
export const createMockAuthError = (
  message: string = 'Auth error',
  overrides: Partial<AuthError> = {},
): AuthError =>
  ({
    name: 'AuthApiError',
    message,
    status: 400,
    code: 'invalid_request',
    ...overrides,
  }) as AuthError

/**
 * Creates a mock user store data
 */
export const createMockUserStoreData = () => ({
  userProfile: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
  preferences: {
    currency: 'USD',
    theme: 'auto' as const,
  },
})

/**
 * Creates a mock user search result
 */
export const createMockUserSearchResult = (
  overrides: Partial<UserSearchResult> = {},
): UserSearchResult => ({
  id: 'user-2',
  email: 'john@example.com',
  name: 'John Doe',
  ...overrides,
})

/**
 * Creates multiple mock user search results
 */
export const createMockUserSearchResults = (count: number = 2): UserSearchResult[] => {
  const userData = [
    { id: 'user-2', email: 'john@example.com', name: 'John Doe' },
    { id: 'user-3', email: 'jane@example.com', name: 'Jane Smith' },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockUserSearchResult({
      ...(userData[i] || {
        id: `user-${i + 2}`,
        email: `user${i + 2}@example.com`,
        name: `User ${i + 2}`,
      }),
    }),
  )
}
