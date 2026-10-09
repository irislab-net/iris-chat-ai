/**
 * Phase 41 — DEV-only runtime chaos / degraded-environment verification (`VITE_RUNTIME_CHAOS`).
 *
 * Fault injection is implemented in `runtimeTransitionTelemetry` + call sites (orchestrator, gas,
 * hydrate); this module drives **event storms** and **bounded timers** only. No production paths,
 * no analytics, no backend.
 *
 * ## Window API
 *
 * `window.__STAKING_RUNTIME_CHAOS__` — `runRpcChaos`, `runWalletChaos`, `runVisibilityChaos`,
 * `runRecoveryCheck`, `stopChaos`.
 *
 * ## Typical flow
 *
 * 1. Enable `VITE_RUNTIME_CHAOS=1` (DEV).
 * 2. `await window.__STAKING_RUNTIME_CHAOS__.runRpcChaos()` (bounded internal timer or call `stopChaos()` early).
 * 3. `await window.__STAKING_RUNTIME_CHAOS__.runRecoveryCheck()`.
 */
import { isRuntimeChaosSuiteEnabled } from "@/staking/config"
import {
  getStakingRefreshOrchestratorChaosDevSnapshot,
  notifyStakingRefresh,
  notifyStakingRefreshSemantic,
} from "@/staking/refresh"
import {
  getRuntimeChaosCounterSnapshot,
  getRuntimeChaosFaultInjectionSnapshot,
  getRuntimeStakingGasEstimateAsyncDepth,
  resetRuntimeChaosCounters,
  resetRuntimeChaosFaultInjection,
  setRuntimeChaosFaultInjection,
  STAKING_RUNTIME_CHAOS_MOBILE_RESUME_EVENT,
  STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT,
  traceRuntimeChaosStep,
} from "@/staking/core/runtimeTransitionTelemetry"
import { buildRuntimeTransitionCoordinatorSnapshot } from "@/staking/orchestration"
import { summarizeTortureLifecycleCounters } from "@/staking/orchestration/runtimeLifecycleAssertions"
import { buildSameDeploymentSwapRequest } from "@/staking/dev/runtimeSwapScenarios"
import type { InstallRuntimeSwapStressHarnessInput } from "@/staking/dev/runtimeSwapStressHarness"

const CHAOS_GLOBAL = "__STAKING_RUNTIME_CHAOS__" as const

let chaosIntervals: number[] = []
let chaosTimeouts: number[] = []

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function clearChaosSchedulers(): void {
  for (const h of chaosIntervals) clearInterval(h)
  chaosIntervals = []
  for (const h of chaosTimeouts) clearTimeout(h)
  chaosTimeouts = []
}

export type RuntimeChaosRecoveryCheckResult = Readonly<{
  ok: boolean
  details: Record<string, unknown>
}>

export function stopChaos(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  clearChaosSchedulers()
  resetRuntimeChaosFaultInjection()
  resetRuntimeChaosCounters()
  traceRuntimeChaosStep("stopChaos", {})
}

export async function performChaosRecoveryCheck(
  getBundle: InstallRuntimeSwapStressHarnessInput["getBundle"]
): Promise<RuntimeChaosRecoveryCheckResult> {
  await sleep(600)
  const orch = getStakingRefreshOrchestratorChaosDevSnapshot()
  const gas = getRuntimeStakingGasEstimateAsyncDepth()
  const chaos = getRuntimeChaosCounterSnapshot()
  const faults = getRuntimeChaosFaultInjectionSnapshot()
  const bundle = getBundle()
  const coord = buildRuntimeTransitionCoordinatorSnapshot(
    bundle.selection,
    bundle.transitionController
  )
  const lifecycle = summarizeTortureLifecycleCounters()
  const faultsIdle =
    faults.fastReadLagMs === 0 &&
    faults.slowReadLagMs === 0 &&
    faults.rpcFailureProbability === 0 &&
    faults.gasDelayMs === 0 &&
    !faults.gasForceFail &&
    faults.hydrateDelayMs === 0 &&
    !faults.hydrateForceFail
  const ok =
    faultsIdle &&
    gas === 0 &&
    coord.lifecycle === "stable" &&
    coord.sequenceStage === "idle" &&
    !coord.refreshPaused
  const details: Record<string, unknown> = {
    orchestrator: orch,
    gasEstimateAsyncDepth: gas,
    chaosCounters: chaos,
    faultInjection: faults,
    coordinator: {
      lifecycle: coord.lifecycle,
      sequenceStage: coord.sequenceStage,
      refreshPaused: coord.refreshPaused,
    },
    registry: lifecycle.registry,
  }
  traceRuntimeChaosStep("runRecoveryCheck", { ok, ...details })
  return { ok, details }
}

async function runRpcChaosImpl(
  input: InstallRuntimeSwapStressHarnessInput
): Promise<void> {
  traceRuntimeChaosStep("runRpcChaos_start", {})
  setRuntimeChaosFaultInjection({
    fastReadLagMs: 140,
    slowReadLagMs: 320,
    rpcFailureProbability: 0.1,
    gasDelayMs: 80,
    gasForceFail: false,
    hydrateDelayMs: 0,
    hydrateForceFail: false,
  })

  const vis = window.setInterval(() => {
    notifyStakingRefreshSemantic("visibility-state-change")
    notifyStakingRefreshSemantic("network-state-change")
  }, 110)
  chaosIntervals.push(vis)

  const swapEvery = window.setInterval(() => {
    try {
      const b = input.getBundle()
      input.swap(buildSameDeploymentSwapRequest(b.selection))
    } catch {
      /* swap may deny under policy — expected during chaos */
    }
  }, 750)
  chaosIntervals.push(swapEvery)

  const t = window.setTimeout(() => {
    traceRuntimeChaosStep("runRpcChaos_auto_tail", { note: "clearing fault injection timers only" })
    clearChaosSchedulers()
    resetRuntimeChaosFaultInjection()
  }, 12_000)
  chaosTimeouts.push(t)
}

async function runWalletChaosImpl(): Promise<void> {
  traceRuntimeChaosStep("runWalletChaos_start", {})
  for (let i = 0; i < 18; i++) {
    window.dispatchEvent(new CustomEvent(STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT))
    notifyStakingRefresh("chaos-wallet-flurry")
    await sleep(45)
  }
  traceRuntimeChaosStep("runWalletChaos_done", {})
}

async function runVisibilityChaosImpl(): Promise<void> {
  traceRuntimeChaosStep("runVisibilityChaos_start", {})
  for (let i = 0; i < 24; i++) {
    document.dispatchEvent(new Event("visibilitychange"))
    notifyStakingRefreshSemantic("visibility-state-change")
    window.dispatchEvent(new CustomEvent(STAKING_RUNTIME_CHAOS_MOBILE_RESUME_EVENT))
    if (i % 5 === 0) {
      window.dispatchEvent(new Event("blur"))
      await sleep(20)
      window.dispatchEvent(new Event("focus"))
    }
    await sleep(35)
  }
  try {
    window.dispatchEvent(new Event("pageshow"))
  } catch {
    /* ignore */
  }
  traceRuntimeChaosStep("runVisibilityChaos_done", {})
}

export function bootstrapStakingRuntimeChaosDevTooling(
  input: InstallRuntimeSwapStressHarnessInput
): () => void {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return () => {}
  const w = typeof globalThis !== "undefined" ? (globalThis as unknown as Window) : undefined
  if (w == null) return () => {}

  const api = {
    runRpcChaos: () => runRpcChaosImpl(input),
    runWalletChaos: () => runWalletChaosImpl(),
    runVisibilityChaos: () => runVisibilityChaosImpl(),
    runRecoveryCheck: () => performChaosRecoveryCheck(input.getBundle),
    stopChaos,
  }

  Object.defineProperty(w, CHAOS_GLOBAL, {
    value: api,
    configurable: true,
    enumerable: false,
  })

  return () => {
    stopChaos()
    Reflect.deleteProperty(w, CHAOS_GLOBAL)
  }
}
