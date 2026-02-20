import { http, HttpResponse } from 'msw'
import { getAll, getById, insert, update, remove, filter } from 'src/mocks/data/db'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

type TableName =
  | 'categories'
  | 'users'
  | 'templates'
  | 'template_items'
  | 'template_shares'
  | 'plans'
  | 'plan_items'
  | 'plan_shares'
  | 'expenses'

const VALID_TABLES = new Set<TableName>([
  'categories',
  'users',
  'templates',
  'template_items',
  'template_shares',
  'plans',
  'plan_items',
  'plan_shares',
  'expenses',
])

function isValidTable(name: string): name is TableName {
  return VALID_TABLES.has(name as TableName)
}

function parseEqFilters(url: URL): Record<string, string> {
  const filters: Record<string, string> = {}
  for (const [key, value] of url.searchParams.entries()) {
    if (value.startsWith('eq.')) {
      filters[key] = value.slice(3)
    }
  }
  return filters
}

function parseInFilters(url: URL): Record<string, string[]> {
  const filters: Record<string, string[]> = {}
  for (const [key, value] of url.searchParams.entries()) {
    if (value.startsWith('in.(')) {
      const inner = value.slice(4, -1) // strip "in.(" and ")"
      filters[key] = inner.split(',').map((v) => v.replace(/^"|"$/g, ''))
    }
  }
  return filters
}

function applyFilters<T extends Record<string, unknown>>(
  rows: T[],
  eqFilters: Record<string, string>,
  inFilters: Record<string, string[]> = {},
): T[] {
  return rows.filter((row) => {
    const eqMatch = Object.entries(eqFilters).every(([key, val]) => String(row[key]) === val)
    const inMatch = Object.entries(inFilters).every(([key, vals]) =>
      vals.includes(String(row[key])),
    )
    return eqMatch && inMatch
  })
}

// Parse embedded resources from a PostgREST select string.
// Examples:
//   "*,template_shares!left(id)"  -> [{ name: "template_shares", columns: "id" }]
//   "permission_level,templates(*)" -> [{ name: "templates", columns: "*" }]
//   "*, categories(*)"           -> [{ name: "categories", columns: "*" }]
//   "*, template_items!template_items_template_id_fkey (*)" -> [{ name: "template_items", columns: "*" }]
type EmbeddedResource = { name: string; columns: string }

function parseEmbeddedResources(select: string): EmbeddedResource[] {
  const resources: EmbeddedResource[] = []
  // Match: word characters, optional !hint, then parenthesized content
  const re = /(\w+)(?:![^\s(]+)?\s*\(([^)]*)\)/g
  let m
  while ((m = re.exec(select)) !== null) {
    resources.push({ name: m[1] as string, columns: (m[2] as string).trim() })
  }
  return resources
}

// Determine which top-level columns to keep (everything except embedded resources).
// If the non-embedded part contains "*", keep all columns.
function parseTopLevelColumns(select: string): string[] | '*' {
  // Remove embedded resource expressions
  const stripped = select.replace(/(\w+)(?:![^\s(]+)?\s*\([^)]*\)/g, '')
  const parts = stripped
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.includes('*') || parts.length === 0) return '*'
  return parts
}

function pickColumns(
  row: Record<string, unknown>,
  columns: string[] | '*',
): Record<string, unknown> {
  if (columns === '*') return { ...row }
  const result: Record<string, unknown> = {}
  for (const col of columns) {
    if (col in row) result[col] = row[col]
  }
  return result
}

function getForeignKey(from: TableName, to: TableName): string | null {
  const fkMap: Record<string, Record<string, string>> = {
    expenses: {
      categories: 'category_id',
      plans: 'plan_id',
      plan_items: 'plan_item_id',
    },
    template_items: { categories: 'category_id', templates: 'template_id' },
    plan_items: { categories: 'category_id', plans: 'plan_id' },
    template_shares: { templates: 'template_id' },
    plan_shares: { plans: 'plan_id' },
  }
  return fkMap[from]?.[to] ?? null
}

function getReverseKey(parent: TableName, child: TableName): string | null {
  const reverseMap: Record<string, Record<string, string>> = {
    templates: {
      template_items: 'template_id',
      template_shares: 'template_id',
    },
    plans: {
      plan_items: 'plan_id',
      plan_shares: 'plan_id',
      expenses: 'plan_id',
    },
  }
  return reverseMap[parent]?.[child] ?? null
}

function resolveEmbedded(
  row: Record<string, unknown>,
  table: TableName,
  resource: EmbeddedResource,
): unknown {
  const relatedTable = resource.name
  if (!isValidTable(relatedTable)) return null

  // Forward FK: this table has a column pointing to the related table
  const fk = getForeignKey(table, relatedTable)
  if (fk) {
    const relatedId = row[fk] as string | null | undefined
    if (!relatedId) return null
    const related = getById(relatedTable, relatedId)
    if (!related) return null
    if (resource.columns === '*') return related
    return pickColumns(
      related as unknown as Record<string, unknown>,
      resource.columns.split(',').map((s) => s.trim()),
    )
  }

  // Reverse FK: related table has a column pointing to this table
  const reverseKey = getReverseKey(table, relatedTable)
  if (reverseKey) {
    const rowId = String(row['id'])
    const related = filter(relatedTable, (r) => {
      const record = r as Record<string, unknown>
      return String(record[reverseKey]) === rowId
    })
    if (resource.columns === '*') return related
    const cols = resource.columns.split(',').map((s) => s.trim())
    return related.map((r) => pickColumns(r as unknown as Record<string, unknown>, cols))
  }

  return null
}

function applySelect(
  rows: Record<string, unknown>[],
  select: string | null,
  table: TableName,
): Record<string, unknown>[] {
  if (!select || select === '*') return rows

  const topCols = parseTopLevelColumns(select)
  const embedded = parseEmbeddedResources(select)

  return rows.map((row) => {
    const result = pickColumns(row, topCols)
    for (const resource of embedded) {
      result[resource.name] = resolveEmbedded(row, table, resource)
    }
    return result
  })
}

export const postgrestHandlers = [
  // GET /rest/v1/:table — read records
  http.get(`${SUPABASE_URL}/rest/v1/:table`, ({ params, request }) => {
    const table = params['table'] as string
    if (!isValidTable(table)) {
      return HttpResponse.json({ message: `relation "${table}" does not exist` }, { status: 404 })
    }

    const url = new URL(request.url)
    const eqFilters = parseEqFilters(url)
    const inFilters = parseInFilters(url)
    const select = url.searchParams.get('select')

    let rows = getAll(table) as Record<string, unknown>[]
    rows = applyFilters(rows, eqFilters, inFilters)
    const result = applySelect(rows, select, table)

    const prefer = request.headers.get('Prefer') ?? ''
    if (prefer.includes('count=exact')) {
      return HttpResponse.json(result, {
        headers: {
          'Content-Range': `0-${result.length - 1}/${result.length}`,
        },
      })
    }

    return HttpResponse.json(result)
  }),

  // POST /rest/v1/:table — insert records
  http.post(`${SUPABASE_URL}/rest/v1/:table`, async ({ params, request }) => {
    const table = params['table'] as string
    if (!isValidTable(table)) {
      return HttpResponse.json({ message: `relation "${table}" does not exist` }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown> | Record<string, unknown>[]
    const rows = Array.isArray(body) ? body : [body]
    const created: Record<string, unknown>[] = []

    for (const row of rows) {
      const id = (row['id'] as string) ?? crypto.randomUUID()
      const now = new Date().toISOString()
      const record = {
        ...row,
        id,
        created_at: (row['created_at'] as string) ?? now,
        updated_at: null,
      }
      insert(table, record as never)
      created.push(record)
    }

    const prefer = request.headers.get('Prefer') ?? ''
    if (prefer.includes('return=representation')) {
      return HttpResponse.json(Array.isArray(body) ? created : created[0], { status: 201 })
    }

    return new HttpResponse(null, { status: 201 })
  }),

  // PATCH /rest/v1/:table — update records
  http.patch(`${SUPABASE_URL}/rest/v1/:table`, async ({ params, request }) => {
    const table = params['table'] as string
    if (!isValidTable(table)) {
      return HttpResponse.json({ message: `relation "${table}" does not exist` }, { status: 404 })
    }

    const url = new URL(request.url)
    const eqFilters = parseEqFilters(url)
    const inFilters = parseInFilters(url)
    const body = (await request.json()) as Record<string, unknown>
    const updated: Record<string, unknown>[] = []
    const select = url.searchParams.get('select')

    const allRows = getAll(table) as Record<string, unknown>[]
    const matching = applyFilters(allRows, eqFilters, inFilters)

    for (const row of matching) {
      const id = row['id'] as string
      const result = update(table, id, {
        ...body,
        updated_at: new Date().toISOString(),
      } as never)
      if (result) updated.push(result as Record<string, unknown>)
    }

    const prefer = request.headers.get('Prefer') ?? ''
    if (prefer.includes('return=representation')) {
      const response = applySelect(updated, select, table)
      return HttpResponse.json(response.length === 1 ? response[0] : response)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // DELETE /rest/v1/:table — delete records
  http.delete(`${SUPABASE_URL}/rest/v1/:table`, ({ params, request }) => {
    const table = params['table'] as string
    if (!isValidTable(table)) {
      return HttpResponse.json({ message: `relation "${table}" does not exist` }, { status: 404 })
    }

    const url = new URL(request.url)
    const eqFilters = parseEqFilters(url)
    const inFilters = parseInFilters(url)
    const allRows = getAll(table) as Record<string, unknown>[]
    const matching = applyFilters(allRows, eqFilters, inFilters)

    for (const row of matching) {
      remove(table, row['id'] as string)
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
