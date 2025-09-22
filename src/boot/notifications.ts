import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

export default boot(() => {
  Notify.setDefaults({
    position: 'bottom-right',
    textColor: 'white',
  })
})
