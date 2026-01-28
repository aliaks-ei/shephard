import type { DocIndex, DocPage, SearchResult } from '../types/index.js'
import { fetchRawFile, buildQuasarDocsUrl } from './github.js'

function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((term) => term.length > 1)
}

function calculateScore(page: DocPage, queryTerms: string[]): number {
  let score = 0
  const titleLower = page.title.toLowerCase()
  const pathLower = page.path.toLowerCase()

  for (const term of queryTerms) {
    // Exact title match (highest priority)
    if (titleLower === term || titleLower === `q-${term}`) {
      score += 100
    }
    // Title contains term
    else if (titleLower.includes(term)) {
      score += 50
    }

    // Path contains term
    if (pathLower.includes(term)) {
      score += 30
    }

    // Keyword match
    if (page.keywords.some((k) => k === term || k === `q-${term}`)) {
      score += 40
    } else if (page.keywords.some((k) => k.includes(term))) {
      score += 20
    }

    // Section match
    if (page.section.toLowerCase().includes(term)) {
      score += 15
    }
  }

  return score
}

export function searchIndex(index: DocIndex, query: string, limit: number = 10): SearchResult[] {
  const queryTerms = normalizeQuery(query)
  if (queryTerms.length === 0) {
    return []
  }

  const results: SearchResult[] = []

  for (const page of index.pages) {
    const score = calculateScore(page, queryTerms)
    if (score > 0) {
      results.push({
        title: page.title,
        path: page.path,
        section: page.section,
        url: page.url,
        snippet: `Section: ${page.section}`,
        score,
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

export async function searchContent(
  query: string,
  paths: string[],
  limit: number = 5,
): Promise<SearchResult[]> {
  const queryTerms = normalizeQuery(query)
  if (queryTerms.length === 0) {
    return []
  }

  const results: SearchResult[] = []

  for (const path of paths) {
    const content = await fetchRawFile(path)
    if (!content) continue

    const contentLower = content.toLowerCase()
    let score = 0
    let snippet = ''

    for (const term of queryTerms) {
      const termIndex = contentLower.indexOf(term)
      if (termIndex !== -1) {
        score += 10

        // Extract snippet around the match
        if (!snippet) {
          const start = Math.max(0, termIndex - 50)
          const end = Math.min(content.length, termIndex + term.length + 100)
          snippet = content.slice(start, end).replace(/\n/g, ' ').trim()
          if (start > 0) snippet = '...' + snippet
          if (end < content.length) snippet = snippet + '...'
        }
      }
    }

    if (score > 0) {
      results.push({
        title: path.split('/').pop()?.replace('.md', '') || path,
        path,
        section: path.split('/')[0],
        url: buildQuasarDocsUrl(path),
        snippet,
        score,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

export function filterBySection(index: DocIndex, section: string): DocPage[] {
  const sectionLower = section.toLowerCase()
  return index.pages.filter(
    (page) =>
      page.section.toLowerCase() === sectionLower ||
      page.section.toLowerCase().includes(sectionLower),
  )
}
