import { useRoute } from 'vue-router'

export function useRouteActive() {
  const route = useRoute()

  const isActive = (path: string) => {
    if (path === '/') {
      return route.fullPath === '/'
    }

    return route.fullPath.startsWith(path)
  }

  return { isActive }
}
