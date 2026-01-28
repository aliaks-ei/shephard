import { z } from 'zod'
import type { DocIndex } from '../types/index.js'
import { searchIndex, searchContent, filterBySection } from '../services/search.js'
import { buildLightweightIndex } from '../services/indexer.js'

export const searchDocsSchema = z.object({
  query: z.string().describe("Search query (e.g., 'button', 'form validation', 'dark mode')"),
  section: z
    .string()
    .optional()
    .describe(
      "Optional: limit search to a specific section (e.g., 'vue-components', 'style', 'quasar-plugins')",
    ),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of results to return (default: 10)'),
  includeContent: z
    .boolean()
    .default(false)
    .describe('Whether to search within file contents (slower but more thorough)'),
})

export type SearchDocsInput = z.infer<typeof searchDocsSchema>

let cachedIndex: DocIndex | null = null
let indexBuildTime: number = 0
const INDEX_TTL_MS = 60 * 60 * 1000 // 1 hour

async function getIndex(): Promise<DocIndex> {
  const now = Date.now()

  if (cachedIndex && now - indexBuildTime < INDEX_TTL_MS) {
    return cachedIndex
  }

  cachedIndex = await buildLightweightIndex()
  indexBuildTime = now
  return cachedIndex
}

export async function searchDocs(input: SearchDocsInput): Promise<string> {
  const index = await getIndex()

  // Filter by section if specified
  let pagesToSearch = index.pages
  if (input.section) {
    pagesToSearch = filterBySection(index, input.section)
    if (pagesToSearch.length === 0) {
      return `No pages found in section '${input.section}'. Available sections: ${index.sections.map((s) => s.name).join(', ')}`
    }
  }

  // Create a filtered index for searching
  const filteredIndex: DocIndex = {
    ...index,
    pages: pagesToSearch,
  }

  // Search the index
  let results = searchIndex(filteredIndex, input.query, input.limit)

  // If content search is enabled and we have few results, search content too
  if (input.includeContent && results.length < input.limit) {
    const pathsToSearch = pagesToSearch
      .slice(0, 50) // Limit content search to first 50 pages for performance
      .map((p) => p.path)

    const contentResults = await searchContent(
      input.query,
      pathsToSearch,
      input.limit - results.length,
    )

    // Merge results, avoiding duplicates
    const existingPaths = new Set(results.map((r) => r.path))
    for (const result of contentResults) {
      if (!existingPaths.has(result.path)) {
        results.push(result)
      }
    }
  }

  if (results.length === 0) {
    return `No results found for '${input.query}'.${
      input.section ? ` Try removing the section filter or searching in a different section.` : ''
    }`
  }

  // Format results
  const formatted = results
    .map(
      (r, i) =>
        `${i + 1}. **${r.title}**\n   Section: ${r.section}\n   Path: ${r.path}\n   URL: ${r.url}${
          r.snippet && r.snippet !== `Section: ${r.section}` ? `\n   Snippet: ${r.snippet}` : ''
        }`,
    )
    .join('\n\n')

  return `Found ${results.length} result(s) for '${input.query}':\n\n${formatted}`
}
