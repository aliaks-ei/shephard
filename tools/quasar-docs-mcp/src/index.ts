#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { getComponentSchema, getComponent } from './tools/get-component.js'
import { getPageSchema, getPage } from './tools/get-page.js'
import { searchDocsSchema, searchDocs } from './tools/search-docs.js'
import { listSectionsSchema, listSections } from './tools/list-sections.js'

const server = new McpServer({
  name: 'quasar-docs',
  version: '1.0.0',
})

// Tool: Get Quasar Component documentation
server.tool(
  'get_quasar_component',
  'Get documentation for a specific Quasar UI component. Returns the full markdown documentation including API, props, events, slots, and examples.',
  getComponentSchema.shape,
  async (input) => {
    const result = await getComponent(input)

    if ('error' in result) {
      return {
        content: [{ type: 'text', text: result.error }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `# Documentation for ${input.component}\n\nURL: ${result.url}\n\n---\n\n${result.content}`,
        },
      ],
    }
  },
)

// Tool: Get any Quasar documentation page
server.tool(
  'get_quasar_page',
  'Get any Quasar documentation page by its path. Use this for non-component docs like style guides, plugins, CLI docs, etc.',
  getPageSchema.shape,
  async (input) => {
    const result = await getPage(input)

    if ('error' in result) {
      return {
        content: [{ type: 'text', text: result.error }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `# Documentation: ${input.path}\n\nURL: ${result.url}\n\n---\n\n${result.content}`,
        },
      ],
    }
  },
)

// Tool: Search Quasar documentation
server.tool(
  'search_quasar_docs',
  'Search the Quasar documentation for a topic, component, or feature. Returns a list of matching pages with their paths and URLs.',
  searchDocsSchema.shape,
  async (input) => {
    const result = await searchDocs(input)

    return {
      content: [{ type: 'text', text: result }],
    }
  },
)

// Tool: List documentation sections
server.tool(
  'list_quasar_sections',
  'List all available Quasar documentation sections, or list pages within a specific section. Useful for discovering what documentation is available.',
  listSectionsSchema.shape,
  async (input) => {
    const result = await listSections(input)

    return {
      content: [{ type: 'text', text: result }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Log to stderr (not stdout) to avoid breaking MCP protocol
  console.error('Quasar Docs MCP server started')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
