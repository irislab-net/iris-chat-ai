/**
 * Staking-chain JsonRpc + optional WebSocket for sync-only block refs.
 * Block listener: updates refs + performance.now() only — no RPC from handler.
 *
 * ## Phase 14 — runtime-keyed internals, legacy single-runtime externally
 *
 * - **HTTP:** `getStakingJsonRpcProvider()` delegates to **`getReadProviderForDeployment`**
 *   (`runtimeFamilyDispatch.ts`) with **`getDefaultStakingRuntimeDeployment()`** (Phase 24) — same registry
 *   instance as **`getOrCreateEvmJsonRpcProviderForDeployment`** keyed by
 *   **`getProviderRuntimeKeyForDeployment`** (today exactly one live `JsonRpcProvider` in prod).
 * - **WS:** the live `WebSocketProvider` is stored in **`wsProviderRegistry`** under the same runtime
 *   key; ref-count, reconnect, and stale detection are unchanged — still **one** WS instance in prod.
 * - **Receipts:** `getOrCreateEvmReceiptResolver` shares the same HTTP entry per key (see
 *   `createEvmReceiptResolver.ts`).
 * - **Contract caches** in `stakingReadFactory` use **`runtimeKey`** + address (Phase 20,
 *   `runtimeCacheKey.ts`); gas/native TTL maps include **`runtimeKey`** in `gasEstimator.ts`.
 *
 * ## Phase 19–22 — explicit runtime ownership + capabilities
 *
 * Runtime-sensitive reads must **not** treat this module as an env-global singleton “forever”:
 * ownership flows **deployment → `getReadProviderForDeployment`**. **`getRuntimeCapabilitiesForDeployment`**
 * (`runtimeCapabilities.ts` / `runtimeFamilyDispatch.ts`) documents feature parity: legacy EVM keeps full
 * parity; Tron remains passive HTTP + receipts only for infra that opts in — not ethers/gas here.
 */
import type { JsonRpcProvider } from "ethers"
import { WebSocketProvider } from "ethers"
import {
  STAKING_CHAIN_ID,
  STAKING_RPC_WS_URL,
} from "@/constants/stakingVaultConfig"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import {
  getProviderRuntimeKeyForDeployment,
  registryGetWsProvider,
  registrySetWsProvider,
} from "@/staking/core/providerRegistry"
import { getDefaultStakingRuntimeDeployment } from "@/staking/core/runtimeSelectionDefaults"
import { getReadProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { tryParseEvmChainIdFromCaip2 } from "@/staking/core/providerRuntime"
import type { DeploymentProviderRuntimeKey } from "@/staking/core/types"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import { stakingMetricsWsTransition } from "@/staking/refresh/stakingRefreshMetrics"
import {
  diagnosticsKey,
  hostnameFromUrl,
  incrementEndpointReconnectAttempts,
  normalizeNetworkError,
  recordEndpointFailure,
  recordWsReconnectAttempt,
  setLastWsReconnectLoopNormalized,
} from "@/lib/networkErrors"
import { isWsReconnectLoopInWindow } from "@/lib/networkErrors/wsReconnectWindow"

/** Phase 19–21: legacy staking deployment’s read JSON-RPC — explicit EVM-only (Tron uses separate runtime). */
export function getStakingLegacyReadJsonRpcProvider(): JsonRpcProvider {
  const deployment = getDefaultStakingRuntimeDeployment()
  if (!isStakingVaultRuntimeHydrationEnabled(deployment)) {
    throw new Error(
      "[staking] EVM JSON-RPC unavailable — Ethereum runtime disabled or no deployment (CFG6)."
    )
  }
  const rt = getReadProviderForDeployment(deployment)
  if (rt.chainFamily !== "evm") {
    throw new Error("[staking] legacy staking read is EVM-only (Phase 21).")
  }
  return rt.jsonRpc
}

export function getStakingJsonRpcProvider(): JsonRpcProvider {
  return getStakingLegacyReadJsonRpcProvider()
}

let legacyRuntimeKeyCached: DeploymentProviderRuntimeKey | null = null

function stakingLegacyRuntimeKey(): DeploymentProviderRuntimeKey {
  if (legacyRuntimeKeyCached === null) {
    legacyRuntimeKeyCached = getProviderRuntimeKeyForDeployment(getDefaultStakingRuntimeDeployment())
  }
  return legacyRuntimeKeyCached
}

function currentWs(): WebSocketProvider | undefined {
  return registryGetWsProvider(stakingLegacyRuntimeKey())
}

function setCurrentWs(ws: WebSocketProvider | undefined): void {
  registrySetWsProvider(stakingLegacyRuntimeKey(), ws)
}

export const stakingLatestBlockNumberRef = { current: 0 }
export const stakingLastObservedBlockAtRef = { current: 0 }

export type StakingRpcCapabilities = {
  httpReadOk: boolean
  wsSubscribeOk: boolean
  multicall3Ok: boolean
}

let capabilities: StakingRpcCapabilities = {
  httpReadOk: false,
  wsSubscribeOk: false,
  multicall3Ok: false,
}

export function getStakingRpcCapabilities(): StakingRpcCapabilities {
  return { ...capabilities }
}

/** Probe HTTP + optional Multicall3 (best-effort). */
export async function probeStakingRpcCapabilities(): Promise<StakingRpcCapabilities> {
  const deployment = getDefaultStakingRuntimeDeployment()
  if (!isStakingVaultRuntimeHydrationEnabled(deployment)) {
    capabilities = {
      httpReadOk: false,
      wsSubscribeOk: false,
      multicall3Ok: false,
    }
    return getStakingRpcCapabilities()
  }
  const http = getStakingJsonRpcProvider()
  let httpReadOk = false
  try {
    await Promise.race([
      http.getBlockNumber(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("probe-timeout")), 8_000)
      ),
    ])
    httpReadOk = true
  } catch {
    httpReadOk = false
  }

  /** Multicall3 batching is wired in read factory behind the same interface; chain probe stays HTTP-only. */
  const multicall3Ok = false

  const wsUrl = deployment.rpc.ws?.trim() || STAKING_RPC_WS_URL

  capabilities = {
    httpReadOk,
    wsSubscribeOk: Boolean(wsUrl),
    multicall3Ok,
  }
  return getStakingRpcCapabilities()
}

type WsState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "STALE" | "BACKING_OFF"

let wsState: WsState = "DISCONNECTED"
let blockHandler: ((n: number) => void) | null = null
let wsRefCount = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let backoffAttempt = 0
/** Bumps on teardown/reconnect so in-flight `openWsIfNeeded` / cancelled `eth_subscribe` are ignored. */
let wsConnectionEpoch = 0
const MAX_BACKOFF_MS = 120_000
const STALE_MS = 180_000

function clearReconnectTimer() {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function detachBlockListener() {
  const wsProvider = currentWs()
  if (wsProvider && blockHandler) {
    try {
      wsProvider.off("block", blockHandler)
    } catch {
      /* ignore */
    }
  }
  blockHandler = null
}

/** Detach listeners, clear registry entry, await destroy (avoids uncaught cancelled `eth_subscribe`). */
async function destroyCurrentWs(): Promise<void> {
  detachBlockListener()
  const ws = currentWs()
  setCurrentWs(undefined)
  if (!ws) return
  try {
    await ws.destroy()
  } catch {
    /* ignore */
  }
}

function scheduleWsReconnect() {
  clearReconnectTimer()
  if (wsRefCount <= 0) return
  const deployment = getDefaultStakingRuntimeDeployment()
  if (!isStakingVaultRuntimeHydrationEnabled(deployment)) return
  const url = deployment.rpc.ws?.trim() || STAKING_RPC_WS_URL
  if (!url) return

  wsState = "BACKING_OFF"
  stakingMetricsWsTransition("BACKING_OFF")
  wsConnectionEpoch += 1

  const base = Math.min(1_500 * 2 ** Math.min(backoffAttempt, 8), MAX_BACKOFF_MS)
  const jitter = Math.random() * 800
  backoffAttempt += 1
  recordWsReconnectAttempt()
  const wsKey = diagnosticsKey({
    endpointType: "websocket",
    transport: "ws",
    hostname: hostnameFromUrl(url),
  })
  incrementEndpointReconnectAttempts(wsKey)
  if (isRuntimeTelemetryEmitEnabled() && isWsReconnectLoopInWindow()) {
    const loopNorm = normalizeNetworkError(new Error("WebSocket reconnect loop"), {
      endpointType: "websocket",
      transport: "ws",
      url,
      chainId: deployment.caip2,
      deploymentId: deployment.id,
      severity: "alert",
      forceType: "WS_RECONNECT_LOOP",
    })
    recordEndpointFailure(wsKey, loopNorm)
    setLastWsReconnectLoopNormalized(loopNorm)
    emitRuntimeTelemetry(
      buildRuntimeTelemetryEvent(
        "provider_reconnect_loop",
        "warning",
        { reasonToken: "ws_backoff" },
        backoffAttempt
      )
    )
  }
  void (async () => {
    await destroyCurrentWs()
    if (wsRefCount <= 0) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void openWsIfNeeded()
    }, base + jitter)
  })()
}

async function openWsIfNeeded() {
  const deployment = getDefaultStakingRuntimeDeployment()
  if (!isStakingVaultRuntimeHydrationEnabled(deployment)) return
  const url = deployment.rpc.ws?.trim() || STAKING_RPC_WS_URL
  if (!url || wsRefCount <= 0) return

  if (wsState === "CONNECTING" || wsState === "CONNECTED") return
  wsState = "CONNECTING"
  stakingMetricsWsTransition("CONNECTING")

  const epoch = wsConnectionEpoch
  let ws: WebSocketProvider | undefined
  try {
    const chainId =
      tryParseEvmChainIdFromCaip2(deployment.caip2) ?? STAKING_CHAIN_ID
    ws = new WebSocketProvider(url, chainId, { staticNetwork: true })
    setCurrentWs(ws)
    ws.on("error", () => {
      if (epoch !== wsConnectionEpoch) return
      wsState = "STALE"
      stakingMetricsWsTransition("STALE")
      scheduleWsReconnect()
    })
    await ws.ready
    if (epoch !== wsConnectionEpoch || wsRefCount <= 0 || currentWs() !== ws) {
      await destroyCurrentWs()
      return
    }
    blockHandler = (n: number) => {
      stakingLatestBlockNumberRef.current = n
      stakingLastObservedBlockAtRef.current = performance.now()
    }
    ws.on("block", blockHandler)
    wsState = "CONNECTED"
    backoffAttempt = 0
    stakingMetricsWsTransition("CONNECTED")
    capabilities = { ...capabilities, wsSubscribeOk: true }
  } catch {
    if (epoch === wsConnectionEpoch) {
      wsState = "DISCONNECTED"
      stakingMetricsWsTransition("DISCONNECTED")
      scheduleWsReconnect()
    } else if (ws) {
      try {
        await ws.destroy()
      } catch {
        /* ignore */
      }
      if (currentWs() === ws) setCurrentWs(undefined)
    }
  }
}

let staleCheckTimer: ReturnType<typeof setInterval> | null = null

function ensureStaleChecker() {
  if (staleCheckTimer != null) return
  staleCheckTimer = setInterval(() => {
    const wsProvider = currentWs()
    if (wsRefCount <= 0 || !wsProvider || wsState !== "CONNECTED") return
    const now = performance.now()
    if (
      stakingLastObservedBlockAtRef.current > 0 &&
      now - stakingLastObservedBlockAtRef.current > STALE_MS
    ) {
      wsState = "STALE"
      stakingMetricsWsTransition("STALE")
      scheduleWsReconnect()
    }
  }, 30_000)
}

function stopStaleChecker() {
  if (staleCheckTimer != null) {
    clearInterval(staleCheckTimer)
    staleCheckTimer = null
  }
}

export function acquireStakingWsBlockSignal(): () => void {
  const deployment = getDefaultStakingRuntimeDeployment()
  const url = deployment.rpc.ws?.trim() || STAKING_RPC_WS_URL
  if (!isStakingVaultRuntimeHydrationEnabled(deployment)) {
    return () => {}
  }
  if (!url) {
    return () => {}
  }
  wsRefCount += 1
  if (wsRefCount === 1) {
    void openWsIfNeeded()
    ensureStaleChecker()
  }
  return () => {
    wsRefCount = Math.max(0, wsRefCount - 1)
    if (wsRefCount === 0) {
      wsConnectionEpoch += 1
      clearReconnectTimer()
      stopStaleChecker()
      void (async () => {
        await destroyCurrentWs()
        wsState = "DISCONNECTED"
        backoffAttempt = 0
      })()
    }
  }
}

export function disposeStakingWebSocketOnly(): void {
  wsRefCount = 0
  wsConnectionEpoch += 1
  clearReconnectTimer()
  stopStaleChecker()
  void destroyCurrentWs().then(() => {
    wsState = "DISCONNECTED"
  })
}
