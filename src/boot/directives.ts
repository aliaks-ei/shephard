import { boot } from 'quasar/wrappers'
import { tabPill } from 'src/directives/tab-pill'

export default boot(({ app }) => {
  app.directive('tab-pill', tabPill)
})
