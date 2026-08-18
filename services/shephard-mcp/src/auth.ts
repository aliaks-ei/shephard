import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { z } from 'zod'
import type { McpEnvironment } from './env.js'

const jwtClaimsSchema = z.object({
  iss: z.string().url(),
  aud: z.union([z.string(), z.array(z.string())]),
  sub: z.string().uuid(),
  exp: z.number().int(),
  client_id: z.string().uuid(),
})

export type AuthenticatedMcpRequest = {
  user: User
  clientId: string
  accessToken: string
  supabase: SupabaseClient
}

export class McpAuthenticationError extends Error {}

function decodeJwtClaims(accessToken: string): z.infer<typeof jwtClaimsSchema> {
  const segments = accessToken.split('.')
  if (segments.length !== 3) throw new McpAuthenticationError('Malformed bearer token')

  try {
    const payload = Buffer.from(segments[1]!, 'base64url').toString('utf8')
    return jwtClaimsSchema.parse(JSON.parse(payload))
  } catch {
    throw new McpAuthenticationError('Malformed bearer token')
  }
}

function audienceIncludes(audience: string | string[], expectedAudience: string): boolean {
  return Array.isArray(audience)
    ? audience.includes(expectedAudience)
    : audience === expectedAudience
}

export async function authenticateMcpRequest(
  authorizationHeader: string | undefined,
  env: McpEnvironment,
): Promise<AuthenticatedMcpRequest> {
  const match = /^Bearer ([A-Za-z0-9._~+/=-]+)$/.exec(authorizationHeader ?? '')
  if (!match?.[1]) throw new McpAuthenticationError('Missing bearer token')

  const accessToken = match[1]
  const claims = decodeJwtClaims(accessToken)
  const expectedIssuer = new URL('/auth/v1', env.MCP_SUPABASE_URL).toString().replace(/\/$/, '')

  if (claims.iss.replace(/\/$/, '') !== expectedIssuer) {
    throw new McpAuthenticationError('Bearer token issuer is not trusted')
  }
  if (!audienceIncludes(claims.aud, env.MCP_TOKEN_AUDIENCE)) {
    throw new McpAuthenticationError('Bearer token audience is not accepted')
  }
  if (claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new McpAuthenticationError('Bearer token has expired')
  }

  const supabase = createClient(env.MCP_SUPABASE_URL, env.MCP_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user || data.user.id !== claims.sub) {
    throw new McpAuthenticationError('Bearer token is invalid or revoked')
  }

  return { user: data.user, clientId: claims.client_id, accessToken, supabase }
}
