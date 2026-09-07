import { boot } from 'quasar/wrappers'
import { resolveIcon } from 'src/utils/icons'

// Render Lucide glyphs for every icon name in the app (and in stored category data)
// without touching the `eva-*` identifiers those rows already carry.
export default boot(({ app }) => {
  app.config.globalProperties.$q.iconMapFn = (iconName: string) => resolveIcon(iconName)
})
