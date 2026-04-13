import type { Category, ExpenseWithCategory, PlanWithItems, TemplateWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'

export type ExportFormat = 'json' | 'csv'

export type ExportDownload = {
  filename: string
  mimeType: string
  content: string
}

export type ExportItemRecord = {
  id: string
  name: string
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  amount: number
  is_fixed_payment: boolean
}

export type TemplateExportPayload = {
  schema_version: string
  exported_at: string
  entity_type: 'template'
  template: {
    id: string
    name: string
    duration: string
    currency: string | null
    total: number | null
    owner_id: string
    created_at: string
    updated_at: string | null
  }
  items: ExportItemRecord[]
}

export type PlanExportCategorySummary = {
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  planned_amount: number
  actual_amount: number
  remaining_amount: number
  expense_count: number
}

export type PlanExportExpense = {
  id: string
  name: string
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  amount: number
  currency: string | null
  original_amount: number | null
  original_currency: string | null
  expense_date: string
  plan_item_id: string | null
  created_at: string
  updated_at: string | null
}

export type PlanExportPayload = {
  schema_version: string
  exported_at: string
  entity_type: 'plan'
  plan: {
    id: string
    name: string
    template_id: string | null
    start_date: string
    end_date: string
    status: string | null
    currency: string | null
    total: number | null
    owner_id: string
    created_at: string
    updated_at: string | null
  }
  items: ExportItemRecord[]
  category_summary: PlanExportCategorySummary[]
  expenses: PlanExportExpense[]
}

const EXPORT_SCHEMA_VERSION = '1.0'

type CategoryLookup = Map<string, Category>

function buildCategoryLookup(categories: Category[]): CategoryLookup {
  return new Map(categories.map((category) => [category.id, category]))
}

function toDateStamp(date: string): string {
  return date.slice(0, 10)
}

function slugifyFilePart(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

function toExportItemRecord(
  item: {
    id: string
    name: string
    category_id: string
    amount: number
    is_fixed_payment?: boolean | null
  },
  categoryLookup: CategoryLookup,
): ExportItemRecord {
  const category = categoryLookup.get(item.category_id)

  return {
    id: item.id,
    name: item.name,
    category_id: item.category_id,
    category_name: category?.name || '',
    category_color: category?.color || null,
    category_icon: category?.icon || null,
    amount: item.amount,
    is_fixed_payment: item.is_fixed_payment ?? true,
  }
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
      ? String(value)
      : JSON.stringify(value)
  if (!/[",\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replace(/"/g, '""')}"`
}

function buildCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','))

  return [header, ...lines].join('\n')
}

function createExportDownload(
  filename: string,
  format: ExportFormat,
  payload: object,
  csvBuilder: () => string,
): ExportDownload {
  if (format === 'json') {
    return {
      filename: `${filename}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(payload, null, 2),
    }
  }

  return {
    filename: `${filename}.csv`,
    mimeType: 'text/csv;charset=utf-8',
    content: csvBuilder(),
  }
}

export function createTemplateExportPayload(
  template: TemplateWithItems,
  categories: Category[],
  exportedAt = new Date().toISOString(),
): TemplateExportPayload {
  const categoryLookup = buildCategoryLookup(categories)

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: exportedAt,
    entity_type: 'template',
    template: {
      id: template.id,
      name: template.name,
      duration: template.duration,
      currency: template.currency,
      total: template.total,
      owner_id: template.owner_id,
      created_at: template.created_at,
      updated_at: template.updated_at,
    },
    items: template.template_items.map((item) => toExportItemRecord(item, categoryLookup)),
  }
}

export function createPlanExportPayload(
  plan: PlanWithItems,
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  expenses: ExpenseWithCategory[],
  exportedAt = new Date().toISOString(),
): PlanExportPayload {
  const categoryLookup = buildCategoryLookup(categories)

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: exportedAt,
    entity_type: 'plan',
    plan: {
      id: plan.id,
      name: plan.name,
      template_id: plan.template_id,
      start_date: plan.start_date,
      end_date: plan.end_date,
      status: plan.status,
      currency: plan.currency,
      total: plan.total,
      owner_id: plan.owner_id,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    },
    items: plan.plan_items.map((item) => toExportItemRecord(item, categoryLookup)),
    category_summary: categoryBudgets.map((budget) => ({
      category_id: budget.categoryId,
      category_name: budget.categoryName,
      category_color: budget.categoryColor || null,
      category_icon: budget.categoryIcon || null,
      planned_amount: budget.plannedAmount,
      actual_amount: budget.actualAmount,
      remaining_amount: budget.remainingAmount,
      expense_count: budget.expenseCount,
    })),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      name: expense.name,
      category_id: expense.category_id,
      category_name: expense.categories?.name || '',
      category_color: expense.categories?.color || null,
      category_icon: expense.categories?.icon || null,
      amount: expense.amount,
      currency: expense.currency,
      original_amount: expense.original_amount,
      original_currency: expense.original_currency,
      expense_date: expense.expense_date,
      plan_item_id: expense.plan_item_id,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    })),
  }
}

export function createTemplateExportDownload(
  template: TemplateWithItems,
  categories: Category[],
  format: ExportFormat,
  exportedAt = new Date().toISOString(),
): ExportDownload {
  const payload = createTemplateExportPayload(template, categories, exportedAt)
  const filename = `template_${slugifyFilePart(template.name, 'template')}_${toDateStamp(exportedAt)}`

  return createExportDownload(filename, format, payload, () =>
    buildCsv(
      [
        'schema_version',
        'exported_at',
        'template_id',
        'template_name',
        'duration',
        'currency',
        'total',
        'item_id',
        'item_name',
        'category_id',
        'category_name',
        'category_color',
        'category_icon',
        'amount',
        'is_fixed_payment',
      ],
      payload.items.map((item) => ({
        schema_version: payload.schema_version,
        exported_at: payload.exported_at,
        template_id: payload.template.id,
        template_name: payload.template.name,
        duration: payload.template.duration,
        currency: payload.template.currency,
        total: payload.template.total,
        item_id: item.id,
        item_name: item.name,
        category_id: item.category_id,
        category_name: item.category_name,
        category_color: item.category_color,
        category_icon: item.category_icon,
        amount: item.amount,
        is_fixed_payment: item.is_fixed_payment,
      })),
    ),
  )
}

export function createPlanExportDownload(
  plan: PlanWithItems,
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  expenses: ExpenseWithCategory[],
  format: ExportFormat,
  exportedAt = new Date().toISOString(),
): ExportDownload {
  const payload = createPlanExportPayload(plan, categories, categoryBudgets, expenses, exportedAt)
  const filename = `plan_${slugifyFilePart(plan.name, 'plan')}_${toDateStamp(exportedAt)}`
  const categorySummaryById = new Map(
    payload.category_summary.map((summary) => [summary.category_id, summary]),
  )

  return createExportDownload(filename, format, payload, () =>
    buildCsv(
      [
        'schema_version',
        'exported_at',
        'plan_id',
        'plan_name',
        'status',
        'start_date',
        'end_date',
        'currency',
        'total',
        'item_id',
        'item_name',
        'category_id',
        'category_name',
        'category_color',
        'category_icon',
        'amount',
        'is_fixed_payment',
        'category_actual_amount',
        'category_remaining_amount',
        'category_expense_count',
      ],
      payload.items.map((item) => {
        const summary = categorySummaryById.get(item.category_id)

        return {
          schema_version: payload.schema_version,
          exported_at: payload.exported_at,
          plan_id: payload.plan.id,
          plan_name: payload.plan.name,
          status: payload.plan.status,
          start_date: payload.plan.start_date,
          end_date: payload.plan.end_date,
          currency: payload.plan.currency,
          total: payload.plan.total,
          item_id: item.id,
          item_name: item.name,
          category_id: item.category_id,
          category_name: item.category_name,
          category_color: item.category_color,
          category_icon: item.category_icon,
          amount: item.amount,
          is_fixed_payment: item.is_fixed_payment,
          category_actual_amount: summary?.actual_amount ?? 0,
          category_remaining_amount: summary?.remaining_amount ?? 0,
          category_expense_count: summary?.expense_count ?? 0,
        }
      }),
    ),
  )
}

export function downloadExportFile(download: ExportDownload): void {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error('EXPORT_DOWNLOAD_UNSUPPORTED')
  }

  const blob = new Blob([download.content], { type: download.mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = download.filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
