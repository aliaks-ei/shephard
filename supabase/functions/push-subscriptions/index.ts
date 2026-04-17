import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import {
  buildCorsHeaders,
  createErrorResponse,
  createSuccessResponse,
  isRecord,
} from '../_shared/notification-utils.ts'

type PushSubscriptionAction = 'get-config' | 'upsert' | 'revoke'

type PushSubscriptionPayload = {
  endpoint: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')

// Upper bounds prevent abuse / billing attacks on the downstream Supabase and
// push provider APIs.
const MAX_ENDPOINT_LENGTH = 2048
const MAX_KEY_LENGTH = 256
const MAX_USER_AGENT_LENGTH = 512

// Only well-known browser push services are allowed as the `endpoint` host.
// Without this allowlist the service-role edge function would POST
// VAPID-signed bodies to any HTTPS URL a user chooses — a useful SSRF primitive.
const ALLOWED_PUSH_HOSTS: readonly string[] = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'updates-autopush.stage.mozaws.net',
]
const ALLOWED_PUSH_HOST_SUFFIXES: readonly string[] = [
  '.google.com',
  '.push.apple.com',
  '.notify.windows.com',
  '.push.services.mozilla.com',
]

function isAllowedPushEndpoint(endpoint: string): boolean {
  if (endpoint.length > MAX_ENDPOINT_LENGTH) {
    return false
  }
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') {
    return false
  }
  const host = url.hostname.toLowerCase()
  if (ALLOWED_PUSH_HOSTS.includes(host)) {
    return true
  }
  return ALLOWED_PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

function createAuthedClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })
}

function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))
  const errorResponse = (error: string, status = 400) =>
    createErrorResponse(error, status, corsHeaders)
  const successResponse = (data: unknown, status = 200) =>
    createSuccessResponse(data, status, corsHeaders)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    const authClient = createAuthedClient(authHeader)
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      if (authError) {
        console.error('Auth error in push-subscriptions:', authError)
      }
      return errorResponse('Unauthorized', 401)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return errorResponse('Invalid JSON in request body', 400)
    }

    if (!isRecord(rawBody) || typeof rawBody.action !== 'string') {
      return errorResponse('Invalid push subscription payload', 400)
    }

    const action = rawBody.action as PushSubscriptionAction
    const serviceClient = createServiceClient()

    switch (action) {
      case 'get-config':
        return successResponse({
          publicKey: vapidPublicKey ?? null,
          configured: !!vapidPublicKey && !!vapidPrivateKey,
        })

      case 'upsert': {
        const subscription = rawBody.subscription
        const rawUserAgent = typeof rawBody.userAgent === 'string' ? rawBody.userAgent : null
        const userAgent = rawUserAgent ? rawUserAgent.slice(0, MAX_USER_AGENT_LENGTH) : null

        if (!isRecord(subscription) || typeof subscription.endpoint !== 'string') {
          return errorResponse('Invalid push subscription data', 400)
        }

        if (!isAllowedPushEndpoint(subscription.endpoint)) {
          return errorResponse('Invalid push subscription endpoint', 400)
        }

        const keys = isRecord(subscription.keys) ? subscription.keys : null
        const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh : null
        const auth = typeof keys?.auth === 'string' ? keys.auth : null

        if (!p256dh || !auth) {
          return errorResponse('Incomplete push subscription keys', 400)
        }
        if (p256dh.length > MAX_KEY_LENGTH || auth.length > MAX_KEY_LENGTH) {
          return errorResponse('Push subscription keys exceed maximum length', 400)
        }

        const { data: existing, error: existingError } = await serviceClient
          .from('push_subscriptions')
          .select('id, user_id')
          .eq('endpoint', subscription.endpoint)
          .maybeSingle()

        if (existingError) {
          throw existingError
        }

        if (existing) {
          // Defense-in-depth: the DB has a unique index on endpoint and a
          // BEFORE UPDATE trigger that refuses changes to user_id, but that
          // defense is invisible to anyone reading this function. Make the
          // cross-user rejection explicit at the application layer.
          if (existing.user_id !== user.id) {
            console.warn('Rejected cross-user push subscription upsert', {
              existingSubscriptionId: existing.id,
              requestingUserId: user.id,
            })
            return errorResponse('Push subscription endpoint is not available', 409)
          }

          const { error } = await serviceClient
            .from('push_subscriptions')
            .update({
              p256dh,
              auth,
              user_agent: userAgent,
              revoked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (error) {
            throw error
          }
        } else {
          const { error } = await serviceClient.from('push_subscriptions').insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh,
            auth,
            user_agent: userAgent,
          })

          if (error) {
            throw error
          }
        }

        return successResponse(null)
      }

      case 'revoke': {
        const endpoint = typeof rawBody.endpoint === 'string' ? rawBody.endpoint : null
        let query = serviceClient
          .from('push_subscriptions')
          .update({
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .is('revoked_at', null)

        if (endpoint) {
          query = query.eq('endpoint', endpoint)
        }

        const { error } = await query
        if (error) {
          throw error
        }

        return successResponse(null)
      }

      default:
        return errorResponse('Unsupported push subscription action', 400)
    }
  } catch (error) {
    console.error('Error in push-subscriptions:', error)
    return errorResponse('Internal server error', 500)
  }
})
