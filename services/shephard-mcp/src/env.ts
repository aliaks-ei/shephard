import { z } from 'zod'

const envSchema = z.object({
  MCP_SUPABASE_URL: z.string().url(),
  MCP_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  MCP_RESOURCE_URL: z.string().url(),
  MCP_TOKEN_AUDIENCE: z.string().min(1).default('shephard-mcp'),
  MCP_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  MCP_ALLOWED_ORIGINS: z.string().optional(),
  MCP_ALLOWED_HOSTS: z.string().optional(),
})

export type McpEnvironment = z.infer<typeof envSchema> & {
  allowedOrigins: Set<string>
  allowedHosts: string[]
}

export function loadEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): McpEnvironment {
  // Railway and other managed container platforms provide PORT. An explicit
  // MCP_PORT remains available for local development and fixed-port hosts.
  const parsed = envSchema.parse({
    ...source,
    MCP_PORT: source.MCP_PORT ?? source.PORT,
  })
  const allowedOrigins = new Set(
    (parsed.MCP_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  const allowedHosts = (parsed.MCP_ALLOWED_HOSTS ?? new URL(parsed.MCP_RESOURCE_URL).host)
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return {
    ...parsed,
    allowedOrigins,
    allowedHosts,
  }
}
