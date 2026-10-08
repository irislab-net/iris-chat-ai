import { classifyEndpointError } from "@/lib/networkErrors/classifyEndpointError"
import { classifyRpcError } from "@/lib/networkErrors/classifyRpcError"
import { isNetworkDebugLoggingEnabled } from "@/lib/networkErrors/debugNetwork"
import { readErrorCode, readErrorMessage } from "@/lib/networkErrors/errorText"
import { hostnameFromUrl, sanitizeUrl } from "@/lib/networkErrors/sanitizeUrl"
import { titleForNetworkErrorType } from "@/lib/networkErrors/titles"
import { sanitizeMessageForTelemetry } from "@/lib/networkErrors/truncatePayload"
import type {
  NetworkErrorHint,
  NetworkErrorType,
  NormalizedNetworkError,
  TransportType,
} from "@/lib/networkErrors/types"
import { logger } from "@/lib/logger"

const NON_REPORTABLE: Readonly<Set<NetworkErrorType>> = new Set([
  "ABORTED_REQUEST",
  "CALL_EXCEPTION",
  "CHAIN_MISMATCH",
])

const RETRYABLE_TYPES: Readonly<Set<NetworkErrorType>> = new Set([
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

function resolveTransport(hint: NetworkErrorHint): TransportType {
  if (hint.transport) return hint.transport
  return hint.endpointType === "websocket" ? "ws" : "http"
}

function classify(error: unknown, hint: NetworkErrorHint): NetworkErrorType {
  if (hint.endpointType === "rpc" || hint.endpointType === "websocket") {
    const rpcType = classifyRpcError(error, hint)
    if (hint.endpointType === "websocket" && rpcType === "RPC_UNREACHABLE") {
      return "WS_DISCONNECTED"
    }
    return rpcType
  }
  return classifyEndpointError(error, hint)
}

function shouldReportToSentry(
  type: NetworkErrorType,
  severity: NetworkErrorHint["severity"]
): boolean {
  if (NON_REPORTABLE.has(type)) return false
  if (severity === "silent") return false
  if (severity === "alert") return true
  if (severity === "diagnostic") return false
  return type !== "ABORTED_REQUEST" && type !== "CALL_EXCEPTION"
}

/**
 * Central network error normalizer — returns a plain object; never throws or mutates `error`.
 */
export function normalizeNetworkError(
  error: unknown,
  hint: NetworkErrorHint
): NormalizedNetworkError {
  const type = hint.forceType ?? classify(error, hint)
  const severity = hint.severity ?? "diagnostic"
  const transport = resolveTransport(hint)
  const endpointUrl = sanitizeUrl(hint.url)
  const hostname = hostnameFromUrl(hint.url ?? endpointUrl)
  const chainId =
    hint.chainId != null && String(hint.chainId).length > 0 ? String(hint.chainId) : null
  const originalMessage = sanitizeMessageForTelemetry(readErrorMessage(error))
  const retryable = RETRYABLE_TYPES.has(type)
  const reportToSentry = shouldReportToSentry(type, severity)

  const normalized: NormalizedNetworkError = {
    type,
    category: type,
    title: titleForNetworkErrorType(type),
    endpointUrl,
    hostname,
    transport,
    endpointType: hint.endpointType,
    chainId,
    deploymentId: hint.deploymentId ?? null,
    environment: process.env.NODE_ENV,
    walletProvider: hint.walletProvider ?? null,
    requestMethod: hint.requestMethod ?? null,
    errorCode: readErrorCode(error),
    originalMessage,
    retryable,
    reportToSentry,
  }

  if (isNetworkDebugLoggingEnabled()) {
    logger.log("[network]", {
      type: normalized.type,
      host: normalized.hostname,
      transport: normalized.transport,
      retryable: normalized.retryable,
    })
  }

  return normalized
}

/** Whether indexer/API failures should emit a Sentry alert (non-abort, alert severity). */
export function shouldAlertIndexerFailure(normalized: NormalizedNetworkError): boolean {
  return (
    normalized.reportToSentry &&
    normalized.type !== "ABORTED_REQUEST" &&
    (normalized.endpointType === "indexer" || normalized.endpointType === "api")
  )
}
