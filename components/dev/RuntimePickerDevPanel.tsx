/**
 * Phase 40–44 — internal runtime picker (`VITE_RUNTIME_PICKER_DEV` + `VITE_RUNTIME_SWITCH_ROLLOUT`).
 * Surfaces `executeRuntimeSwap` via `useInternalRuntimeSwapForTesting` only; no persistence.
 * On public production keep rollout **`disabled`** (picker hidden).
 */
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import {
  useActiveRuntimeSelection,
  useInternalRuntimeSwapForTesting,
  useRuntimeTransitionControllerState,
} from "@/staking/core/runtimeSelectionContext"
import { createActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import type { RuntimeSwapFailureReason } from "@/staking/orchestration"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { buildRuntimeTransitionCoordinatorSnapshot } from "@/staking/orchestration"
import { buildRuntimeTransitionSnapshot } from "@/staking/core/runtimeTransition"
import {
  evaluateRuntimeSwapPolicy,
  getRuntimeSwapTxModalSurfaceForPolicy,
  isRuntimeSwapEntryAllowed,
  RUNTIME_SWAP_POLICY_DENIAL_MESSAGES,
  type RuntimeSwapPolicyDenialReason,
} from "@/staking/orchestration"
import { summarizeRuntimeCapabilitiesForDev } from "@/staking/core/runtimeCapabilities"
import { stakingProductRuntimeSwitchBlockedMessage } from "@/lib/stakingProduct/stakingProductUserMessages"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import { useCallback, useMemo, useState } from "react"

const TORTURE_GLOBAL = "__STAKING_RUNTIME_TORTURE__"

function policyMessage(reason: RuntimeSwapPolicyDenialReason): string {
  return RUNTIME_SWAP_POLICY_DENIAL_MESSAGES[reason] ?? reason
}

function getTortureWindowApi(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = (window as unknown as Record<string, unknown>)[TORTURE_GLOBAL]
  return raw != null && typeof raw === "object" ? (raw as Record<string, unknown>) : null
}

export function RuntimePickerDevPanel() {
  const selection = useActiveRuntimeSelection()
  const controller = useRuntimeTransitionControllerState()
  const swap = useInternalRuntimeSwapForTesting()
  const vault = useStakingVault()

  const coordinator = useMemo(
    () => buildRuntimeTransitionCoordinatorSnapshot(selection, controller),
    [selection, controller]
  )
  const transitionRow = useMemo(
    () => buildRuntimeTransitionSnapshot(selection, controller),
    [selection, controller]
  )

  const deployments = useMemo(
    () => getStakingDeploymentRegistry().deployments,
    []
  )

  const txModalSurface = getRuntimeSwapTxModalSurfaceForPolicy()

  const quiescent = isRuntimeSwapEntryAllowed(controller)

  const [lastOutcome, setLastOutcome] = useState<
    | {
        ok: true
      }
    | {
        ok: false
        reason: RuntimeSwapFailureReason
        human: string
        coordinatorLifecycle: string
        sequenceStage: string
        transitionState: string
        txModal: ReturnType<typeof getRuntimeSwapTxModalSurfaceForPolicy>
      }
    | null
  >(null)

  const [busy, setBusy] = useState(false)

  const previewPolicy = useCallback(
    (nextDeployment: StakingDeploymentConfig) =>
      evaluateRuntimeSwapPolicy({
        currentSelection: selection,
        currentController: controller,
        nextDeployment,
        walletChainId: vault.executionChainId,
      }),
    [selection, controller, vault.executionChainId]
  )

  const runSwap = useCallback(
    (dep: StakingDeploymentConfig) => {
      if (swap == null) return
      setBusy(true)
      setLastOutcome(null)
      try {
        const r = swap({ nextRuntime: createActiveRuntimeSelection(dep) })
        const surface = getRuntimeSwapTxModalSurfaceForPolicy()
        if (r.ok) {
          setLastOutcome({ ok: true })
        } else {
          const human = stakingProductRuntimeSwitchBlockedMessage(r.reason)
          const coord = buildRuntimeTransitionCoordinatorSnapshot(
            selection,
            r.recoverController
          )
          const rt = buildRuntimeTransitionSnapshot(selection, r.recoverController)
          setLastOutcome({
            ok: false,
            reason: r.reason,
            human,
            coordinatorLifecycle: coord.lifecycle,
            sequenceStage: coord.sequenceStage,
            transitionState: rt.transitionState,
            txModal: surface,
          })
        }
      } finally {
        setBusy(false)
      }
    },
    [swap, selection]
  )

  const callTorture = useCallback(async (name: string) => {
    const api = getTortureWindowApi()
    const fn = api?.[name]
    if (typeof fn !== "function") {
      console.warn(`[RuntimePickerDevPanel] ${TORTURE_GLOBAL}.${name} not available`)
      return
    }
    await (fn as (...a: unknown[]) => unknown)()
  }, [])

  const capsLine = summarizeRuntimeCapabilitiesForDev(selection.capabilities)

  return (
    <div
      style={{
        position: "fixed",
        right: 8,
        bottom: 8,
        zIndex: 99999,
        maxWidth: 380,
        maxHeight: "78vh",
        overflow: "auto",
        background: "#111",
        color: "#ddd",
        fontFamily: "monospace",
        fontSize: 11,
        padding: 10,
        border: "1px solid #444",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#fa0" }}>
        DEV runtime picker
      </div>

      <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
        <div>deployment: {selection.deployment.id.trim()}</div>
        <div>chainFamily: {selection.deployment.chainFamily}</div>
        <div>runtimeKey: {selection.runtimeKey}</div>
        <div>generation: {String(selection.generation)}</div>
        <div>transitionGeneration: {String(controller.transitionGeneration)}</div>
        <div>transitionState: {transitionRow.transitionState}</div>
        <div>sequenceStage: {coordinator.sequenceStage}</div>
        <div>lifecycle: {coordinator.lifecycle}</div>
        <div>refreshPaused: {String(controller.refreshPaused)}</div>
        <div>capabilities: {capsLine}</div>
      </div>

      {!quiescent ? (
        <div style={{ color: "#f66", marginBottom: 8 }}>
          Controller not quiescent — swaps disabled (
          {policyMessage("policy_transition_not_quiescent")})
        </div>
      ) : null}

      <div style={{ marginBottom: 6, color: "#888" }}>Registry rows</div>
      <ul style={{ margin: "0 0 8px 16px", padding: 0 }}>
        {deployments.map(dep => {
          const active = dep.id.trim() === selection.deployment.id.trim()
          const policy = previewPolicy(dep)
          const disabled =
            busy ||
            swap == null ||
            !quiescent ||
            !policy.allowed
          const label = `${dep.id.trim()} · ${dep.chainFamily}`
          return (
            <li key={dep.id} style={{ marginBottom: 4, listStyle: "disc" }}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => runSwap(dep)}
                style={{
                  fontSize: 10,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                {active ? "● " : ""}
                Swap → {label}
              </button>
              {!policy.allowed ? (
                <span style={{ color: "#c96", marginLeft: 4 }}>
                  ({policy.reason})
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div style={{ marginBottom: 4, color: "#888" }}>Tx modal (policy input)</div>
      <div style={{ marginBottom: 8, fontSize: 10, lineHeight: 1.35 }}>
        open={String(txModalSurface.dialogOpen)} · phase=
        {txModalSurface.uiPhase ?? "null"} · frozenRuntime=
        {txModalSurface.transactionRuntime != null ? "yes" : "no"}
      </div>

      {lastOutcome != null ? (
        <div
          style={{
            marginBottom: 8,
            padding: 6,
            background: lastOutcome.ok ? "#132" : "#311",
            border: `1px solid ${lastOutcome.ok ? "#363" : "#633"}`,
            fontSize: 10,
            lineHeight: 1.35,
          }}
        >
          {lastOutcome.ok ? (
            <div style={{ color: "#8d8" }}>Last swap: ok</div>
          ) : (
            <>
              <div style={{ color: "#f88" }}>Last swap denied</div>
              <div>reason: {lastOutcome.reason}</div>
              <div>{lastOutcome.human}</div>
              <div>
                coordinator: lifecycle={lastOutcome.coordinatorLifecycle} ·
                sequence={lastOutcome.sequenceStage} · transitionState=
                {lastOutcome.transitionState}
              </div>
              <div>
                txModal: open={String(lastOutcome.txModal.dialogOpen)} · phase=
                {lastOutcome.txModal.uiPhase ?? "null"} · frozen=
                {lastOutcome.txModal.transactionRuntime != null ? "yes" : "no"}
              </div>
            </>
          )}
        </div>
      ) : null}

      <div style={{ color: "#888", marginBottom: 4 }}>Torture (if bootstrapped)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <button
          type="button"
          style={{ fontSize: 10 }}
          onClick={() => void callTorture("runReadinessGate")}
        >
          runReadinessGate
        </button>
        <button
          type="button"
          style={{ fontSize: 10 }}
          onClick={() => {
            const api = getTortureWindowApi()
            const d = api?.dumpRuntimeState
            if (typeof d === "function") {
              console.log("[dumpRuntimeState]", d.call(api))
            }
          }}
        >
          dumpRuntimeState
        </button>
        <button
          type="button"
          style={{ fontSize: 10 }}
          onClick={() => void callTorture("runSwapStorm")}
        >
          runSwapStorm
        </button>
        <button
          type="button"
          style={{ fontSize: 10 }}
          onClick={() => void callTorture("runLongSession")}
        >
          runLongSession
        </button>
      </div>
    </div>
  )
}
