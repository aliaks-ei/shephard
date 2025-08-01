import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

vi.unmock('src/lib/supabase/client')

const mockCreateClient = vi.mocked(createClient)

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should export supabase client when environment variables are present', async () => {
    const mockUrl = 'https://test.supabase.co'
    const mockKey = 'test-anon-key'
    const mockClient = { auth: {}, from: vi.fn() } as unknown as ReturnType<typeof createClient>

    vi.stubEnv('VITE_SUPABASE_URL', mockUrl)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', mockKey)
    mockCreateClient.mockReturnValue(mockClient)

    const { supabase } = await import('./client')

    expect(supabase).toBeDefined()
    expect(supabase).toBe(mockClient)
    expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey)
  })

  it('should throw error when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw error when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw error when both environment variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw error when VITE_SUPABASE_URL is undefined', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw error when VITE_SUPABASE_ANON_KEY is undefined', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw error when both environment variables are undefined', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)

    await expect(() => import('./client')).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should create client with correct type parameter', async () => {
    const mockUrl = 'https://test.supabase.co'
    const mockKey = 'test-anon-key'
    const mockClient = { auth: {}, from: vi.fn() } as unknown as ReturnType<typeof createClient>

    vi.stubEnv('VITE_SUPABASE_URL', mockUrl)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', mockKey)
    mockCreateClient.mockReturnValue(mockClient)

    await import('./client')

    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey)
  })
})
