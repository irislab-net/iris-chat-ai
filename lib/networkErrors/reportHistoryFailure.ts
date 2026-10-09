import { captureStakingNetworkError } from "@/lib/stakingSentry/captureNetworkError"
import { attachNetworkErrorMetadata } from "@/lib/networkErrors/attachMetadata"
import {
  normalizeNetworkError,
  shouldAlertIndexerFailure,
} from "@/lib/networkErrors/normalizeNetworkError"
import { sanitizeMessageForTelemetry } from "@/lib/networkErrors/truncatePayload"

export function reportIndexerNetworkFailure(input: Readonly<{
  error: unknown
  url?: string | null
  chainId: string | number
  deploymentId?: string
  httpStatus?: number
  endpointType?: "indexer" | "api"
}>): void {
  const normalized = normalizeNetworkError(input.error, {
    endpointType: input.endpointType ?? "indexer",
    transport: "http",
    url: input.url ?? undefined,
    chainId: input.chainId,
    deploymentId: input.deploymentId,
    httpStatus: input.httpStatus,
    severity: "alert",
  })
  attachNetworkErrorMetadata(input.error, normalized)
  if (shouldAlertIndexerFailure(normalized)) {
    captureStakingNetworkError(normalized, { cooldownMs: 60_000 })
  }
}

export function indexerLogFieldsFromError(error: unknown): Readonly<{
  network_error_type: string | null
  rpc_host: string | null
}> {
  const n = normalizeNetworkError(error, {
    endpointType: "indexer",
    transport: "http",
    severity: "silent",
  })
  return {
    network_error_type: n.category,
    rpc_host: n.hostname,
  }
}

export function safeReasonFromError(error: unknown, fallback: string): string {
  if (error instanceof Error) return sanitizeMessageForTelemetry(error.message)
  return fallback
}
