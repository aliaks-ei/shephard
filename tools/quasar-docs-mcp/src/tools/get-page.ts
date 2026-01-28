import { z } from 'zod'
import { fetchRawFile, buildQuasarDocsUrl } from '../services/github.js'

export const getPageSchema = z.object({
  path: z
    .string()
    .describe(
      "Path to the documentation page (e.g., 'vue-components/btn', 'style/color-palette', 'quasar-plugins/notify')",
    ),
})

export type GetPageInput = z.infer<typeof getPageSchema>

export async function getPage(
  input: GetPageInput,
): Promise<{ content: string; url: string } | { error: string }> {
  // Normalize the path
  let path = input.path
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/$/, '') // Remove trailing slash

  // Add .md extension if not present
  if (!path.endsWith('.md')) {
    path = `${path}.md`
  }

  const content = await fetchRawFile(path)

  if (content) {
    return {
      content,
      url: buildQuasarDocsUrl(path),
    }
  }

  // Try with /index.md suffix
  const indexPath = path.replace(/\.md$/, '/index.md')
  const indexContent = await fetchRawFile(indexPath)

  if (indexContent) {
    return {
      content: indexContent,
      url: buildQuasarDocsUrl(indexPath),
    }
  }

  return {
    error: `Page '${input.path}' not found. Use 'list_quasar_sections' to see available sections or 'search_quasar_docs' to search.`,
  }
}
