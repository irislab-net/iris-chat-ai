import type {
  EndpointHealth,
  EndpointHealthState,
  EndpointType,
  NormalizedNetworkError,
  TransportType,
} from "@/lib/networkErrors/types"
import { hostnameFromUrl } from "@/lib/networkErrors/sanitizeUrl"

const MAX_ENTRIES = 32

type Entry = {
  health: EndpointHealth
  lastNormalized: NormalizedNetworkError | null
  lastAccessAt: number
}

const store = new Map<string, Entry>()
const runtimeLastRpcFailure = new Map<string, NormalizedNetworkError>()

export function diagnosticsKey(input: Readonly<{
  endpointType: EndpointType
  transport: TransportType
  hostname: string | null
}>): string {
  return `${input.endpointType}:${input.transport}:${input.hostname ?? "unknown"}`
}

export function diagnosticsKeyFromHint(
  hint: Readonly<{ endpointType: EndpointType; transport?: TransportType; url?: string }>
): string {
  return diagnosticsKey({
    endpointType: hint.endpointType,
    transport: hint.transport ?? (hint.endpointType === "websocket" ? "ws" : "http"),
    hostname: hostnameFromUrl(hint.url),
  })
}

function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return
  let oldestKey: string | null = null
  let oldestAt = Infinity
  for (const [k, v] of store) {
    if (v.lastAccessAt < oldestAt) {
      oldestAt = v.lastAccessAt
      oldestKey = k
    }
  }
  if (oldestKey != null) store.delete(oldestKey)
}

function touch(key: string): Entry {
  evictIfNeeded()
  let e = store.get(key)
  const now = Date.now()
  if (!e) {
    e = {
      health: {
        lastSuccessAt: null,
        consecutiveFailures: 0,
        connectionState: "healthy",
        reconnectAttempts: 0,
        lastLatencyMs: null,
      },
      lastNormalized: null,
      lastAccessAt: now,
    }
    store.set(key, e)
  }
  e.lastAccessAt = now
  return e
}

function stateFromFailures(n: number): EndpointHealthState {
  if (n >= 3) return "unavailable"
  if (n >= 1) return "degraded"
  return "healthy"
}

export function recordEndpointSuccess(
  key: string,
  input?: Readonly<{ latencyMs?: number }>
): void {
  const e = touch(key)
  e.health = {
    lastSuccessAt: Date.now(),
    consecutiveFailures: 0,
    connectionState: "healthy",
    reconnectAttempts: e.health.reconnectAttempts,
    lastLatencyMs: input?.latencyMs ?? e.health.lastLatencyMs,
  }
}

export function recordEndpointFailure(key: string, normalized: NormalizedNetworkError): void {
  const e = touch(key)
  const failures = e.health.consecutiveFailures + 1
  e.health = {
    ...e.health,
    consecutiveFailures: failures,
    connectionState: stateFromFailures(failures),
  }
  e.lastNormalized = normalized
  if (normalized.endpointType === "rpc") {
    runtimeLastRpcFailure.set(key, normalized)
  }
}

export function incrementEndpointReconnectAttempts(key: string): void {
  const e = touch(key)
  e.health = {
    ...e.health,
    reconnectAttempts: e.health.reconnectAttempts + 1,
  }
}

export function getEndpointHealth(key: string): EndpointHealth | null {
  return store.get(key)?.health ?? null
}

export function getLastNormalizedFailure(key: string): NormalizedNetworkError | null {
  return store.get(key)?.lastNormalized ?? null
}

export function setLastRpcFailureForRuntimeKey(
  runtimeKey: string,
  normalized: NormalizedNetworkError
): void {
  runtimeLastRpcFailure.set(runtimeKey, normalized)
}

export function getLastRpcFailureForRuntimeKey(
  runtimeKey: string
): NormalizedNetworkError | null {
  return runtimeLastRpcFailure.get(runtimeKey) ?? null
}

export function resetEndpointDiagnosticsForTests(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  store.clear()
  runtimeLastRpcFailure.clear()
}
