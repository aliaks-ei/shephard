import { vi } from 'vitest'
import './mocks/supabase'

vi.stubEnv('MODE', 'test')

// Mock Worker API for heic2any and other packages that need it
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((error: ErrorEvent) => void) | null = null
  constructor() {}
  postMessage() {}
  terminate() {}
}

global.Worker = MockWorker as unknown as typeof Worker

vi.mock('crypto', () => ({
  getRandomValues: () => new Uint8Array(16).fill(1),
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
}))

vi.mock('quasar', async () => {
  const actual = await vi.importActual<object>('quasar')
  return {
    ...actual,
    Notify: {
      create: vi.fn(),
    },
    Dark: {
      set: vi.fn(),
    },
  }
})
