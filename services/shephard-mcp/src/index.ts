import { loadEnvironment } from './env.js'
import { createMcpApp } from './app.js'

const env = loadEnvironment()
const app = createMcpApp(env)
app.listen(env.MCP_PORT, '0.0.0.0', () => {
  console.info(`Shephard MCP listening on port ${env.MCP_PORT}`)
})
