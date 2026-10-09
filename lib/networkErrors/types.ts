/** Stable network failure categories for Sentry grouping and diagnostics. */
export type NetworkErrorType =
  | "RPC_UNREACHABLE"
  | "DNS_FAILURE"
  | "RPC_TIMEOUT"
  | "WS_DISCONNECTED"
  | "WS_RECONNECT_LOOP"
  | "CORS_OR_NETWORK_BLOCKED"
  | "INVALID_RPC_RESPONSE"
  | "RPC_4XX"
  | "RPC_5XX"
  | "API_4XX"
  | "API_5XX"
  | "RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "CHAIN_MISMATCH"
  | "WALLETCONNECT_INVALID_SESSION"
  | "WALLETCONNECT_STALE_SESSION"
  | "MISSING_RESPONSE"
  | "ABORTED_REQUEST"
  | "INDEXER_UNAVAILABLE"
  | "API_NETWORK_ERROR"
  | "CALL_EXCEPTION"

export type EndpointType =
  | "rpc"
  | "indexer"
  | "api"
  | "firebase"
  | "websocket"
  | "wallet_session"

export type TransportType = "http" | "ws"

export type NetworkErrorSeverity = "silent" | "diagnostic" | "alert"

export type NetworkErrorHint = Readonly<{
  endpointType: EndpointType
  transport?: TransportType
  url?: string
  chainId?: string | number
  deploymentId?: string
  requestMethod?: string
  walletProvider?: string
  httpStatus?: number
  severity?: NetworkErrorSeverity
  /** Override classified type (e.g. WS reconnect loop). */
  forceType?: NetworkErrorType
}>

export type NormalizedNetworkError = Readonly<{
  type: NetworkErrorType
  category: NetworkErrorType
  title: string
  endpointUrl: string | null
  hostname: string | null
  transport: TransportType
  endpointType: EndpointType
  chainId: string | null
  deploymentId: string | null
  environment: string
  walletProvider: string | null
  requestMethod: string | null
  errorCode: string | null
  originalMessage: string
  retryable: boolean
  reportToSentry: boolean
}>

export type EndpointHealthState = "healthy" | "degraded" | "unavailable"

export type EndpointHealth = Readonly<{
  lastSuccessAt: number | null
  consecutiveFailures: number
  connectionState: EndpointHealthState
  reconnectAttempts: number
  lastLatencyMs: number | null
}>
