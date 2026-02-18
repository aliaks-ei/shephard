import { seedAuthSession } from './auth-session'

export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_MSW_ENABLED !== 'true') {
    return
  }

  seedAuthSession()

  const { worker } = await import('./browser')
  await worker.start({ onUnhandledRequest: 'bypass' })

  console.log('[MSW] Mock Service Worker enabled')
}
