import { vi } from 'vitest'

process.env.VITE_SUPABASE_URL = 'https://mock-supabase-url.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id'

vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-supabase-url.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key')
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
vi.stubEnv('MODE', 'test')

import './mocks/supabase'

vi.mock('crypto', () => ({
  getRandomValues: () => new Uint8Array(16).fill(1),
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
}))
