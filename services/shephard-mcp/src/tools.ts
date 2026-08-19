import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { AuthenticatedMcpRequest } from './auth.js'
import * as schemas from './schemas.js'

const uuid = schemas.uuid
const pageLimit = z.number().int().min(1).max(100).default(50)
const defaultLimit = 50
const rpcTimeoutMs = 10_000

type RpcContext = Pick<AuthenticatedMcpRequest, 'supabase'>
const idempotencyKey = uuid.describe(
  'A UUID that identifies this request. Reuse the same value when you retry a call that may already have been applied, so the change is not made twice. Use a new value for a genuinely new change.',
)

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const

const planItemInput = {
  name: z.string().trim().min(1).max(100),
  category_id: uuid,
  amount: z.number().positive().max(100000000),
  is_fixed_payment: z.boolean().optional(),
}

const expenseInput = z.object({
  name: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(100000000),
  plan_id: uuid,
  category_id: uuid,
  expense_date: z.string().date().optional(),
  plan_item_id: uuid.optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
})

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
    'list_templates',
    {
      title: 'List templates',
      description:
        'List the reusable budget templates that the signed-in Shephard user can access.',
      inputSchema: { limit: pageLimit.optional() },
      outputSchema: schemas.templateListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ limit }) =>
      toolResult(await callRpc(context, 'mcp_list_templates', { p_limit: limit ?? defaultLimit })),
  )

  server.registerTool(
    'get_template',
    {
      title: 'Get template',
      description: 'Get one accessible Shephard template with its items.',
      inputSchema: { template_id: uuid },
      outputSchema: schemas.template,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ template_id }) =>
      toolResult(await callRpc(context, 'mcp_get_template', { p_template_id: template_id })),
  )

  server.registerTool(
    'get_plan_summary',
    {
      title: 'Get plan summary',
      description:
        'Get planned versus actual spending per category for one plan. Use this to answer questions about which categories are over or under budget.',
      inputSchema: { plan_id: uuid },
      outputSchema: schemas.planSummaryOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ plan_id }) =>
      toolResult(await callRpc(context, 'mcp_get_plan_summary', { p_plan_id: plan_id })),
  )

  server.registerTool(
    'list_expenses_by_date_range',
    {
      title: 'List expenses by date range',
      description:
        'List accessible expenses with an expense_date inside an inclusive range. Use this for questions about a month, a week, or any other period.',
      inputSchema: {
        start_date: z.string().date(),
        end_date: z.string().date(),
        plan_id: uuid.optional(),
        limit: pageLimit.optional(),
      },
      outputSchema: schemas.dateRangeExpenseListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ start_date, end_date, plan_id, limit }) =>
      toolResult(
        await callRpc(context, 'mcp_list_expenses_by_date_range', {
          p_start_date: start_date,
          p_end_date: end_date,
          p_plan_id: plan_id ?? null,
          p_limit: limit ?? defaultLimit,
        }),
      ),
  )

  server.registerTool(
    'list_plan_shares',
    {
      title: 'List plan collaborators',
      description:
        'List the people a Shephard plan is shared with, and what each of them may do. Email addresses are not exposed.',
      inputSchema: { plan_id: uuid },
      outputSchema: schemas.planShareListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ plan_id }) =>
      toolResult(await callRpc(context, 'mcp_list_plan_shares', { p_plan_id: plan_id })),
  )

  server.registerTool(
    'list_notifications',
    {
      title: 'List notifications',
      description: "List the signed-in user's Shephard notifications, newest first.",
      inputSchema: { limit: pageLimit.optional() },
      outputSchema: schemas.notificationListOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ limit }) =>
      toolResult(
        await callRpc(context, 'mcp_list_notifications', { p_limit: limit ?? defaultLimit }),
      ),
  )

  server.registerTool(
    'get_user_preferences',
    {
      title: 'Get user preferences',
      description:
        "Get the signed-in user's default currency and theme. Read this before presenting amounts.",
      inputSchema: {},
      outputSchema: schemas.userPreferences,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => toolResult(await callRpc(context, 'mcp_get_user_preferences')),
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

  server.registerTool(
    'create_plan',
    {
      title: 'Create plan',
      description:
        'Create a budget plan from a template. Call list_templates first: a plan must reference a template the user can access. This changes financial data and requires a write-enabled connection.',
      inputSchema: {
        name: z.string().trim().min(1).max(100),
        template_id: uuid,
        start_date: z.string().date(),
        end_date: z.string().date(),
        currency: z.string().trim().length(3).toUpperCase(),
        total: z.number().nonnegative().max(100000000),
        items: z.array(z.object(planItemInput)).max(100).optional(),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.createdPlan,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, items, ...plan }) =>
      toolResult(
        await callRpc(context, 'mcp_create_plan', {
          p_request: { plan, items: items ?? [], idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'update_plan',
    {
      title: 'Update plan',
      description:
        'Change the name, dates, currency, or status of a plan. Plan items are not touched. Use update_plan_item or add_plan_item to change items.',
      inputSchema: {
        plan_id: uuid,
        name: z.string().trim().min(1).max(100).optional(),
        start_date: z.string().date().optional(),
        end_date: z.string().date().optional(),
        currency: z.string().trim().length(3).toUpperCase().optional(),
        status: z.string().trim().min(1).max(50).optional(),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.updatedPlan,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, plan_id, ...plan }) =>
      toolResult(
        await callRpc(context, 'mcp_update_plan', {
          p_request: { plan_id, plan, idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'add_plan_item',
    {
      title: 'Add plan item',
      description: 'Add one budgeted item to a plan the user can edit.',
      inputSchema: {
        plan_id: uuid,
        ...planItemInput,
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.planItem,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, ...item }) =>
      toolResult(
        await callRpc(context, 'mcp_add_plan_item', {
          p_request: { item, idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'update_plan_item',
    {
      title: 'Update plan item',
      description:
        'Change one plan item. Only the fields you send are changed. Use is_completed to mark an item done.',
      inputSchema: {
        plan_item_id: uuid,
        name: z.string().trim().min(1).max(100).optional(),
        category_id: uuid.optional(),
        amount: z.number().positive().max(100000000).optional(),
        is_fixed_payment: z.boolean().optional(),
        is_completed: z.boolean().optional(),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.planItem,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, plan_item_id, ...item }) =>
      toolResult(
        await callRpc(context, 'mcp_update_plan_item', {
          p_request: { plan_item_id, item, idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'record_expenses',
    {
      title: 'Record several expenses',
      description:
        'Create up to 50 expenses in one call. Prefer this over repeated record_expense calls when the user lists several purchases at once. All of them are written together, or none are.',
      inputSchema: {
        expenses: z.array(expenseInput).min(1).max(50),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.recordedExpenseListOutput,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, expenses }) =>
      toolResult(
        await callRpc(context, 'mcp_record_expenses', {
          p_request: { expenses, idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'update_expense',
    {
      title: 'Update expense',
      description:
        'Correct one recorded expense. Only the fields you send are changed. The plan an expense belongs to cannot be changed here.',
      inputSchema: {
        expense_id: uuid,
        name: z.string().trim().min(1).max(100).optional(),
        amount: z.number().positive().max(100000000).optional(),
        expense_date: z.string().date().optional(),
        category_id: uuid.optional(),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.recordedExpense,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, expense_id, ...expense }) =>
      toolResult(
        await callRpc(context, 'mcp_update_expense', {
          p_request: { expense_id, expense, idempotency_key },
        }),
      ),
  )

  server.registerTool(
    'create_template',
    {
      title: 'Create template',
      description:
        'Create a reusable budget template. Plans are created from templates, so make one before create_plan when no suitable template exists.',
      inputSchema: {
        name: z.string().trim().min(1).max(100),
        duration: z.string().trim().min(1).max(50),
        currency: z.string().trim().length(3).toUpperCase(),
        total: z.number().nonnegative().max(100000000),
        items: z.array(z.object(planItemInput)).max(100).optional(),
        idempotency_key: idempotencyKey,
      },
      outputSchema: schemas.createdTemplate,
      annotations: writeAnnotations,
    },
    async ({ idempotency_key, items, ...template }) =>
      toolResult(
        await callRpc(context, 'mcp_create_template', {
          p_request: { template, items: items ?? [], idempotency_key },
        }),
      ),
  )

  return server
}
