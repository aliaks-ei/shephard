import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { AuthenticatedMcpRequest } from '../src/auth.js'
import {
  createShephardMcpServer,
  mapRpcError,
  nextExpenseCursor,
  toolResult,
} from '../src/tools.js'

function stubContext(): AuthenticatedMcpRequest {
  return {
    user: { id: 'user-1' },
    clientId: 'client-1',
    accessToken: 'token',
    supabase: {},
  } as unknown as AuthenticatedMcpRequest
}

async function listTools() {
  const server = createShephardMcpServer(stubContext())
  const client = new Client({ name: 'test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  const { tools } = await client.listTools()
  await client.close()
  await server.close()
  return tools
}

describe('toolResult', () => {
  it('wraps list results in an object for the MCP structured-content contract', () => {
    const plans = [{ id: 'plan-1', name: 'August' }]

    expect(toolResult(plans)).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(plans) }],
      structuredContent: { items: plans },
    })
  })

  it('preserves object results as structured content', () => {
    const overview = { id: 'plan-1', total: 150 }

    expect(toolResult(overview).structuredContent).toEqual(overview)
  })
})

describe('mapRpcError', () => {
  it('reports an authorization failure', () => {
    expect(mapRpcError({ code: '42501' }).message).toContain('not authorized')
  })

  it('reports a missing item', () => {
    expect(mapRpcError({ code: 'P0002' }).message).toContain('not found')
  })

  it('passes through payload problems the caller can correct', () => {
    const error = mapRpcError({
      code: '22023',
      message: 'Idempotency key was already used with a different request',
    })

    expect(error.message).toBe('Idempotency key was already used with a different request')
  })

  it('hides unexpected database errors', () => {
    expect(mapRpcError({ code: '23505', message: 'duplicate key value' }).message).toBe(
      'Shephard could not complete that request.',
    )
  })
})

describe('nextExpenseCursor', () => {
  const row = {
    id: '00000000-0000-4000-8000-000000000001',
    created_at: '2026-08-19T10:00:00.000Z',
  } as never

  it('returns no cursor when the page is not full', () => {
    expect(nextExpenseCursor([row], 50)).toBeNull()
  })

  it('returns the last row as the cursor when the page is full', () => {
    expect(nextExpenseCursor([row], 1)).toEqual({
      before_created_at: '2026-08-19T10:00:00.000Z',
      before_id: '00000000-0000-4000-8000-000000000001',
    })
  })
})

describe('advertised tool schemas', () => {
  it('declares every tool with a described output schema', async () => {
    const tools = await listTools()

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'add_plan_item',
      'create_plan',
      'create_template',
      'get_plan_overview',
      'get_plan_summary',
      'get_template',
      'get_user_preferences',
      'list_categories',
      'list_expenses',
      'list_expenses_by_date_range',
      'list_notifications',
      'list_plan_shares',
      'list_plans',
      'list_templates',
      'record_expense',
      'record_expenses',
      'update_expense',
      'update_plan',
      'update_plan_item',
    ])

    // A schema without `properties` is what makes ChatGPT report
    // "Output schema recommended", so assert real fields on every tool.
    for (const tool of tools) {
      expect(tool.outputSchema, `${tool.name} has no output schema`).toBeDefined()
      expect(
        Object.keys(tool.outputSchema?.properties ?? {}),
        `${tool.name} output schema has no properties`,
      ).not.toHaveLength(0)
    }
  })

  it('describes plan fields so a client can read the result without guessing', async () => {
    const tools = await listTools()
    const overview = tools.find((tool) => tool.name === 'get_plan_overview')

    expect(Object.keys(overview?.outputSchema?.properties ?? {}).sort()).toEqual([
      'currency',
      'end_date',
      'id',
      'items',
      'name',
      'permission_level',
      'start_date',
      'status',
      'total',
    ])
  })

  const writeTools = [
    'add_plan_item',
    'create_plan',
    'create_template',
    'record_expense',
    'record_expenses',
    'update_expense',
    'update_plan',
    'update_plan_item',
  ]

  it('separates read-only tools from write tools', async () => {
    const tools = await listTools()

    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(!writeTools.includes(tool.name))
    }
  })

  it('never marks a tool as destructive, because no tool deletes anything', async () => {
    const tools = await listTools()

    for (const tool of tools) {
      expect(tool.annotations?.destructiveHint, tool.name).toBe(false)
    }
  })

  it('requires an idempotency key on every write tool', async () => {
    const tools = await listTools()

    for (const name of writeTools) {
      const tool = tools.find((candidate) => candidate.name === name)
      expect(tool?.inputSchema?.required ?? [], name).toContain('idempotency_key')
    }
  })

  it('does not expose collaborator email addresses', async () => {
    const tools = await listTools()
    const shares = tools.find((tool) => tool.name === 'list_plan_shares')
    const item = shares?.outputSchema?.properties?.items as
      | { items?: { properties?: Record<string, unknown> } }
      | undefined

    expect(Object.keys(item?.items?.properties ?? {})).not.toContain('user_email')
  })

  it('requires an idempotency key for the write tool', async () => {
    const tools = await listTools()
    const record = tools.find((tool) => tool.name === 'record_expense')
    const required = record?.inputSchema?.required ?? []

    expect(required).toContain('idempotency_key')
  })
})
