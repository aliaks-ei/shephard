import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMcpApp } from '../src/app.js'
import type { McpEnvironment } from '../src/env.js'

const environment: McpEnvironment = {
  MCP_SUPABASE_URL: 'https://example.supabase.co',
  MCP_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  MCP_RESOURCE_URL: 'https://mcp.example.com/mcp',
  MCP_TOKEN_AUDIENCE: 'shephard-mcp',
  MCP_PORT: 8787,
  MCP_ALLOWED_ORIGINS: 'https://app.example.com',
  MCP_ALLOWED_HOSTS: 'mcp.example.com,127.0.0.1',
  allowedOrigins: new Set(['https://app.example.com']),
  allowedHosts: ['mcp.example.com', '127.0.0.1'],
}

let server: Server
let baseUrl: string

beforeAll(async () => {
  server = createServer(createMcpApp(environment))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Unable to start test server')
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})

describe('Shephard MCP HTTP server', () => {
  it('publishes protected-resource metadata', async () => {
    const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource/mcp`, {
      headers: { Host: 'mcp.example.com' },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      resource: 'https://mcp.example.com/mcp',
      authorization_servers: ['https://example.supabase.co/auth/v1'],
    })
  })

  it('challenges unauthenticated MCP requests without leaking internals', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Host: 'mcp.example.com' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain('resource_metadata=')
    await expect(response.json()).resolves.toMatchObject({
      error: { message: 'Authentication required' },
    })
  })

  it('rejects browser origins that are not explicitly allowed', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'mcp.example.com',
        Origin: 'https://attacker.example',
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(403)
  })
})
