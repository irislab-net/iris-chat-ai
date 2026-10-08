import type { NormalizedNetworkError, NetworkErrorType } from "@/lib/networkErrors/types"

const RETRYABLE: Readonly<Set<NetworkErrorType>> = new Set([
  "RPC_UNREACHABLE",
  "DNS_FAILURE",
  "RPC_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "RPC_5XX",
  "RATE_LIMIT",
  "WS_DISCONNECTED",
  "API_NETWORK_ERROR",
  "INDEXER_UNAVAILABLE",
  "MISSING_RESPONSE",
])

export function isRetryableNormalizedError(normalized: NormalizedNetworkError): boolean {
  if (!normalized.retryable) return false
  return RETRYABLE.has(normalized.type)
}
