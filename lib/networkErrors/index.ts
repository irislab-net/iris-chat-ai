export type {
  EndpointHealth,
  EndpointHealthState,
  EndpointType,
  NetworkErrorHint,
  NetworkErrorSeverity,
  NetworkErrorType,
  NormalizedNetworkError,
  TransportType,
} from "@/lib/networkErrors/types"

export { attachNetworkErrorMetadata, readNetworkErrorMetadata } from "@/lib/networkErrors/attachMetadata"
export { classifyEndpointError } from "@/lib/networkErrors/classifyEndpointError"
export { classifyRpcError } from "@/lib/networkErrors/classifyRpcError"
export { DEBUG_NETWORK, isNetworkDebugLoggingEnabled } from "@/lib/networkErrors/debugNetwork"
export {
  diagnosticsKey,
  diagnosticsKeyFromHint,
  getEndpointHealth,
  getLastNormalizedFailure,
  getLastRpcFailureForRuntimeKey,
  incrementEndpointReconnectAttempts,
  recordEndpointFailure,
  recordEndpointSuccess,
  resetEndpointDiagnosticsForTests,
  setLastRpcFailureForRuntimeKey,
} from "@/lib/networkErrors/endpointDiagnostics"
export {
  normalizeNetworkError,
  shouldAlertIndexerFailure,
} from "@/lib/networkErrors/normalizeNetworkError"
export { isRetryableNormalizedError } from "@/lib/networkErrors/retryPolicy"
export { hostnameFromUrl, sanitizeUrl } from "@/lib/networkErrors/sanitizeUrl"
export { sanitizeMessageForTelemetry, truncateForSentry } from "@/lib/networkErrors/truncatePayload"
export { titleForNetworkErrorType } from "@/lib/networkErrors/titles"
export {
  getLastWsReconnectLoopNormalized,
  isWsReconnectLoopInWindow,
  recordWsReconnectAttempt,
  resetWsReconnectWindowForTests,
  setLastWsReconnectLoopNormalized,
} from "@/lib/networkErrors/wsReconnectWindow"

export type { NormalizedNetworkError as StakingNormalizedNetworkError } from "@/lib/networkErrors/types"

export {
  indexerLogFieldsFromError,
  reportIndexerNetworkFailure,
  safeReasonFromError,
} from "@/lib/networkErrors/reportHistoryFailure"
