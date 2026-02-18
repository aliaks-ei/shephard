import { defineBoot } from '#q-app/wrappers'
import { enableMocking } from 'src/mocks/enable'

export default defineBoot(async () => {
  await enableMocking()
})
