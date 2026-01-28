export type DocSection = {
  name: string
  path: string
  title: string
  description: string
}

export type DocPage = {
  path: string
  title: string
  section: string
  keywords: string[]
  url: string
}

export type DocIndex = {
  version: string
  buildDate: string
  sections: DocSection[]
  pages: DocPage[]
}

export type SearchResult = {
  title: string
  path: string
  section: string
  url: string
  snippet: string
  score: number
}

export type CacheEntry = {
  content: string
  fetchedAt: number
  expiresAt: number
}

export type Cache = Map<string, CacheEntry>
