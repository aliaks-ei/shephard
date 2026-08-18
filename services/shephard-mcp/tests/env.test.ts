import { describe, expect, it } from 'vitest'
import { loadEnvironment } from '../src/env.js'

const requiredEnvironment = {
  MCP_SUPABASE_URL: 'https://example.supabase.co',
  MCP_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  MCP_RESOURCE_URL: 'https://mcp.example.com/mcp',
}

describe('loadEnvironment', () => {
  it('uses the platform PORT when MCP_PORT is not set', () => {
    const environment = loadEnvironment({
      ...requiredEnvironment,
      PORT: '8080',
    })

    expect(environment.MCP_PORT).toBe(8080)
  })

  it('prefers an explicit MCP_PORT', () => {
    const environment = loadEnvironment({
      ...requiredEnvironment,
      PORT: '8080',
      MCP_PORT: '8787',
    })

    expect(environment.MCP_PORT).toBe(8787)
  })
})
