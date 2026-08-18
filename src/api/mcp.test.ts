import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockSupabaseClient } from 'test/vitest/mocks/supabase'
import { decideOAuthAuthorization, getOAuthAuthorizationDetails } from './mcp'

describe('MCP OAuth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
      error: null,
    })
  })

  it('loads authorization details using the current user session', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ authorization_id: 'request-id' }), { status: 200 }),
      )

    await expect(getOAuthAuthorizationDetails('request-id')).resolves.toEqual({
      authorization_id: 'request-id',
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/v1\/oauth\/authorizations\/request-id$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
      }),
    )
  })

  it('sends an explicit consent decision', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ redirect_url: 'https://client.example/callback' }), {
        status: 200,
      }),
    )

    await decideOAuthAuthorization('request-id', 'approve')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/v1\/oauth\/authorizations\/request-id\/consent$/),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'approve' }) }),
    )
  })
})
