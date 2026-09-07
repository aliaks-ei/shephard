import { boot } from 'quasar/wrappers'
import { AddressbarColor, Dark } from 'quasar'
import { watch } from 'vue'

const LIGHT_COLOR = '#f5f7fa'
const DARK_COLOR = '#121212'

export default boot(() => {
  AddressbarColor.set(Dark.isActive ? DARK_COLOR : LIGHT_COLOR)

  watch(
    () => Dark.isActive,
    (isDark) => {
      AddressbarColor.set(isDark ? DARK_COLOR : LIGHT_COLOR)
    },
  )
})
