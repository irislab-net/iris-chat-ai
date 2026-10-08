import { captureStakingStructuredEvent } from "@/lib/stakingSentry/capture"
import { STAKING_SENTRY_EVENT, type StakingSentryEventName } from "@/lib/stakingSentry/taxonomy"
import type { StakingStructuredContexts } from "@/lib/stakingSentry/types"
import type { EndpointType, NormalizedNetworkError } from "@/lib/networkErrors/types"
import { getEndpointHealth } from "@/lib/networkErrors/endpointDiagnostics"
import { diagnosticsKey } from "@/lib/networkErrors/endpointDiagnostics"
import { truncateForSentry } from "@/lib/networkErrors/truncatePayload"

function eventForEndpointType(ep: EndpointType): StakingSentryEventName {
  switch (ep) {
    case "rpc":
      return STAKING_SENTRY_EVENT.network.rpc_failure
    case "indexer":
      return STAKING_SENTRY_EVENT.network.indexer_failure
    case "api":
    case "firebase":
      return STAKING_SENTRY_EVENT.network.api_failure
    case "websocket":
      return STAKING_SENTRY_EVENT.network.websocket_failure
    case "wallet_session":
      return STAKING_SENTRY_EVENT.network.wallet_session_failure
    default:
      return STAKING_SENTRY_EVENT.network.rpc_failure
  }
}

function networkDedupeKey(normalized: NormalizedNetworkError): string {
  return `network:${normalized.category}:${normalized.endpointType}:${normalized.hostname ?? "unknown"}`
}

function buildNetworkContext(normalized: NormalizedNetworkError): StakingStructuredContexts {
  const key = diagnosticsKey({
    endpointType: normalized.endpointType,
    transport: normalized.transport,
    hostname: normalized.hostname,
  })
  const health = getEndpointHealth(key)
  return {
    staking_network: {
      network_error_type: normalized.category,
      endpoint_type: normalized.endpointType,
      rpc_transport: normalized.transport,
      endpoint_url: normalized.endpointUrl,
      rpc_host: normalized.hostname,
      chain_id: normalized.chainId,
      request_method: normalized.requestMethod,
      error_code: normalized.errorCode,
      original_message: truncateForSentry(normalized.originalMessage),
      wallet_provider: normalized.walletProvider,
      consecutive_failures: health?.consecutiveFailures ?? null,
      last_success_at: health?.lastSuccessAt ?? null,
      reconnect_attempts: health?.reconnectAttempts ?? null,
      connection_state: health?.connectionState ?? null,
      last_latency_ms: health?.lastLatencyMs ?? null,
    },
  }
}

/** Production path for classified network failures — structured message only (no exception replacement). */
export function captureStakingNetworkError(
  normalized: NormalizedNetworkError,
  options?: Readonly<{
    level?: "warning" | "error" | "fatal"
    cooldownMs?: number
    dedupeKey?: string
    event?: StakingSentryEventName
  }>
): void {
  if (!normalized.reportToSentry) return

  const event = options?.event ?? eventForEndpointType(normalized.endpointType)
  const dedupeKey = options?.dedupeKey ?? networkDedupeKey(normalized)
  const host = normalized.hostname ?? "unknown"

  captureStakingStructuredEvent({
    event,
    level: options?.level ?? "error",
    message: `${event}: ${normalized.title}`,
    dedupeKey,
    cooldownMs: options?.cooldownMs,
    oncePerSession: false,
    fingerprint: [normalized.category, normalized.endpointType, host],
    tags: {
      rpc_host: normalized.hostname,
      rpc_transport: normalized.transport,
      rpc_chain_id: normalized.chainId,
      endpoint_type: normalized.endpointType,
      network_error_type: normalized.category,
      deployment_id: normalized.deploymentId,
    },
    contexts: buildNetworkContext(normalized),
  })
}
