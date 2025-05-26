import { boot } from 'quasar/wrappers'
import { useUserStore } from 'src/stores/user'

export default boot(async () => {
  const userStore = useUserStore()

  await userStore.initUser()
})
