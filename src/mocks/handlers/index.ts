import { authHandlers } from './auth'
import { postgrestHandlers } from './postgrest'
import { rpcHandlers } from './rpc'
import { edgeFunctionHandlers } from './edge-functions'

export const handlers = [
  ...authHandlers,
  ...rpcHandlers,
  ...edgeFunctionHandlers,
  ...postgrestHandlers,
]
