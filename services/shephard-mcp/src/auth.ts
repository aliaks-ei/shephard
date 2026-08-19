import { createHash } from 'node:crypto'
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

// Verifying a token costs one network call to Supabase. Cache the verified
// result briefly so a burst of tool calls does not repeat it. The window is
// short so that a revoked grant stops working quickly.
const verificationTtlMs = 60_000
const verificationCache = new Map<string, { expiresAt: number; request: AuthenticatedMcpRequest }>()

function cacheKey(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('hex')
}

function readCache(key: string, now: number): AuthenticatedMcpRequest | undefined {
  const entry = verificationCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= now) {
    verificationCache.delete(key)
    return undefined
  }
  return entry.request
}

function writeCache(key: string, now: number, request: AuthenticatedMcpRequest, exp: number): void {
  for (const [cached, entry] of verificationCache) {
    if (entry.expiresAt <= now) verificationCache.delete(cached)
  }
  const expiresAt = Math.min(now + verificationTtlMs, exp * 1000)
  if (expiresAt > now) verificationCache.set(key, { expiresAt, request })
}

export function clearVerificationCache(): void {
  verificationCache.clear()
}

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
  const now = Date.now()
  const key = cacheKey(accessToken)
  const cached = readCache(key, now)
  if (cached) return cached

  const claims = decodeJwtClaims(accessToken)
  const expectedIssuer = new URL('/auth/v1', env.MCP_SUPABASE_URL).toString().replace(/\/$/, '')

  if (claims.iss.replace(/\/$/, '') !== expectedIssuer) {
    throw new McpAuthenticationError('Bearer token issuer is not trusted')
  }
  if (!audienceIncludes(claims.aud, env.MCP_TOKEN_AUDIENCE)) {
    throw new McpAuthenticationError('Bearer token audience is not accepted')
  }
  if (claims.exp <= Math.floor(now / 1000)) {
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

  const request: AuthenticatedMcpRequest = {
    user: data.user,
    clientId: claims.client_id,
    accessToken,
    supabase,
  }
  writeCache(key, now, request, claims.exp)
  return request
}
