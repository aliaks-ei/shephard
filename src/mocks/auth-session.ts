import { mockAuthUser } from './data/seed'

export function seedAuthSession(): void {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // Extract project ref from URL: https://<project-ref>.supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)
  const projectRef = match?.[1] ?? 'mock-project'
  const storageKey = `sb-${projectRef}-auth-token`

  const session = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'mock-refresh-token',
    user: mockAuthUser,
  }

  localStorage.setItem(storageKey, JSON.stringify(session))
}
