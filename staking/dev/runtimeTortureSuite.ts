/**
 * Phase 38–39 — DEV-only runtime torture suite (`VITE_RUNTIME_TORTURE`).
 * Composes with Phase 37 swap stress harness when `VITE_RUNTIME_SWAP_STRESS` or torture is enabled.
 * **Phase 41:** companion **`runtimeChaosSuite`** + `VITE_RUNTIME_CHAOS` → `window.__STAKING_RUNTIME_CHAOS__`.
 */
import { isRuntimePickerDevEnabled, isRuntimeTortureSuiteEnabled } from "@/staking/config"
import {
  clearPersistedStakingTxSession,
  writePersistedStakingTxSession,
} from "@/staking/tx"
import { notifyStakingRefresh, notifyStakingRefreshSemantic } from "@/staking/refresh"
import {
  getRuntimeStakingGasEstimateAsyncDepth,
  getRuntimeTortureCounterSnapshot,
  getRuntimeTortureWalletContext,
  STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT,
  traceRuntimeStressLeak,
  traceRuntimeTortureStep,
} from "@/staking/core/runtimeTransitionTelemetry"
import {
  assertRegistryGrowthBounded,
  buildSyntheticPersistedStakingTxSessionV1,
  captureRegistrySizeBaseline,
  summarizeTortureLifecycleCounters,
} from "@/staking/orchestration/runtimeLifecycleAssertions"
import { buildSameDeploymentSwapRequest } from "@/staking/dev/runtimeSwapScenarios"
import {
  evaluateRuntimeReadinessGate,
  installReadinessGateSessionBaseline,
  printRuntimeReadinessGateResult,
  captureReadinessRegistryBaseline,
} from "@/staking/dev/runtimeReadinessGate"
import {
  installRuntimeSwapStressHarness,
  type InstallRuntimeSwapStressHarnessInput,
} from "@/staking/dev/runtimeSwapStressHarness"

const TORTURE_GLOBAL = "__STAKING_RUNTIME_TORTURE__" as const

export type BootstrapStakingRuntimeDevToolingInput = InstallRuntimeSwapStressHarnessInput & {
  stress: boolean
  torture: boolean
}

/** Single DEV bootstrap: swap harness when stress∨torture; torture window API when torture. */
export function bootstrapStakingRuntimeDevTooling(
  opts: BootstrapStakingRuntimeDevToolingInput
): () => void {
  if (!(process.env.NODE_ENV !== 'production')) return () => {}
  const { stress, torture, swap, getBundle } = opts
  let unstress: (() => void) | undefined
  if (stress || torture) {
    unstress = installRuntimeSwapStressHarness({ swap, getBundle })
  }
  let untorture: (() => void) | undefined
  if (torture) {
    untorture = installRuntimeTortureWindow({ swap, getBundle })
  }
  return () => {
    untorture?.()
    unstress?.()
  }
}

function getStressWindowApi(): Record<string, unknown> | null {
  const w = typeof globalThis !== "undefined" ? (globalThis as unknown as Window) : undefined
  if (w == null) return null
  const api = (w as unknown as Record<string, unknown>).__STAKING_RUNTIME_SWAP_STRESS__
  return api != null && typeof api === "object" ? (api as Record<string, unknown>) : null
}

function installRuntimeTortureWindow(
  input: InstallRuntimeSwapStressHarnessInput
): () => void {
  if (!(process.env.NODE_ENV !== 'production') || (!isRuntimeTortureSuiteEnabled() && !isRuntimePickerDevEnabled())) {
    return () => {}
  }
  const { swap, getBundle } = input
  const w = typeof globalThis !== "undefined" ? (globalThis as unknown as Window) : undefined
  if (w == null) return () => {}

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

  installReadinessGateSessionBaseline()

  const api = {
    async runLongSession(iterations = 12): Promise<void> {
      const baseline = captureRegistrySizeBaseline()
      traceRuntimeTortureStep("runLongSession_start", { iterations })
      for (let i = 0; i < iterations; i++) {
        notifyStakingRefresh(`torture-long-session-${i}`)
        await sleep(120)
        const b = getBundle()
        swap(buildSameDeploymentSwapRequest(b.selection))
        await sleep(120)
      }
      assertRegistryGrowthBounded(baseline, 2, "runLongSession")
      traceRuntimeTortureStep("runLongSession_done", { iterations })
    },

    async runHydrateLoop(iterations = 3): Promise<void> {
      const wc = getRuntimeTortureWalletContext()
      if (wc == null) {
        traceRuntimeStressLeak("torture_hydrate_loop_skipped", {
          reason: "no_wallet_context_register_connected_wallet",
        })
        return
      }
      traceRuntimeTortureStep("runHydrateLoop_start", { iterations })
      for (let i = 0; i < iterations; i++) {
        const passive = getBundle().selection
        writePersistedStakingTxSession(
          buildSyntheticPersistedStakingTxSessionV1({
            walletAddress: wc.address,
            chainId: wc.chainId,
            passive,
          })
        )
        window.dispatchEvent(new CustomEvent(STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT))
        await sleep(200)
      }
      traceRuntimeTortureStep("runHydrateLoop_done", { iterations })
    },

    async runSwapStorm(count = 8): Promise<void> {
      traceRuntimeTortureStep("runSwapStorm_start", { count })
      for (let i = 0; i < count; i++) {
        const b = getBundle()
        swap(buildSameDeploymentSwapRequest(b.selection))
        notifyStakingRefreshSemantic("network-state-change")
        await sleep(40)
      }
      traceRuntimeTortureStep("runSwapStorm_done", { count })
    },

    async runVisibilityStress(iterations = 6): Promise<void> {
      traceRuntimeTortureStep("runVisibilityStress_start", { iterations })
      for (let i = 0; i < iterations; i++) {
        notifyStakingRefreshSemantic("visibility-state-change")
        await sleep(80)
      }
      traceRuntimeTortureStep("runVisibilityStress_done", { iterations })
    },

    dumpRuntimeState(): Record<string, unknown> {
      const stress = getStressWindowApi()
      let stressScenarioCount: number | null = null
      const listFn = stress?.listScenarios
      if (typeof listFn === "function") {
        try {
          stressScenarioCount = (listFn as () => unknown[])().length
        } catch {
          stressScenarioCount = null
        }
      }
      return {
        tortureCounters: getRuntimeTortureCounterSnapshot(),
        lifecycle: summarizeTortureLifecycleCounters(),
        gasEstimateAsyncDepth: getRuntimeStakingGasEstimateAsyncDepth(),
        stressApiPresent: Boolean(stress),
        stressScenarioCount,
      }
    },

    assertNoRuntimeLeaks(maxRegistryDelta = 2): boolean {
      const baseline = captureRegistrySizeBaseline()
      const ok = assertRegistryGrowthBounded(baseline, maxRegistryDelta, "assertNoRuntimeLeaks")
      if (!ok) {
        traceRuntimeStressLeak("torture_assert_leaks_failed", {
          baseline,
          current: summarizeTortureLifecycleCounters().registry,
        })
      }
      return ok
    },

    captureReadinessRegistryBaseline,

    async runReadinessGate(settleIdleMs?: number) {
      return evaluateRuntimeReadinessGate({
        getBundle,
        settleIdleMs,
      })
    },

    async printReadinessGate(settleIdleMs?: number) {
      const r = await evaluateRuntimeReadinessGate({ getBundle, settleIdleMs })
      printRuntimeReadinessGateResult(r)
      return r
    },
  }

  Object.defineProperty(w, TORTURE_GLOBAL, {
    value: api,
    configurable: true,
    enumerable: false,
  })

  return () => {
    clearPersistedStakingTxSession("torture_suite_teardown")
    Reflect.deleteProperty(w, TORTURE_GLOBAL)
  }
}
