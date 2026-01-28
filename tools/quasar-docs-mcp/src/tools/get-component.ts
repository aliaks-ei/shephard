import { z } from 'zod'
import { fetchRawFile, buildQuasarDocsUrl } from '../services/github.js'

export const getComponentSchema = z.object({
  component: z
    .string()
    .describe("Component name (e.g., 'btn', 'q-btn', 'input', 'q-input', 'dialog')"),
})

export type GetComponentInput = z.infer<typeof getComponentSchema>

// Common component name mappings (aliases)
const COMPONENT_ALIASES: Record<string, string> = {
  button: 'btn',
  textfield: 'input',
  text: 'input',
  dropdown: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  toggle: 'toggle',
  slider: 'slider',
  range: 'range',
  datepicker: 'date',
  timepicker: 'time',
  colorpicker: 'color-picker',
  modal: 'dialog',
  popup: 'dialog',
  notification: 'notify',
  toast: 'notify',
  snackbar: 'notify',
  loading: 'loading-bar',
  spinner: 'spinner',
  progress: 'linear-progress',
  progressbar: 'linear-progress',
  tabs: 'tabs',
  tab: 'tabs',
  table: 'table',
  datatable: 'table',
  list: 'list',
  item: 'item',
  card: 'card',
  chip: 'chip',
  badge: 'badge',
  avatar: 'avatar',
  icon: 'icon',
  img: 'img',
  image: 'img',
  video: 'video',
  carousel: 'carousel',
  pagination: 'pagination',
  stepper: 'stepper',
  timeline: 'timeline',
  tree: 'tree',
  expansion: 'expansion-item',
  accordion: 'expansion-item',
  menu: 'menu',
  toolbar: 'toolbar',
  header: 'header',
  footer: 'footer',
  drawer: 'drawer',
  sidebar: 'drawer',
  fab: 'fab',
  tooltip: 'tooltip',
  scroll: 'scroll-area',
  scrollarea: 'scroll-area',
  splitter: 'splitter',
  separator: 'separator',
  space: 'space',
  resize: 'resize-observer',
  intersection: 'intersection',
  uploader: 'uploader',
  upload: 'uploader',
  file: 'file',
  editor: 'editor',
  knob: 'knob',
  rating: 'rating',
  field: 'field',
  form: 'form',
  optiongroup: 'option-group',
  btngroup: 'btn-group',
  btntoggle: 'btn-toggle',
  btndropdown: 'btn-dropdown',
  bar: 'bar',
  breadcrumbs: 'breadcrumbs',
  banner: 'banner',
  markup: 'markup-table',
  nossr: 'no-ssr',
  parallax: 'parallax',
  pulltorefresh: 'pull-to-refresh',
  skeleton: 'skeleton',
  slide: 'slide-item',
  virtualscroll: 'virtual-scroll',
  infinitescroll: 'infinite-scroll',
}

function normalizeComponentName(input: string): string {
  // Remove q- prefix if present
  let name = input.toLowerCase().replace(/^q-/, '')

  // Check for aliases
  if (COMPONENT_ALIASES[name]) {
    name = COMPONENT_ALIASES[name]
  }

  return name
}

export async function getComponent(
  input: GetComponentInput,
): Promise<{ content: string; url: string } | { error: string }> {
  const normalizedName = normalizeComponentName(input.component)

  // Try the direct path first
  const directPath = `vue-components/${normalizedName}.md`
  let content = await fetchRawFile(directPath)

  if (content) {
    return {
      content,
      url: buildQuasarDocsUrl(directPath),
    }
  }

  // Try with hyphens converted to different formats
  const variations = [
    normalizedName,
    normalizedName.replace(/-/g, ''),
    normalizedName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
  ]

  for (const variation of variations) {
    const path = `vue-components/${variation}.md`
    content = await fetchRawFile(path)
    if (content) {
      return {
        content,
        url: buildQuasarDocsUrl(path),
      }
    }
  }

  return {
    error: `Component '${input.component}' not found. Try searching with 'search_quasar_docs' to find the correct name.`,
  }
}
