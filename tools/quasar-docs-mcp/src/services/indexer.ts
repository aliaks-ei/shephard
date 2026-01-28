import type { DocIndex, DocPage, DocSection } from '../types/index.js'
import { fetchAllMarkdownFiles, fetchRawFile, buildQuasarDocsUrl } from './github.js'

// Pre-defined sections based on Quasar docs structure
const SECTION_DEFINITIONS: Record<string, { title: string; description: string }> = {
  'vue-components': {
    title: 'Vue Components',
    description: 'Quasar UI components like buttons, inputs, dialogs, etc.',
  },
  'vue-directives': {
    title: 'Vue Directives',
    description: 'Custom Vue directives for DOM manipulation',
  },
  'vue-composables': {
    title: 'Vue Composables',
    description: 'Composition API utilities and hooks',
  },
  'quasar-plugins': {
    title: 'Quasar Plugins',
    description: 'Plugins for notifications, dialogs, loading states, etc.',
  },
  'quasar-utils': {
    title: 'Quasar Utils',
    description: 'Utility functions for common tasks',
  },
  layout: {
    title: 'Layout',
    description: 'Layout components and page structure',
  },
  style: {
    title: 'Style',
    description: 'CSS classes, typography, colors, and theming',
  },
  options: {
    title: 'Options',
    description: 'Configuration options and settings',
  },
  'quasar-cli-vite': {
    title: 'Quasar CLI (Vite)',
    description: 'Vite-based CLI documentation',
  },
  'quasar-cli-webpack': {
    title: 'Quasar CLI (Webpack)',
    description: 'Webpack-based CLI documentation',
  },
  start: {
    title: 'Getting Started',
    description: 'Installation and setup guides',
  },
  'introduction-to-quasar': {
    title: 'Introduction',
    description: 'Overview of Quasar Framework',
  },
  'app-extensions': {
    title: 'App Extensions',
    description: 'Creating and using Quasar app extensions',
  },
  security: {
    title: 'Security',
    description: 'Security best practices',
  },
}

function extractTitleFromMarkdown(content: string): string {
  // Try to extract title from frontmatter or first heading
  const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?title:\s*['"]?([^'"\n]+)['"]?/m)
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim()
  }

  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) {
    return headingMatch[1].trim()
  }

  return ''
}

function extractKeywordsFromMarkdown(content: string, path: string): string[] {
  const keywords: string[] = []

  // Add path-based keywords
  const pathParts = path.split('/')
  keywords.push(...pathParts.map((p) => p.replace('.md', '').toLowerCase()))

  // Extract component name if it's a q-* component
  const componentMatch = path.match(/([a-z-]+)\.md$/)
  if (componentMatch) {
    const name = componentMatch[1]
    keywords.push(name)
    keywords.push(`q-${name}`)
  }

  // Extract keywords from frontmatter
  const keywordsMatch = content.match(/keywords:\s*\[([^\]]+)\]/)
  if (keywordsMatch) {
    const extracted = keywordsMatch[1]
      .split(',')
      .map((k) => k.trim().replace(/['"]/g, '').toLowerCase())
    keywords.push(...extracted)
  }

  // Extract common terms from content
  const terms = content.toLowerCase().match(/\b(api|props?|events?|slots?|methods?|examples?)\b/g)
  if (terms) {
    keywords.push(...new Set(terms))
  }

  return [...new Set(keywords)]
}

export async function buildIndex(): Promise<DocIndex> {
  const files = await fetchAllMarkdownFiles()
  const sections: DocSection[] = []
  const pages: DocPage[] = []
  const seenSections = new Set<string>()

  for (const filePath of files) {
    const sectionName = filePath.split('/')[0]

    // Add section if not seen
    if (!seenSections.has(sectionName)) {
      seenSections.add(sectionName)
      const sectionDef = SECTION_DEFINITIONS[sectionName] || {
        title: sectionName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Documentation for ${sectionName}`,
      }
      sections.push({
        name: sectionName,
        path: sectionName,
        title: sectionDef.title,
        description: sectionDef.description,
      })
    }

    // Fetch file content for metadata
    const content = await fetchRawFile(filePath)
    const title = content
      ? extractTitleFromMarkdown(content)
      : filePath.split('/').pop()?.replace('.md', '') || ''
    const keywords = content ? extractKeywordsFromMarkdown(content, filePath) : []

    pages.push({
      path: filePath,
      title: title || filePath.split('/').pop()?.replace('.md', '') || '',
      section: sectionName,
      keywords,
      url: buildQuasarDocsUrl(filePath),
    })
  }

  return {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    sections: sections.sort((a, b) => a.name.localeCompare(b.name)),
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
  }
}

// Lightweight index that doesn't require fetching all file contents
export async function buildLightweightIndex(): Promise<DocIndex> {
  const files = await fetchAllMarkdownFiles()
  const sections: DocSection[] = []
  const pages: DocPage[] = []
  const seenSections = new Set<string>()

  for (const filePath of files) {
    const sectionName = filePath.split('/')[0]

    // Add section if not seen
    if (!seenSections.has(sectionName)) {
      seenSections.add(sectionName)
      const sectionDef = SECTION_DEFINITIONS[sectionName] || {
        title: sectionName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Documentation for ${sectionName}`,
      }
      sections.push({
        name: sectionName,
        path: sectionName,
        title: sectionDef.title,
        description: sectionDef.description,
      })
    }

    const fileName = filePath.split('/').pop()?.replace('.md', '') || ''
    const title = fileName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    pages.push({
      path: filePath,
      title,
      section: sectionName,
      keywords: [fileName, `q-${fileName}`, sectionName],
      url: buildQuasarDocsUrl(filePath),
    })
  }

  return {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    sections: sections.sort((a, b) => a.name.localeCompare(b.name)),
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
  }
}
