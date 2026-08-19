import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const createClient = vi.fn(() => ({ auth: { getUser } }))

vi.mock('@supabase/supabase-js', () => ({ createClient }))

const { authenticateMcpRequest, clearVerificationCache, McpAuthenticationError } = await import(
  '../src/auth.js'
)
const environment = {
  MCP_SUPABASE_URL: 'https://example.supabase.co',
  MCP_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  MCP_TOKEN_AUDIENCE: 'shephard-mcp',
} as never

const userId = '11111111-1111-4111-8111-111111111111'
const clientId = '22222222-2222-4222-8222-222222222222'

function tokenWith(overrides: Record<string, unknown> = {}, salt = ''): string {
  const claims = {
    iss: 'https://example.supabase.co/auth/v1',
    aud: 'shephard-mcp',
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 300,
    client_id: clientId,
    salt,
    ...overrides,
  }
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url')
  return `header.${payload}.signature`
}

beforeEach(() => {
  clearVerificationCache()
  getUser.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null })
})

describe('authenticateMcpRequest', () => {
  it('verifies a token once and serves later calls from cache', async () => {
    const token = tokenWith()

    const first = await authenticateMcpRequest(`Bearer ${token}`, environment)
    const second = await authenticateMcpRequest(`Bearer ${token}`, environment)

    expect(getUser).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('verifies each distinct token', async () => {
    await authenticateMcpRequest(`Bearer ${tokenWith({}, 'a')}`, environment)
    await authenticateMcpRequest(`Bearer ${tokenWith({}, 'b')}`, environment)

    expect(getUser).toHaveBeenCalledTimes(2)
  })

  it('rejects a token from an untrusted issuer', async () => {
    const token = tokenWith({ iss: 'https://attacker.example/auth/v1' })

    await expect(authenticateMcpRequest(`Bearer ${token}`, environment)).rejects.toBeInstanceOf(
      McpAuthenticationError,
    )
    expect(getUser).not.toHaveBeenCalled()
  })

  it('rejects an expired token', async () => {
    const token = tokenWith({ exp: Math.floor(Date.now() / 1000) - 1 })

    await expect(authenticateMcpRequest(`Bearer ${token}`, environment)).rejects.toBeInstanceOf(
      McpAuthenticationError,
    )
  })

  it('does not cache a token that Supabase rejects', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'revoked' } })
    const token = tokenWith()

    await expect(authenticateMcpRequest(`Bearer ${token}`, environment)).rejects.toBeInstanceOf(
      McpAuthenticationError,
    )
    await expect(authenticateMcpRequest(`Bearer ${token}`, environment)).rejects.toBeInstanceOf(
      McpAuthenticationError,
    )
    expect(getUser).toHaveBeenCalledTimes(2)
  })
})
