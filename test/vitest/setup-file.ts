import { vi } from 'vitest'
import './mocks/supabase'

vi.stubEnv('MODE', 'test')

vi.mock('crypto', () => ({
  getRandomValues: () => new Uint8Array(16).fill(1),
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
}))
