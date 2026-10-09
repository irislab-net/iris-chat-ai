if ((process.env.NODE_ENV !== 'production')) {
  void import("@/staking/core/runtimeCoreLayerBoundaryDev")
}

import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import { getDefaultRuntimeSelection } from "@/staking/core/runtimeSelectionDefaults"
import {
  createInitialRuntimeTransitionControllerState,
  type RuntimeTransitionControllerState,
} from "@/staking/core/runtimeTransitionController"
import {
  executeRuntimeSwap,
  type RuntimeSwapRequest,
  type RuntimeSwapResult,
} from "@/staking/orchestration"
import { deriveRuntimeExecutionIdentity, runtimeExecutionIdentityEquals } from "@/staking/core/runtimeExecutionGuard"
import { buildRuntimeTransitionCoordinatorSnapshot } from "@/staking/orchestration"
import {
  takeRuntimeSwapStressTelemetry,
  traceRuntimeSelectionCoordinatorDesync,
} from "@/staking/core/runtimeTransitionTelemetry"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import {
  isRuntimeChaosSuiteEnabled,
  isRuntimePickerDevEnabled,
  isRuntimeSwapStressHarnessEnabled,
  isRuntimeSwitchExecutionEnabledForInternalUse,
  isRuntimeTortureSuiteEnabled,
} from "@/staking/config"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

/* eslint-disable react-refresh/only-export-components -- provider shares context with colocated hooks (Phase 23+). */
type RuntimeSelectionBundle = Readonly<{
  selection: ActiveRuntimeSelection
  transitionController: RuntimeTransitionControllerState
  /**
   * @internal DEV / Vitest only — **`null`** in production. Executes **`executeRuntimeSwap`** and applies
   * selection + controller atomically; never exported for product UI.
   */
  swapRuntimeForTesting: ((req: RuntimeSwapRequest) => RuntimeSwapResult) | null
}>

const RuntimeSelectionContext = createContext<RuntimeSelectionBundle | null>(null)

function createInitialRuntimeSelectionBundle(): {
  selection: ActiveRuntimeSelection
  transitionController: RuntimeTransitionControllerState
} {
  return {
    selection: getDefaultRuntimeSelection(),
    transitionController: createInitialRuntimeTransitionControllerState(),
  }
}

/**
 * Phase 23–26 — passive runtime selection scope (no persistence).
 *
 * **Phase 32–38:** **`selection`** + **`transitionController`** are **`useState`**-backed — production still
 * uses the default row only; **`swapRuntimeForTesting`** (DEV) runs **`executeRuntimeSwap`**, which applies
 * **`evaluateRuntimeSwapPolicy`** first (tx modal surface + capabilities + quiescence). Replacement is atomic
 * (single **`setState`**) and sequenced by the swap engine, not render timing. **Phase 36 (DEV):** layout effect
 * warns if passive selection identity and coordinator snapshot disagree. **Phase 37–39 (DEV):** opt-in
 * **`VITE_RUNTIME_TORTURE`** / **`VITE_RUNTIME_SWAP_STRESS`** install dev tooling via `bootstrapStakingRuntimeDevTooling`
 * (`window.__STAKING_RUNTIME_SWAP_STRESS__` and/or `window.__STAKING_RUNTIME_TORTURE__`; Phase 39 adds `runReadinessGate` / `printReadinessGate` on the latter).
 * **Phase 40:** `VITE_RUNTIME_PICKER_DEV` mounts **`RuntimePickerDevPanel`** and treats torture bootstrap like `VITE_RUNTIME_TORTURE` for **`__STAKING_RUNTIME_TORTURE__`** (diagnostics only; no persistence).
 * **Phase 41:** `VITE_RUNTIME_CHAOS` installs **`window.__STAKING_RUNTIME_CHAOS__`** via `runtimeChaosSuite.ts` (fault + event chaos; DEV only).
 *
 * **Phase 42 — PRODUCTION-FROZEN:** passive selection + DEV swap entry are the runtime boundary for React;
 * change only for integration bugs. See `docs/staking-runtime-phase42-stabilization.md`.
 * **Phase 44:** internal swap entry is additionally gated by **`getRuntimeSwitchRolloutLayer`** /
 * **`isRuntimeSwitchExecutionEnabledForInternalUse`** (`VITE_RUNTIME_SWITCH_ROLLOUT`, default **`disabled`**).
 */
export function RuntimeSelectionProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState(createInitialRuntimeSelectionBundle)
  const bundleRef = useRef(bundle)
  bundleRef.current = bundle

  const swapRuntimeForTesting = useCallback(
    (req: RuntimeSwapRequest): RuntimeSwapResult => {
      if (!isRuntimeSwitchExecutionEnabledForInternalUse()) {
        return {
          ok: false,
          reason: "runtime_switch_rollout_disabled",
          recoverController: bundleRef.current.transitionController,
        }
      }
      const current = bundleRef.current
      const r = executeRuntimeSwap({
        currentSelection: current.selection,
        currentController: current.transitionController,
        request: req,
        stressTelemetry: takeRuntimeSwapStressTelemetry(),
      })
      if (r.ok) {
        setBundle({
          selection: r.nextSelection,
          transitionController: r.nextController,
        })
      } else {
        setBundle(b => ({
          ...b,
          transitionController: r.recoverController,
        }))
      }
      return r
    },
    []
  )

  const value = useMemo<RuntimeSelectionBundle>(
    () => ({
      selection: bundle.selection,
      transitionController: bundle.transitionController,
      swapRuntimeForTesting: isRuntimeSwitchExecutionEnabledForInternalUse()
        ? swapRuntimeForTesting
        : null,
    }),
    [bundle.selection, bundle.transitionController, swapRuntimeForTesting]
  )

  useLayoutEffect(() => {
    const coord = buildRuntimeTransitionCoordinatorSnapshot(
      bundle.selection,
      bundle.transitionController
    )
    const selId = deriveRuntimeExecutionIdentity(bundle.selection)
    if (!runtimeExecutionIdentityEquals(selId, coord.activeExecutionIdentity)) {
      if ((process.env.NODE_ENV !== 'production')) {
        traceRuntimeSelectionCoordinatorDesync({
          selectionIdentity: selId,
          coordinatorIdentity: coord.activeExecutionIdentity,
        })
      }
      if (isRuntimeTelemetryEmitEnabled()) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("runtime_selection_desync", "warning", {
            runtimeKey: coord.activeExecutionIdentity.runtimeKey,
            deploymentId: bundle.selection.deployment.id,
            chainFamily: bundle.selection.deployment.chainFamily,
            lifecycle: coord.lifecycle,
            sequenceStage: coord.sequenceStage,
            transitionGeneration: Number(coord.transitionGeneration),
          })
        )
      }
    }
  }, [bundle.selection, bundle.transitionController])

  useEffect(() => {
    if (!isRuntimeTelemetryEmitEnabled()) return
    const c = bundle.transitionController
    const stuckish =
      c.lifecycle === "pausing" ||
      c.lifecycle === "switching" ||
      (c.sequenceStage !== "idle" && c.sequenceStage !== "settled")
    if (!stuckish) return
    const t = window.setTimeout(() => {
      const cur = bundleRef.current
      const c2 = cur.transitionController
      const still =
        c2.lifecycle === "pausing" ||
        c2.lifecycle === "switching" ||
        (c2.sequenceStage !== "idle" && c2.sequenceStage !== "settled")
      if (!still) return
      const coord = buildRuntimeTransitionCoordinatorSnapshot(cur.selection, c2)
      emitRuntimeTelemetry(
        buildRuntimeTelemetryEvent("runtime_transition_stuck", "error", {
          runtimeKey: coord.activeExecutionIdentity.runtimeKey,
          deploymentId: cur.selection.deployment.id,
          chainFamily: cur.selection.deployment.chainFamily,
          lifecycle: coord.lifecycle,
          sequenceStage: coord.sequenceStage,
          transitionGeneration: Number(coord.transitionGeneration),
        })
      )
    }, 120_000)
    return () => clearTimeout(t)
  }, [
    bundle.transitionController.lifecycle,
    bundle.transitionController.sequenceStage,
    bundle.selection.runtimeKey,
    bundle.selection.deployment.id,
  ])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    if (
      !isRuntimeSwapStressHarnessEnabled() &&
      !isRuntimeTortureSuiteEnabled() &&
      !isRuntimePickerDevEnabled()
    ) {
      return
    }
    let uninstall: (() => void) | undefined
    void import("@/staking/dev/runtimeTortureSuite").then(mod => {
      uninstall = mod.bootstrapStakingRuntimeDevTooling({
        stress: isRuntimeSwapStressHarnessEnabled(),
        torture: isRuntimeTortureSuiteEnabled() || isRuntimePickerDevEnabled(),
        swap: req => swapRuntimeForTesting(req),
        getBundle: () => ({
          selection: bundleRef.current.selection,
          transitionController: bundleRef.current.transitionController,
        }),
      })
    })
    return () => {
      uninstall?.()
    }
  }, [swapRuntimeForTesting])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
    let uninstallChaos: (() => void) | undefined
    void import("@/staking/dev/runtimeChaosSuite").then(mod => {
      uninstallChaos = mod.bootstrapStakingRuntimeChaosDevTooling({
        swap: req => swapRuntimeForTesting(req),
        getBundle: () => ({
          selection: bundleRef.current.selection,
          transitionController: bundleRef.current.transitionController,
        }),
      })
    })
    return () => {
      uninstallChaos?.()
    }
  }, [swapRuntimeForTesting])

  return (
    <RuntimeSelectionContext.Provider value={value}>{children}</RuntimeSelectionContext.Provider>
  )
}

export function useActiveRuntimeSelection(): ActiveRuntimeSelection {
  const v = useContext(RuntimeSelectionContext)
  if (v === null) {
    throw new Error(
      "[staking] useActiveRuntimeSelection must be used within RuntimeSelectionProvider (Phase 23)."
    )
  }
  return v.selection
}

/** Phase 32–33 — read-only controller row; transition + sequence actions are not wired to UI yet. */
export function useRuntimeTransitionControllerState(): RuntimeTransitionControllerState {
  const v = useContext(RuntimeSelectionContext)
  if (v === null) {
    throw new Error(
      "[staking] useRuntimeTransitionControllerState must be used within RuntimeSelectionProvider."
    )
  }
  return v.transitionController
}

/**
 * @internal Returns **`null`** when runtime switch rollout is **`disabled`** or insufficient for this build.
 * Uses **`executeRuntimeSwap`** (policy + capability gated). See Phase 44 rollout env.
 */
export function useInternalRuntimeSwapForTesting():
  | ((req: RuntimeSwapRequest) => RuntimeSwapResult)
  | null {
  const v = useContext(RuntimeSelectionContext)
  if (v === null) {
    throw new Error(
      "[staking] useInternalRuntimeSwapForTesting must be used within RuntimeSelectionProvider."
    )
  }
  return v.swapRuntimeForTesting
}
