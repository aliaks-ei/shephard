import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { AuthenticatedMcpRequest } from './auth.js'
import * as schemas from './schemas.js'

const uuid = schemas.uuid
const pageLimit = z.number().int().min(1).max(100).default(50)
const defaultLimit = 50
const rpcTimeoutMs = 10_000

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

export function mapRpcError(error: { code?: string; message?: string }): Error {
  if (error.code === '42501')
    return new Error('This Shephard connection is not authorized for that action.')
  if (error.code === 'P0002') return new Error('The requested Shephard item was not found.')
  // 22023 is raised by the mcp_* functions for payload problems the caller can fix,
  // such as an invalid expense or a reused idempotency key. Surface that message.
  if (error.code === '22023')
    return new Error(error.message ?? 'The request was rejected as invalid.')
  return new Error('Shephard could not complete that request.')
}

async function callRpc<T>(
  context: RpcContext,
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await context.supabase
    .rpc(name as never, args as never)
    .abortSignal(AbortSignal.timeout(rpcTimeoutMs))
  if (error) throw mapRpcError(error)
  return data as T
}

export function nextExpenseCursor(
  items: z.infer<typeof schemas.expense>[],
  limit: number,
): z.infer<typeof schemas.expenseCursor> | null {
  if (items.length < limit) return null
  const last = items.at(-1)
  if (!last?.created_at) return null
  return { before_created_at: last.created_at, before_id: last.id }
}

export function createShephardMcpServer(context: AuthenticatedMcpRequest): McpServer {
  const server = new McpServer({ name: 'shephard', version: '0.1.0' })

  server.registerTool(
    'list_plans',
    {
      title: 'List plans',
      description: 'List budget plans that the signed-in Shephard user can access.',
      inputSchema: { limit: pageLimit.optional() },
      outputSchema: schemas.planListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ limit }) =>
      toolResult(await callRpc(context, 'mcp_list_plans', { p_limit: limit ?? defaultLimit })),
  )

  server.registerTool(
    'get_plan_overview',
    {
      title: 'Get plan overview',
      description:
        'Get the budget, spending progress, and plan items for one accessible Shephard plan.',
      inputSchema: { plan_id: uuid },
      outputSchema: schemas.planOverview,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ plan_id }) =>
      toolResult(await callRpc(context, 'mcp_get_plan_overview', { p_plan_id: plan_id })),
  )

  server.registerTool(
    'list_expenses',
    {
      title: 'List expenses',
      description:
        'List recent accessible expenses, newest first. Results are capped at 100 per call. To read the next page, pass the returned next_cursor values back as before_created_at and before_id.',
      inputSchema: {
        plan_id: uuid.optional(),
        limit: pageLimit.optional(),
        before_created_at: z.string().datetime({ offset: true }).optional(),
        before_id: uuid.optional(),
      },
      outputSchema: schemas.expenseListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ plan_id, limit, before_created_at, before_id }) => {
      const effectiveLimit = limit ?? defaultLimit
      const items = await callRpc<z.infer<typeof schemas.expense>[]>(context, 'mcp_list_expenses', {
        p_plan_id: plan_id ?? null,
        p_limit: effectiveLimit,
        p_before_created_at: before_created_at ?? null,
        p_before_id: before_id ?? null,
      })
      return toolResult({ items, next_cursor: nextExpenseCursor(items, effectiveLimit) })
    },
  )

  server.registerTool(
    'list_categories',
    {
      title: 'List categories',
      description: 'List valid Shephard expense categories before creating an expense.',
      inputSchema: {},
      outputSchema: schemas.categoryListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
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
        idempotency_key: uuid.describe(
          'A UUID that identifies this expense. Reuse the same value when you retry a call that may already have been applied, so the expense is not recorded twice. Use a new value for a genuinely new expense.',
        ),
        expense_date: z.string().date().optional(),
        plan_item_id: uuid.optional(),
        currency: z.string().trim().length(3).toUpperCase().optional(),
        original_amount: z.number().positive().max(100000000).optional(),
        original_currency: z.string().trim().length(3).toUpperCase().optional(),
      },
      outputSchema: schemas.recordedExpense,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ idempotency_key, ...expense }) =>
      toolResult(
        await callRpc(context, 'mcp_create_expense', {
          p_request: { expense, idempotency_key },
        }),
      ),
  )

  return server
}
