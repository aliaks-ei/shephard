import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { AuthenticatedMcpRequest } from './auth.js'

const uuid = z.string().uuid()
const pageLimit = z.number().int().min(1).max(100).default(50)
const objectOutput = z.object({}).passthrough()
const listOutput = z.object({ items: z.array(objectOutput) })

type RpcContext = Pick<AuthenticatedMcpRequest, 'supabase'>

export function toolResult(payload: unknown) {
  const structuredContent =
    payload !== null && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : { items: payload }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    structuredContent,
  }
}

async function callRpc<T>(
  context: RpcContext,
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await context.supabase.rpc(name as never, args as never)
  if (error) {
    if (error.code === '42501')
      throw new Error('This Shephard connection is not authorized for that action.')
    if (error.code === 'P0002') throw new Error('The requested Shephard item was not found.')
    throw new Error('Shephard could not complete that request.')
  }
  return data as T
}

export function createShephardMcpServer(context: AuthenticatedMcpRequest): McpServer {
  const server = new McpServer({ name: 'shephard', version: '0.1.0' })

  server.registerTool(
    'list_plans',
    {
      title: 'List plans',
      description: 'List budget plans that the signed-in Shephard user can access.',
      inputSchema: { limit: pageLimit.optional() },
      outputSchema: listOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ limit }) =>
      toolResult(await callRpc(context, 'mcp_list_plans', { p_limit: limit ?? 50 })),
  )

  server.registerTool(
    'get_plan_overview',
    {
      title: 'Get plan overview',
      description:
        'Get the budget, spending progress, and plan items for one accessible Shephard plan.',
      inputSchema: { plan_id: uuid },
      outputSchema: objectOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ plan_id }) =>
      toolResult(await callRpc(context, 'mcp_get_plan_overview', { p_plan_id: plan_id })),
  )

  server.registerTool(
    'list_expenses',
    {
      title: 'List expenses',
      description:
        'List recent accessible expenses. Results are capped at 100 and can be paginated using the returned created_at and id values.',
      inputSchema: {
        plan_id: uuid.optional(),
        limit: pageLimit.optional(),
        before_created_at: z.string().datetime({ offset: true }).optional(),
        before_id: uuid.optional(),
      },
      outputSchema: listOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ plan_id, limit, before_created_at, before_id }) =>
      toolResult(
        await callRpc(context, 'mcp_list_expenses', {
          p_plan_id: plan_id ?? null,
          p_limit: limit ?? 50,
          p_before_created_at: before_created_at ?? null,
          p_before_id: before_id ?? null,
        }),
      ),
  )

  server.registerTool(
    'list_categories',
    {
      title: 'List categories',
      description: 'List valid Shephard expense categories before creating an expense.',
      inputSchema: {},
      outputSchema: listOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => toolResult(await callRpc(context, 'mcp_list_categories')),
  )

  server.registerTool(
    'record_expense',
    {
      title: 'Record expense',
      description:
        'Create one expense in an editable Shephard plan. This changes financial data and requires an explicit write-enabled connection.',
      inputSchema: {
        name: z.string().trim().min(1).max(100),
        amount: z.number().positive().max(100000000),
        plan_id: uuid,
        category_id: uuid,
        expense_date: z.string().date().optional(),
        plan_item_id: uuid.optional(),
        currency: z.string().trim().length(3).toUpperCase().optional(),
        original_amount: z.number().positive().max(100000000).optional(),
        original_currency: z.string().trim().length(3).toUpperCase().optional(),
        idempotency_key: uuid.optional(),
      },
      outputSchema: objectOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ idempotency_key, ...expense }) => {
      const result = await callRpc(context, 'mcp_create_expense', {
        p_request: {
          expense,
          idempotency_key: idempotency_key ?? randomUUID(),
        },
      })
      return toolResult(result)
    },
  )

  return server
}
