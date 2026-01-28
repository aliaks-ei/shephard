---
name: quasar-docs
description: Query Quasar Framework documentation to answer questions, suggest component usage, find plugins, and provide implementation guidance based on official docs.
---

# Quasar Documentation

Query Quasar Framework docs for component APIs, plugins, and implementation patterns.

## When to Use

- Component documentation (props, events, slots)
- Plugin availability and usage
- Refactoring suggestions using Quasar features
- Feature discovery for specific use cases

## Workflow

### Step 1: Identify Query Type

- [ ] **Component API query** (props, events, slots) → Use GitHub JSON (see `reference.md`)
- [ ] **Usage examples** → Use MCP tools (`get_quasar_page`, `search_quasar_docs`)
- [ ] **Plugin/feature discovery** → Use `list_quasar_sections` or `search_quasar_docs`

### Step 2: Fetch Documentation

For **component API** (props, events, slots):

- [ ] Fetch component JSON from GitHub (see `reference.md` for URL pattern)
- [ ] Check `mixins` array and fetch each mixin
- [ ] Merge all props from component + mixins

For **usage examples**:

- [ ] Use `get_quasar_page` with path like `vue-components/button`
- [ ] Use `search_quasar_docs` if page path is unknown

### Step 3: Respond

- [ ] Organize props by category (content, style, behavior)
- [ ] Include prop types and defaults
- [ ] Provide Vue 3 Composition API code examples
- [ ] Link to official docs: `https://quasar.dev/{path}`

## Success Criteria

- [ ] Complete API returned (all props including from mixins)
- [ ] Props organized by category with types
- [ ] Code examples use `<script setup>` syntax
- [ ] Official docs URL included

## Project Conventions

When suggesting Quasar features, follow these project patterns:

- Quasar with Vite
- Composition API with `<script setup>`
- Quasar utility classes over custom CSS
- `$q` used directly in templates
- Errors handled in stores, not components

## Supporting Files

| File            | Use When                                                  |
| --------------- | --------------------------------------------------------- |
| `reference.md`  | Need component mappings, GitHub URL patterns, mixin paths |
| `examples.md`   | Need example queries and expected workflows               |
| `edge-cases.md` | MCP tools fail or return incomplete data                  |
