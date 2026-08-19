import { z } from 'zod'

// These shapes mirror the return columns of the public.mcp_* SQL functions.
// They are declared as tool output schemas so that MCP clients receive real
// `properties` and `required` lists instead of an untyped object.

export const uuid = z.string().uuid()
export const isoDate = z.string().describe('Calendar date, YYYY-MM-DD')
export const isoTimestamp = z.string().describe('ISO 8601 timestamp')
export const currencyCode = z.string().length(3).describe('ISO 4217 currency code')

export const planSummary = z.object({
  id: uuid,
  name: z.string(),
  start_date: isoDate,
  end_date: isoDate,
  status: z.string().describe('Plan lifecycle status, for example active or archived'),
  currency: currencyCode,
  total: z.number().describe('Planned budget total for the plan'),
  permission_level: z.string().describe('Access of the signed-in user: owner, edit, or view'),
})

export const planOverviewItem = z.object({
  id: uuid,
  name: z.string(),
  category_id: uuid,
  category_name: z.string(),
  planned_amount: z.number(),
  spent_amount: z.number(),
  remaining_amount: z
    .number()
    .describe('planned_amount minus spent_amount; negative when overspent'),
  is_completed: z.boolean().nullable(),
})

export const planOverview = planSummary.extend({
  items: z.array(planOverviewItem),
})

export const expense = z.object({
  id: uuid,
  name: z.string(),
  amount: z.number(),
  expense_date: isoDate,
  currency: currencyCode,
  plan_id: uuid,
  plan_name: z.string(),
  category_id: uuid,
  category_name: z.string(),
  plan_item_id: uuid.nullable(),
  created_at: isoTimestamp.nullable(),
})

export const expenseCursor = z
  .object({
    before_created_at: isoTimestamp,
    before_id: uuid,
  })
  .describe('Pass these values back to list_expenses to fetch the next page')

export const category = z.object({
  id: uuid,
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
})

export const recordedExpense = z.object({
  id: uuid,
  name: z.string(),
  amount: z.number(),
  currency: currencyCode.nullable(),
  expense_date: isoDate.nullable(),
  plan_id: uuid,
  category_id: uuid,
})

export const planListOutput = z.object({ items: z.array(planSummary) })
export const expenseListOutput = z.object({
  items: z.array(expense),
  next_cursor: expenseCursor.nullable(),
})
export const categoryListOutput = z.object({ items: z.array(category) })
