import type { NetworkErrorHint, NetworkErrorType } from "@/lib/networkErrors/types"
import { readErrorCode, readErrorMessage, readHttpStatus } from "@/lib/networkErrors/errorText"

function includesAny(msg: string, parts: readonly string[]): boolean {
  for (let i = 0; i < parts.length; i++) {
    if (msg.includes(parts[i]!)) return true
  }
  return false
}

/**
 * Classify fetch / HTTP API / indexer / wallet-session errors.
 */
export function classifyEndpointError(
  error: unknown,
  hint?: NetworkErrorHint
): NetworkErrorType {
  const code = readErrorCode(error)
  const msg = readErrorMessage(error)
  const lower = msg.length > 512 ? msg.slice(0, 512).toLowerCase() : msg.toLowerCase()
  const status = readHttpStatus(error, hint?.httpStatus)
  const ep = hint?.endpointType

  if (code === "AbortError" || lower.includes("aborted")) return "ABORTED_REQUEST"

  if (ep === "wallet_session") {
    if (includesAny(lower, ["session expired", "stale session", "session stale"])) {
      return "WALLETCONNECT_STALE_SESSION"
    }
    if (
      includesAny(lower, [
        "invalid session",
        "session not found",
        "no matching key",
        "proposal expired",
      ])
    ) {
      return "WALLETCONNECT_INVALID_SESSION"
    }
  }

  if (status != null) {
    if (status === 429) return "RATE_LIMIT"
    if (status >= 500) {
      if (ep === "indexer") return "INDEXER_UNAVAILABLE"
      if (ep === "rpc") return "RPC_5XX"
      return "API_5XX"
    }
    if (status >= 400) {
      if (ep === "indexer") return "INDEXER_UNAVAILABLE"
      if (ep === "rpc") return "RPC_4XX"
      return "API_4XX"
    }
  }

  if (includesAny(lower, ["vite_staking_tx_history", "not configured"])) {
    return "INDEXER_UNAVAILABLE"
  }
  if (ep === "indexer") {
    if (includesAny(lower, ["failed to fetch", "networkerror", "load failed", "econn"])) {
      return "INDEXER_UNAVAILABLE"
    }
  }

  if (includesAny(lower, ["failed to fetch", "networkerror", "load failed"])) {
    return ep === "api" || ep === "firebase" ? "API_NETWORK_ERROR" : "INDEXER_UNAVAILABLE"
  }
  if (includesAny(lower, ["cors", "cross-origin", "blocked"])) return "CORS_OR_NETWORK_BLOCKED"
  if (includesAny(lower, ["enotfound", "getaddrinfo", "dns"])) return "DNS_FAILURE"
  if (includesAny(lower, ["timeout", "timed out"])) return "RPC_TIMEOUT"
  if (lower.includes("[staking] tron http")) {
    if (status != null && status >= 500) return "RPC_5XX"
    if (status != null && status >= 400) return "RPC_4XX"
    return "RPC_UNREACHABLE"
  }

  if (ep === "websocket") return "WS_DISCONNECTED"
  if (ep === "api" || ep === "firebase") return "API_NETWORK_ERROR"
  if (ep === "indexer") return "INDEXER_UNAVAILABLE"
  return "API_NETWORK_ERROR"
}
