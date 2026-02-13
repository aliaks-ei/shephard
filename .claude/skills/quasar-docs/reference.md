# Quasar Docs Reference

## MCP Tools

| Tool                                     | Purpose                                |
| ---------------------------------------- | -------------------------------------- |
| `mcp__quasar-docs__get_quasar_component` | Get component docs (may be incomplete) |
| `mcp__quasar-docs__get_quasar_page`      | Get any docs page by path              |
| `mcp__quasar-docs__search_quasar_docs`   | Search docs by keyword                 |
| `mcp__quasar-docs__list_quasar_sections` | List sections or pages                 |

## GitHub API JSON

For complete component APIs, fetch JSON directly from GitHub.

### URL Pattern

```
https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/{folder}/{ComponentName}.json
```

### Fetching Props

```bash
# 1. Fetch main component
curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/btn/QBtn.json"

# 2. Check "mixins" array in response, fetch each:
curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/components/btn/use-btn.json"

# 3. Follow nested mixins (composables path differs):
curl -s "https://raw.githubusercontent.com/quasarframework/quasar/dev/ui/src/composables/private.use-size/use-size.json"
```

## Component Mappings

| Component       | Folder          | JSON File            | Primary Mixin     |
| --------------- | --------------- | -------------------- | ----------------- |
| QBtn            | btn             | QBtn.json            | use-btn.json      |
| QInput          | input           | QInput.json          | use-field.json    |
| QSelect         | select          | QSelect.json         | use-field.json    |
| QDialog         | dialog          | QDialog.json         | —                 |
| QCard           | card            | QCard.json           | —                 |
| QList           | item            | QList.json           | —                 |
| QItem           | item            | QItem.json           | —                 |
| QForm           | form            | QForm.json           | —                 |
| QTable          | table           | QTable.json          | —                 |
| QTabs           | tabs            | QTabs.json           | —                 |
| QTab            | tabs            | QTab.json            | —                 |
| QCheckbox       | checkbox        | QCheckbox.json       | use-checkbox.json |
| QRadio          | radio           | QRadio.json          | —                 |
| QToggle         | toggle          | QToggle.json         | use-checkbox.json |
| QSlider         | slider          | QSlider.json         | use-slider.json   |
| QRange          | range           | QRange.json          | use-slider.json   |
| QDate           | date            | QDate.json           | —                 |
| QTime           | time            | QTime.json           | —                 |
| QMenu           | menu            | QMenu.json           | —                 |
| QPopupProxy     | popup-proxy     | QPopupProxy.json     | —                 |
| QTooltip        | tooltip         | QTooltip.json        | —                 |
| QDrawer         | drawer          | QDrawer.json         | —                 |
| QLayout         | layout          | QLayout.json         | —                 |
| QPage           | page            | QPage.json           | —                 |
| QHeader         | header          | QHeader.json         | —                 |
| QFooter         | footer          | QFooter.json         | —                 |
| QToolbar        | toolbar         | QToolbar.json        | —                 |
| QAvatar         | avatar          | QAvatar.json         | —                 |
| QBadge          | badge           | QBadge.json          | —                 |
| QChip           | chip            | QChip.json           | —                 |
| QIcon           | icon            | QIcon.json           | —                 |
| QSpinner        | spinner         | QSpinner.json        | —                 |
| QSkeleton       | skeleton        | QSkeleton.json       | —                 |
| QSeparator      | separator       | QSeparator.json      | —                 |
| QExpansionItem  | expansion-item  | QExpansionItem.json  | —                 |
| QInfiniteScroll | infinite-scroll | QInfiniteScroll.json | —                 |
| QPullToRefresh  | pull-to-refresh | QPullToRefresh.json  | —                 |

## Common Mixins

| Mixin Path                              | Props Provided                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `composables/private.use-size/use-size` | `size`                                                                                                                                                                                                                                                                                                                                                                                     |
| `components/btn/use-btn`                | `type`, `to`, `replace`, `href`, `target`, `label`, `icon`, `icon-right`, `outline`, `flat`, `unelevated`, `rounded`, `push`, `square`, `glossy`, `fab`, `fab-mini`, `padding`, `color`, `text-color`, `no-caps`, `no-wrap`, `dense`, `ripple`, `tabindex`, `align`, `stack`, `stretch`, `loading`, `disable`                                                                              |
| `components/field/use-field`            | `label`, `stack-label`, `hint`, `hide-hint`, `prefix`, `suffix`, `label-color`, `color`, `bg-color`, `dark`, `loading`, `clearable`, `clear-icon`, `filled`, `outlined`, `borderless`, `standout`, `hide-bottom-space`, `rounded`, `square`, `dense`, `item-aligned`, `counter`, `rules`, `reactive-rules`, `lazy-rules`, `error`, `error-message`, `no-error-icon`, `disable`, `readonly` |

## Documentation Paths

Common paths for `get_quasar_page`:

| Category   | Path Pattern            | Example                    |
| ---------- | ----------------------- | -------------------------- |
| Components | `vue-components/{name}` | `vue-components/button`    |
| Plugins    | `quasar-plugins/{name}` | `quasar-plugins/notify`    |
| Directives | `vue-directives/{name}` | `vue-directives/ripple`    |
| Style      | `style/{topic}`         | `style/color-palette`      |
| Layout     | `layout/{topic}`        | `layout/grid/introduction` |
