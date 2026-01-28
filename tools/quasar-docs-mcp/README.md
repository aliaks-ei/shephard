# Quasar Docs MCP Server

An MCP (Model Context Protocol) server that provides access to the Quasar Framework documentation directly from Claude Code.

## Features

- **Search documentation** - Full-text search across all Quasar docs
- **Get component docs** - Retrieve documentation for any Quasar component (q-btn, q-input, etc.)
- **Get any page** - Fetch any documentation page by path
- **List sections** - Browse available documentation sections

## Installation

```bash
cd tools/quasar-docs-mcp
npm install
npm run build
```

## Adding to Claude Code

After building, add the server to Claude Code:

```bash
# Add as a project-scoped server
claude mcp add --scope project quasar-docs -- node /absolute/path/to/tools/quasar-docs-mcp/dist/index.js

# Or for the current directory
claude mcp add quasar-docs -- node $(pwd)/tools/quasar-docs-mcp/dist/index.js
```

## Available Tools

### `get_quasar_component`

Get documentation for a specific Quasar UI component.

**Parameters:**

- `component` (string): Component name (e.g., 'btn', 'q-btn', 'input', 'dialog')

**Example:**

```
Get the documentation for q-btn
```

### `get_quasar_page`

Get any Quasar documentation page by its path.

**Parameters:**

- `path` (string): Path to the page (e.g., 'style/color-palette', 'quasar-plugins/notify')

**Example:**

```
Get the Quasar color palette documentation
```

### `search_quasar_docs`

Search the Quasar documentation for a topic.

**Parameters:**

- `query` (string): Search query
- `section` (string, optional): Limit search to a specific section
- `limit` (number, optional): Maximum results (default: 10)
- `includeContent` (boolean, optional): Search within file contents

**Example:**

```
Search for form validation in Quasar docs
```

### `list_quasar_sections`

List available documentation sections or pages within a section.

**Parameters:**

- `section` (string, optional): Show pages within this section

**Example:**

```
List all Quasar documentation sections
List pages in the vue-components section
```

## How It Works

The server fetches documentation directly from the [Quasar GitHub repository](https://github.com/quasarframework/quasar) (`docs/src/pages/`). It uses:

1. **GitHub Raw Files** - For fetching individual documentation pages
2. **GitHub API** - For listing directory contents and building the search index
3. **In-memory caching** - 30-minute cache for pages, 1-hour cache for the index

## Documentation Sections

The server provides access to all Quasar documentation sections:

- `vue-components` - UI components (buttons, inputs, dialogs, etc.)
- `vue-directives` - Custom Vue directives
- `vue-composables` - Composition API utilities
- `quasar-plugins` - Plugins (notify, dialog, loading, etc.)
- `quasar-utils` - Utility functions
- `layout` - Layout components
- `style` - CSS classes, colors, typography
- `options` - Configuration options
- `quasar-cli-vite` - Vite CLI documentation
- `quasar-cli-webpack` - Webpack CLI documentation
- And more...

## Development

```bash
# Watch mode for development
npm run dev

# Build
npm run build

# Run the server directly
npm start
```

## Troubleshooting

### "Component not found"

The component name might be different from expected. Use `search_quasar_docs` to find the correct name:

```
search for button component
```

### Rate limiting

The server uses GitHub's API which has rate limits (60 requests/hour for unauthenticated requests). The built-in caching helps mitigate this. If you hit limits, wait an hour or authenticate with a GitHub token.

### Server not responding

Make sure the server is built (`npm run build`) and the path in `claude mcp add` is correct.
