# Quasar Docs Examples

## Query: "What props does QBtn support?"

### Workflow

1. Fetch component JSON:

   ```bash
   curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/btn/QBtn.json"
   ```

2. Check mixins array → `["components/btn/use-btn"]`

3. Fetch mixin:

   ```bash
   curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/btn/use-btn.json"
   ```

4. Check nested mixins → `["composables/private.use-size/use-size"]`

5. Fetch nested mixin:

   ```bash
   curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/composables/private.use-size/use-size.json"
   ```

6. Merge all props and organize by category

### Expected Output

Props organized in tables by category (Navigation, Content, Style, Behavior) with types, defaults, and descriptions.

---

## Query: "What Quasar plugins are available?"

### Workflow

1. Use MCP tool:

   ```
   mcp__quasar-docs__list_quasar_sections({ section: "quasar-plugins" })
   ```

2. List plugins with brief descriptions

### Expected Output

List of plugins: Notify, Dialog, Loading, Bottom Sheet, Dark Mode, Cookies, etc.

---

## Query: "How do I show a loading spinner?"

### Workflow

1. Search docs:

   ```
   mcp__quasar-docs__search_quasar_docs({ query: "loading spinner" })
   ```

2. Fetch relevant pages for usage examples

3. Recommend options:
   - `QSpinner` component for inline spinners
   - `Loading` plugin for full-screen loading
   - `loading` prop on components like `QBtn`

### Expected Output

Code examples showing each approach with `<script setup>` syntax.

---

## Query: "How do I validate form inputs?"

### Workflow

1. Fetch QInput API from GitHub JSON (includes `rules` prop)

2. Fetch usage examples:

   ```
   mcp__quasar-docs__get_quasar_page({ path: "vue-components/input" })
   ```

3. Show validation patterns

### Expected Output

```vue
<template>
  <q-input
    v-model="email"
    label="Email"
    :rules="[
      (val) => !!val || 'Email is required',
      (val) => /.+@.+\..+/.test(val) || 'Invalid email',
    ]"
  />
</template>
```

---

## Query: "What spacing classes does Quasar provide?"

### Workflow

1. Fetch style docs:
   ```
   mcp__quasar-docs__get_quasar_page({ path: "style/spacing" })
   ```

### Expected Output

Spacing classes: `q-pa-*`, `q-ma-*`, `q-pt-*`, `q-pl-*`, etc. with size options (none, xs, sm, md, lg, xl).
