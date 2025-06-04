import { vi } from 'vitest'

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithIdToken: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange: vi.fn().mockImplementation(() => {
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
  },
  from: vi.fn().mockImplementation(() => {
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }))
      }),
    }
  }),
}

export const mockCreateClient = vi.fn().mockReturnValue(mockSupabaseClient)

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => mockSupabaseClient),
}))

vi.mock('src/lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
}))
