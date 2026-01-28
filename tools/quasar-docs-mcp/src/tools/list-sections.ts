import { z } from 'zod'
import type { DocIndex } from '../types/index.js'
import { buildLightweightIndex } from '../services/indexer.js'
import { filterBySection } from '../services/search.js'

export const listSectionsSchema = z.object({
  section: z
    .string()
    .optional()
    .describe("Optional: show pages within a specific section (e.g., 'vue-components')"),
})

export type ListSectionsInput = z.infer<typeof listSectionsSchema>

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

export async function listSections(input: ListSectionsInput): Promise<string> {
  const index = await getIndex()

  if (input.section) {
    // List pages within a specific section
    const pages = filterBySection(index, input.section)

    if (pages.length === 0) {
      const availableSections = index.sections.map((s) => s.name).join(', ')
      return `Section '${input.section}' not found. Available sections: ${availableSections}`
    }

    const section = index.sections.find(
      (s) => s.name.toLowerCase() === input.section!.toLowerCase(),
    )
    const sectionTitle = section?.title || input.section

    const pageList = pages.map((p) => `- **${p.title}** (${p.path})`).join('\n')

    return `## ${sectionTitle}\n\n${pages.length} page(s):\n\n${pageList}`
  }

  // List all sections with their descriptions
  const sectionList = index.sections
    .map(
      (s) =>
        `### ${s.title}\n- Path: \`${s.path}\`\n- ${s.description}\n- Pages: ${
          index.pages.filter((p) => p.section === s.name).length
        }`,
    )
    .join('\n\n')

  return `# Quasar Documentation Sections\n\n${index.sections.length} section(s) available:\n\n${sectionList}\n\nUse \`list_quasar_sections\` with a section name to see pages within that section.`
}
