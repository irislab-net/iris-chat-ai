import type { NetworkErrorHint, NetworkErrorType } from "@/lib/networkErrors/types"
import { readErrorCode, readErrorMessage, readHttpStatus } from "@/lib/networkErrors/errorText"

function includesAny(msg: string, parts: readonly string[]): boolean {
  for (let i = 0; i < parts.length; i++) {
    if (msg.includes(parts[i]!)) return true
  }
  return false
}

/**
 * Classify ethers / JSON-RPC style errors. Hot-path friendly: code/status first, then message.
 */
export function classifyRpcError(
  error: unknown,
  hint?: NetworkErrorHint
): NetworkErrorType {
  const code = readErrorCode(error)
  const msg = readErrorMessage(error)
  const lower = msg.length > 512 ? msg.slice(0, 512).toLowerCase() : msg.toLowerCase()
  const status = readHttpStatus(error, hint?.httpStatus)

  if (code === "CALL_EXCEPTION" || code === "UNPREDICTABLE_GAS_LIMIT") {
    return "CALL_EXCEPTION"
  }
  if (code === "TIMEOUT" || lower.includes("timeout") || lower.includes("timed out")) {
    return "RPC_TIMEOUT"
  }
  if (code === "BAD_DATA" || lower.includes("invalid json") || lower.includes("json-rpc")) {
    return "INVALID_RPC_RESPONSE"
  }
  if (code === "SERVER_ERROR" || status === 503) {
    return status != null && status >= 500 ? "RPC_5XX" : "PROVIDER_UNAVAILABLE"
  }
  if (code === "NETWORK_ERROR") {
    if (includesAny(lower, ["enotfound", "getaddrinfo", "dns"])) return "DNS_FAILURE"
    if (includesAny(lower, ["cors", "blocked", "cross-origin"])) return "CORS_OR_NETWORK_BLOCKED"
    return "RPC_UNREACHABLE"
  }

  if (status != null) {
    if (status === 429) return "RATE_LIMIT"
    if (status >= 500) return hint?.endpointType === "rpc" ? "RPC_5XX" : "API_5XX"
    if (status >= 400) return hint?.endpointType === "rpc" ? "RPC_4XX" : "API_4XX"
  }

  if (includesAny(lower, ["wrong network", "chain mismatch", "unsupported chain"])) {
    return "CHAIN_MISMATCH"
  }
  if (includesAny(lower, ["no response", "missing response", "empty response"])) {
    return "MISSING_RESPONSE"
  }
  if (includesAny(lower, ["enotfound", "getaddrinfo", "dns"])) return "DNS_FAILURE"
  if (includesAny(lower, ["econnreset", "econnrefused", "failed to fetch", "network error"])) {
    return "RPC_UNREACHABLE"
  }
  if (includesAny(lower, ["rate limit", "too many requests", "429"])) return "RATE_LIMIT"
  if (lower.includes("read-timeout") || lower.includes("probe-timeout")) return "RPC_TIMEOUT"

  return "RPC_UNREACHABLE"
}
