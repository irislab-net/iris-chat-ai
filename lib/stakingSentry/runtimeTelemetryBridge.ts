import { captureStakingStructuredEvent } from "@/lib/stakingSentry/capture"
import { captureStakingNetworkError } from "@/lib/stakingSentry/captureNetworkError"
import {
  RUNTIME_TELEMETRY_TO_SENTRY,
  STAKING_SENTRY_EVENT,
  type StakingSentryEventName,
} from "@/lib/stakingSentry/taxonomy"
import type { RuntimeTelemetryEvent } from "@/lib/runtimeTelemetry/runtimeTelemetryTypes"
import { registerRuntimeTelemetrySink } from "@/lib/runtimeTelemetry/runtimeTelemetry"
import type { RuntimeTelemetrySink } from "@/lib/runtimeTelemetry/runtimeTelemetryTypes"
import { isSentryEnabled } from "@/lib/sentry"
import {
  getLastRpcFailureForRuntimeKey,
  getLastWsReconnectLoopNormalized,
} from "@/lib/networkErrors"

function severityToLevel(
  severity: RuntimeTelemetryEvent["severity"]
): "info" | "warning" | "error" | "fatal" {
  if (severity === "critical") return "fatal"
  if (severity === "error") return "error"
  if (severity === "warning") return "warning"
  return "info"
}

function mapRuntimeTelemetryToSentry(
  event: RuntimeTelemetryEvent
): StakingSentryEventName | null {
  return RUNTIME_TELEMETRY_TO_SENTRY[event.name] ?? null
}

function tryCaptureNetworkFromTelemetry(event: RuntimeTelemetryEvent): boolean {
  const bc = event.breadcrumbs
  const runtimeKey = bc?.runtimeKey

  if (event.name === "rpc_degradation_detected" && runtimeKey) {
    const last = getLastRpcFailureForRuntimeKey(runtimeKey)
    if (last?.reportToSentry) {
      captureStakingNetworkError(last, {
        event: STAKING_SENTRY_EVENT.network.rpc_degradation,
        level: "error",
        cooldownMs: 90_000,
      })
      return true
    }
  }

  if (event.name === "provider_reconnect_loop") {
    const wsNorm = getLastWsReconnectLoopNormalized()
    if (wsNorm?.reportToSentry) {
      captureStakingNetworkError(wsNorm, {
        event: STAKING_SENTRY_EVENT.provider.reconnect_loop,
        level: "warning",
        cooldownMs: 120_000,
      })
      return true
    }
  }

  return false
}

const stakingRuntimeTelemetrySink: RuntimeTelemetrySink = event => {
  if (!isSentryEnabled()) return
  const sentryEvent = mapRuntimeTelemetryToSentry(event)
  if (!sentryEvent) return

  if (tryCaptureNetworkFromTelemetry(event)) return

  const bc = event.breadcrumbs
  const dedupeKey = `${sentryEvent}:${bc?.runtimeKey ?? "na"}:${bc?.reasonToken ?? event.name}`

  captureStakingStructuredEvent({
    event: sentryEvent,
    level: severityToLevel(event.severity),
    message: sentryEvent,
    dedupeKey,
    tags: {
      runtime_key: bc?.runtimeKey ?? null,
      deployment_id: bc?.deploymentId ?? null,
      chain_family: bc?.chainFamily ?? null,
      ui_phase: bc?.uiPhase ?? null,
      blocking_gate: bc?.reasonToken ?? null,
    },
    contexts: {
      staking_runtime: {
        lifecycle: bc?.lifecycle ?? null,
        sequence_stage: bc?.sequenceStage ?? null,
        transition_generation: bc?.transitionGeneration ?? null,
        chain_id: bc?.chainId ?? null,
        telemetry_count: event.count ?? null,
        source_event: event.name,
      },
    },
    fingerprint: [sentryEvent, event.name, bc?.reasonToken ?? "default"],
    oncePerSession: false,
  })
}

/** Bridges Phase-43 runtimeTelemetry aggregates into canonical Sentry events. */
export function registerStakingRuntimeTelemetrySentryBridge(): () => void {
  return registerRuntimeTelemetrySink(stakingRuntimeTelemetrySink)
}
