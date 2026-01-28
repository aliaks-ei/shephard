---
name: quasar-docs
description: Query Quasar Framework documentation to answer questions, suggest component usage, find plugins, and provide implementation guidance based on official docs.
---

This skill provides direct access to Quasar Framework documentation via the `quasar-docs` MCP server. Use it to answer questions about Quasar components, plugins, directives, utilities, and best practices.

## When to Use

Invoke this skill when the user asks about:

- **Component documentation**: Props, events, slots, and examples for any q-\* component
- **Plugin availability**: What plugins exist (Notify, Dialog, Loading, etc.) and how to use them
- **Refactoring suggestions**: How to better leverage Quasar components based on official API
- **Feature discovery**: What Quasar offers for a specific use case
- **Implementation patterns**: How to correctly use Quasar features

## Available MCP Tools

Use these tools from the `quasar-docs` MCP server:

| Tool                   | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `get_quasar_component` | Get full documentation for a specific component (e.g., q-btn, q-input) |
| `get_quasar_page`      | Get any documentation page by path (e.g., quasar-plugins/notify)       |
| `search_quasar_docs`   | Search documentation by keyword or topic                               |
| `list_quasar_sections` | List available sections or pages within a section                      |

## Workflow

1. **Understand the request**: Determine what Quasar feature the user needs information about
2. **Fetch relevant documentation**: Use the appropriate MCP tool to get official docs
3. **Synthesize and respond**: Provide a clear, actionable answer based on the documentation
4. **Include references**: Mention the official docs URL for further reading

## Example Queries and Responses

### "What Quasar plugins are available?"

1. Use `list_quasar_sections` with section `quasar-plugins`
2. List all available plugins with brief descriptions
3. Recommend relevant ones for this expense tracking app (Notify, Dialog, Loading)

### "How should I refactor this button to use q-btn properly?"

1. Use `get_quasar_component` with component `btn`
2. Review the user's current implementation
3. Suggest improvements based on available props, slots, and patterns from docs
4. Provide code examples

### "How do I show loading state while fetching data?"

1. Use `search_quasar_docs` with query `loading`
2. Fetch relevant pages (Loading plugin, QSpinner, loading states)
3. Recommend the best approach for this Vue 3 + Quasar PWA project

### "What input validation options does Quasar provide?"

1. Use `get_quasar_component` with component `input`
2. Focus on the `rules` prop and validation patterns
3. Provide examples relevant to expense/financial data entry

## Response Guidelines

- **Be specific**: Reference exact prop names, event names, and slot names from docs
- **Show code**: Include practical Vue 3 Composition API examples
- **Stay current**: The MCP fetches from the latest Quasar dev branch
- **Link to source**: Always include the quasar.dev URL for the referenced documentation
- **Project context**: Tailor suggestions to this Vue 3 + TypeScript + Quasar PWA codebase

## Integration with Project

When suggesting Quasar features, consider this project's conventions:

- Uses Quasar with Vite
- Follows Composition API with `<script setup>`
- Prefers Quasar utility classes over custom CSS
- Uses `$q` directly in templates (no need for `useQuasar()` in templates)
- Errors are handled in stores, not components
