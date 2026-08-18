import { createHash } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { authenticateMcpRequest, McpAuthenticationError } from './auth.js'
import type { McpEnvironment } from './env.js'
import { createShephardMcpServer } from './tools.js'

type RateLimitEntry = { count: number; resetAt: number }

function protectedResourceMetadata(env: McpEnvironment) {
  return {
    resource: env.MCP_RESOURCE_URL,
    authorization_servers: [
      new URL('/auth/v1', env.MCP_SUPABASE_URL).toString().replace(/\/$/, ''),
    ],
    bearer_methods_supported: ['header'],
  }
}

function requestKey(request: Request): string {
  const authorization = request.header('authorization')
  if (authorization) return createHash('sha256').update(authorization).digest('hex')
  return request.ip ?? 'unknown'
}

function createRateLimiter() {
  const requests = new Map<string, RateLimitEntry>()
  const windowMs = 60_000
  const maximumRequests = 120

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now()
    const key = requestKey(request)
    const entry = requests.get(key)
    const current = !entry || entry.resetAt <= now ? { count: 0, resetAt: now + windowMs } : entry
    current.count += 1
    requests.set(key, current)

    if (current.count > maximumRequests) {
      response.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000))
      response
        .status(429)
        .json({ jsonrpc: '2.0', error: { code: -32029, message: 'Rate limit exceeded' }, id: null })
      return
    }
    next()
  }
}

function rejectUnexpectedOrigin(env: McpEnvironment) {
  return (request: Request, response: Response, next: NextFunction) => {
    const origin = request.header('origin')
    if (origin && !env.allowedOrigins.has(origin)) {
      response.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32003, message: 'Origin is not allowed' },
        id: null,
      })
      return
    }
    next()
  }
}

function bearerChallenge(env: McpEnvironment): string {
  const metadataUrl = new URL('/.well-known/oauth-protected-resource/mcp', env.MCP_RESOURCE_URL)
  return `Bearer resource_metadata="${metadataUrl.toString()}"`
}

export function createMcpApp(env: McpEnvironment) {
  const app = createMcpExpressApp({ allowedHosts: env.allowedHosts })
  app.disable('x-powered-by')
  app.use(express.json({ limit: '128kb', strict: true, type: 'application/json' }))
  app.use(createRateLimiter())
  app.use(rejectUnexpectedOrigin(env))

  const metadata = protectedResourceMetadata(env)
  app.get('/.well-known/oauth-protected-resource', (_request, response) => response.json(metadata))
  app.get('/.well-known/oauth-protected-resource/mcp', (_request, response) =>
    response.json(metadata),
  )
  app.get('/health', (_request, response) => response.status(200).json({ status: 'ok' }))

  app.all('/mcp', async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).setHeader('Allow', 'POST').end()
      return
    }

    try {
      const context = await authenticateMcpRequest(request.header('authorization'), env)
      const server = createShephardMcpServer(context)
      const transport = new StreamableHTTPServerTransport()
      await server.connect(transport as never)
      await transport.handleRequest(request, response, request.body)
      await server.close()
    } catch (error) {
      if (error instanceof McpAuthenticationError) {
        response.setHeader('WWW-Authenticate', bearerChallenge(env))
        response.status(401).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Authentication required' },
          id: null,
        })
        return
      }
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  })

  return app
}
