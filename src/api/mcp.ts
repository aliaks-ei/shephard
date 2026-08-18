import { supabase } from 'src/lib/supabase/client'

export type OAuthAuthorizationDetails = {
  authorization_id: string
  redirect_uri: string
  client: { id: string; name: string; uri: string; logo_uri: string }
  scope: string
}

export type OAuthGrant = {
  client: { id: string; name: string; uri: string; logo_uri: string }
  scopes: string[]
  granted_at: string
}

export type McpAuthorization = {
  client_id: string
  access_level: 'read' | 'write'
  created_at: string
  updated_at: string
}

export async function authorizeMcpClient(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('authorize_mcp_client', { p_client_id: clientId })
  if (error) throw error
}

export async function getMcpAuthorizations(): Promise<McpAuthorization[]> {
  const { data, error } = await supabase.rpc('list_mcp_authorizations')
  if (error) throw error
  return (data ?? []) as McpAuthorization[]
}

export async function setMcpAuthorizationAccess(
  clientId: string,
  accessLevel: McpAuthorization['access_level'],
): Promise<void> {
  const { error } = await supabase.rpc('set_mcp_authorization_access', {
    p_client_id: clientId,
    p_access_level: accessLevel,
  })
  if (error) throw error
}

export async function revokeMcpAuthorization(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_mcp_authorization', { p_client_id: clientId })
  if (error) throw error
}

async function oauthRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Authentication required')

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) throw new Error('OAuth server request failed')
  return (await response.json()) as T
}

export async function getOAuthAuthorizationDetails(
  authorizationId: string,
): Promise<OAuthAuthorizationDetails | { redirect_url: string }> {
  return oauthRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}`)
}

export async function decideOAuthAuthorization(
  authorizationId: string,
  action: 'approve' | 'deny',
): Promise<{ redirect_url: string }> {
  return oauthRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}/consent`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export async function listOAuthGrants(): Promise<OAuthGrant[]> {
  return oauthRequest('/oauth/grants')
}

export async function revokeOAuthGrant(clientId: string): Promise<void> {
  await oauthRequest(`/oauth/grants/${encodeURIComponent(clientId)}`, { method: 'DELETE' })
}
