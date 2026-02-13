# Quasar Docs Edge Cases

## MCP Tool Returns "Component Not Found"

The `get_quasar_component` tool may fail for valid components.

**Symptoms:**

- Error: "Component 'btn' not found"
- Error: "Component 'q-btn' not found"

**Solution:**

1. Use `search_quasar_docs` to find the correct page path
2. Fetch complete API from GitHub JSON (see `reference.md`)

---

## MCP Returns Usage Examples But No Props

The `get_quasar_page` tool returns markdown with examples but references `<DocApi file="..."/>` for props.

**Symptoms:**

- Page content mentions API but doesn't list props
- No types or defaults shown

**Solution:**
Fetch the JSON API directly from GitHub:

```bash
curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/{folder}/{Component}.json"
```

---

## Unknown Component Folder

If you don't know which folder a component lives in, use this pattern:

```bash
# Search the Quasar repo structure
curl -s "https://api.github.com/repos/quasarframework/quasar/contents/ui/src/components" | jq '.[].name'
```

Or check the component mappings table in `reference.md`.

---

## Mixin Path Resolution

Mixins in JSON files use relative paths that need translation:

| Mixin Path in JSON                      | Actual URL Path                                     |
| --------------------------------------- | --------------------------------------------------- |
| `components/btn/use-btn`                | `ui/src/components/btn/use-btn.json`                |
| `composables/private.use-size/use-size` | `ui/src/composables/private.use-size/use-size.json` |

Base URL: `https://raw.githubusercontent.com/quasarframework/quasar/dev/`

---

## Props with "extends" Reference

Some props in JSON files use `"extends": "icon"` instead of inline definitions.

**Symptoms:**

- Prop definition only shows `{ "extends": "icon" }`

**Solution:**
Common extends values and their meanings:

- `"extends": "icon"` → Icon name following Quasar convention (String)
- `"extends": "color"` → Color from Quasar Color Palette (String)
- `"extends": "text-color"` → Text color override (String)
- `"extends": "disable"` → Put component in disabled mode (Boolean)
- `"extends": "dense"` → Dense mode (Boolean)
- `"extends": "ripple"` → Material ripple effect (Boolean | Object)
- `"extends": "tabindex"` → Tabindex HTML attribute (Number | String)
- `"extends": "square"` → Removes border-radius (Boolean)

---

## Plugin vs Component Confusion

Some features exist as both plugins and components:

| Feature       | Plugin              | Component                     |
| ------------- | ------------------- | ----------------------------- |
| Loading       | `$q.loading.show()` | `QSpinner`, `QLinearProgress` |
| Dialogs       | `$q.dialog()`       | `QDialog`                     |
| Notifications | `$q.notify()`       | —                             |

Plugins are for imperative usage; components are for declarative/template usage.
