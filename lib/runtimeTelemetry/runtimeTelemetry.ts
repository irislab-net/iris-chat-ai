/**
 * Phase 43 — production-safe runtime telemetry (transport-agnostic, async, rate-limited).
 *
 * - Fire-and-forget: never `await` in callers; work is deferred via `queueMicrotask`.
 * - No console spam in production: sinks decide; default is no-op outside configured rollout.
 * - Privacy: only `RuntimeTelemetryBreadcrumb` fields; never log addresses, amounts, or RPC bodies.
 */
import {
  getRuntimeTelemetryRolloutStage,
  getRuntimeTelemetrySampleRate,
} from "@/config/env"
import type {
  RuntimeTelemetryBreadcrumb,
  RuntimeTelemetryEvent,
  RuntimeTelemetryEventName,
  RuntimeTelemetrySeverity,
  RuntimeTelemetrySink,
} from "@/lib/runtimeTelemetry/runtimeTelemetryTypes"

const sinks: RuntimeTelemetrySink[] = []

/** Global cap: max events dispatched per rolling minute window. */
const GLOBAL_BURST_WINDOW_MS = 60_000
const GLOBAL_BURST_MAX = 24

/** Per-event-name minimum gap (dedupe / cooldown). */
const DEFAULT_EVENT_COOLDOWN_MS: Partial<Record<RuntimeTelemetryEventName, number>> = {
  repeated_async_commit_denied: 45_000,
  runtime_selection_desync: 120_000,
  rpc_degradation_detected: 90_000,
  rpc_degradation_recovered: 90_000,
  excessive_gas_estimate_depth: 60_000,
  orchestrator_starvation: 120_000,
  staking_balance_refresh_wall_stall: 180_000,
  staking_history_refresh_starvation: 120_000,
  tron_passive_read_repeated_failure: 120_000,
  modal_non_terminal_timeout: 300_000,
  modal_phase_stall: 120_000,
  hydrate_reconcile_failure: 120_000,
  runtime_transition_stuck: 120_000,
  tx_retry_loop_excessive: 180_000,
  registry_growth_abnormal: 600_000,
  provider_reconnect_loop: 120_000,
}

const lastEmitByEvent = new Map<RuntimeTelemetryEventName, number>()
const globalBurst: number[] = []

function pruneBurst(now: number): void {
  while (globalBurst.length > 0 && now - globalBurst[0]! > GLOBAL_BURST_WINDOW_MS) {
    globalBurst.shift()
  }
}

function shouldSample(severity: RuntimeTelemetrySeverity): boolean {
  const stage = getRuntimeTelemetryRolloutStage()
  if (stage < 3) return true
  const rate = getRuntimeTelemetrySampleRate()
  if (rate >= 1) return true
  if (severity === "error" || severity === "critical") {
    return Math.random() < Math.min(1, rate * 4)
  }
  if (severity === "warning") {
    return Math.random() < rate
  }
  return Math.random() < rate * 0.5
}

export function isRuntimeTelemetryEmitEnabled(): boolean {
  return getRuntimeTelemetryRolloutStage() >= 1
}

export function registerRuntimeTelemetrySink(sink: RuntimeTelemetrySink | null): () => void {
  if (sink == null) {
    return () => {}
  }
  sinks.push(sink)
  return () => {
    const i = sinks.indexOf(sink)
    if (i !== -1) sinks.splice(i, 1)
  }
}

/** Optional Sentry-style bridge: uses `globalThis` capture if present (no bundled dependency). */
export function registerRuntimeTelemetrySentryLikeSink(): () => void {
  const sink: RuntimeTelemetrySink = event => {
    const cap = (globalThis as unknown as { Sentry?: { captureMessage?: (m: string, ctx?: unknown) => void } })
      .Sentry?.captureMessage
    if (typeof cap !== "function") return
    cap(`[runtimeTelemetry] ${event.name}`, {
      level: event.severity === "critical" || event.severity === "error" ? "error" : "warning",
      extra: {
        breadcrumbs: event.breadcrumbs,
        count: event.count,
        ts: event.ts,
      },
    })
  }
  return registerRuntimeTelemetrySink(sink)
}

/** OpenTelemetry-style hook: invoke delegate if `globalThis.__RUNTIME_OTEL_EMIT__` is a function. */
export function registerRuntimeTelemetryOpenTelemetryLikeSink(): () => void {
  const sink: RuntimeTelemetrySink = event => {
    const fn = (globalThis as unknown as { __RUNTIME_OTEL_EMIT__?: (e: RuntimeTelemetryEvent) => void })
      .__RUNTIME_OTEL_EMIT__
    if (typeof fn === "function") {
      try {
        fn(event)
      } catch {
        /* never throw from telemetry */
      }
    }
  }
  return registerRuntimeTelemetrySink(sink)
}

const devMemory: RuntimeTelemetryEvent[] = []
const DEV_MEMORY_CAP = 80

function pushDevMemory(event: RuntimeTelemetryEvent): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  devMemory.push(event)
  if (devMemory.length > DEV_MEMORY_CAP) devMemory.splice(0, devMemory.length - DEV_MEMORY_CAP)
}

/** DEV: last events for quick inspection (`window.__RUNTIME_TELEMETRY_DEV__`). */
export function installRuntimeTelemetryDevMemorySink(): () => void {
  if (!(process.env.NODE_ENV !== 'production')) return () => {}
  const sink: RuntimeTelemetrySink = event => pushDevMemory(event)
  const uninstall = registerRuntimeTelemetrySink(sink)
  const w = globalThis as unknown as { __RUNTIME_TELEMETRY_DEV__?: RuntimeTelemetryEvent[] }
  w.__RUNTIME_TELEMETRY_DEV__ = devMemory
  return () => {
    uninstall()
    delete w.__RUNTIME_TELEMETRY_DEV__
  }
}

function passesRollout(): boolean {
  const stage = getRuntimeTelemetryRolloutStage()
  if (stage <= 0) return false
  if (stage === 1 && !(process.env.NODE_ENV !== 'production')) return false
  return true
}

function passesRateLimits(event: RuntimeTelemetryEvent): boolean {
  const now = event.ts
  pruneBurst(now)
  if (globalBurst.length >= GLOBAL_BURST_MAX) {
    return false
  }
  const cd = DEFAULT_EVENT_COOLDOWN_MS[event.name] ?? 30_000
  const last = lastEmitByEvent.get(event.name) ?? 0
  if (now - last < cd) {
    return false
  }
  lastEmitByEvent.set(event.name, now)
  globalBurst.push(now)
  return true
}

/**
 * Emit a single aggregate telemetry event. Never throws; never blocks; never awaits.
 */
export function emitRuntimeTelemetry(event: RuntimeTelemetryEvent): void {
  if (!passesRollout()) return
  if (!shouldSample(event.severity)) return
  if (!passesRateLimits(event)) return

  queueMicrotask(() => {
    pushDevMemory(event)
    for (const s of sinks) {
      try {
        s(event)
      } catch {
        /* sink failure must not affect runtime */
      }
    }
  })
}

/** Helper: build event with `performance.now()` timestamp. */
export function buildRuntimeTelemetryEvent(
  name: RuntimeTelemetryEventName,
  severity: RuntimeTelemetrySeverity,
  breadcrumbs?: RuntimeTelemetryBreadcrumb,
  count?: number
): RuntimeTelemetryEvent {
  return {
    name,
    severity,
    ts: typeof performance !== "undefined" ? performance.now() : Date.now(),
    ...(breadcrumbs ? { breadcrumbs } : {}),
    ...(count != null ? { count } : {}),
  }
}

let telemetryGasEstimateDepth = 0

/** Phase 43 — concurrent gas estimate depth (production-safe); pair with `trackRuntimeTelemetryGasEstimateDepthLeave`. */
export function trackRuntimeTelemetryGasEstimateDepthEnter(
  breadcrumbs?: RuntimeTelemetryBreadcrumb
): void {
  if (!isRuntimeTelemetryEmitEnabled()) return
  telemetryGasEstimateDepth += 1
  if (telemetryGasEstimateDepth > 4) {
    emitRuntimeTelemetry(
      buildRuntimeTelemetryEvent(
        "excessive_gas_estimate_depth",
        "warning",
        breadcrumbs,
        telemetryGasEstimateDepth
      )
    )
  }
}

export function trackRuntimeTelemetryGasEstimateDepthLeave(): void {
  telemetryGasEstimateDepth = Math.max(0, telemetryGasEstimateDepth - 1)
}
