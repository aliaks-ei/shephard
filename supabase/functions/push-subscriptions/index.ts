import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import {
  createErrorResponse,
  createSuccessResponse,
  corsHeaders,
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401)
    }

    const authClient = createAuthedClient(authHeader)
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401, authError?.message)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    if (!isRecord(rawBody) || typeof rawBody.action !== 'string') {
      return createErrorResponse('Invalid push subscription payload', 400)
    }

    const action = rawBody.action as PushSubscriptionAction
    const serviceClient = createServiceClient()

    switch (action) {
      case 'get-config':
        return createSuccessResponse({
          publicKey: vapidPublicKey ?? null,
          configured: !!vapidPublicKey && !!vapidPrivateKey,
        })

      case 'upsert': {
        const subscription = rawBody.subscription
        const userAgent = typeof rawBody.userAgent === 'string' ? rawBody.userAgent : null

        if (!isRecord(subscription) || typeof subscription.endpoint !== 'string') {
          return createErrorResponse('Invalid push subscription data', 400)
        }

        const keys = isRecord(subscription.keys) ? subscription.keys : null
        const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh : null
        const auth = typeof keys?.auth === 'string' ? keys.auth : null

        if (!p256dh || !auth) {
          return createErrorResponse('Incomplete push subscription keys', 400)
        }

        const { data: existing, error: existingError } = await serviceClient
          .from('push_subscriptions')
          .select('id')
          .eq('endpoint', subscription.endpoint)
          .maybeSingle()

        if (existingError) {
          throw existingError
        }

        if (existing) {
          const { error } = await serviceClient
            .from('push_subscriptions')
            .update({
              user_id: user.id,
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

        return createSuccessResponse(null)
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

        return createSuccessResponse(null)
      }

      default:
        return createErrorResponse('Unsupported push subscription action', 400)
    }
  } catch (error) {
    console.error('Error in push-subscriptions:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
})
