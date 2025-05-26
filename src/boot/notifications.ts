import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

export default boot(() => {
  Notify.setDefaults({
    position: 'bottom',
    timeout: 3000,
    textColor: 'black',
    actions: [{ icon: 'close', color: 'white' }],
  })

  // TODO: position is not working

  // Notify.registerType('app-error', {
  //   icon: 'error',
  //   progress: true,
  //   color: 'negative',
  //   textColor: 'white',
  //   classes: 'app-notification app-notification--error',
  // })

  // Notify.registerType('app-info', {
  //   icon: 'info',
  //   progress: true,
  //   color: 'info',
  //   textColor: 'white',
  //   classes: 'app-notification app-notification--info',
  // })

  // Notify.registerType('app-success', {
  //   icon: 'check_circle',
  //   progress: true,
  //   color: 'positive',
  //   textColor: 'white',
  //   classes: 'app-notification app-notification--success',
  // })

  // Notify.registerType('app-warning', {
  //   icon: 'warning',
  //   progress: true,
  //   color: 'warning',
  //   textColor: 'white',
  //   classes: 'app-notification app-notification--warning',
  // })
})
