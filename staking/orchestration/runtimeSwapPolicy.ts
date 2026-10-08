import type { TransactionRuntimeSnapshot } from "@/staking/core/persistenceTypes"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  getRuntimeCapabilitiesForDeployment,
  isDeploymentRuntimeExecutable,
} from "@/staking/core/runtimeCapabilities"
import type { RuntimeTransitionControllerState } from "@/staking/core/runtimeTransitionController"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"
import { TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP } from "@/staking/tx/types/transactionStatusUiPhase"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"

/**
 * Phase 35–36 — **centralized admission** for runtime swaps (pure). No React; tx modal surface may be supplied
 * explicitly or via **`getRuntimeSwapTxModalSurfaceForPolicy`** (registered by **`TransactionStatusProvider`**).
 * Phase 36: denial reasons are surfaced by **`traceRuntimeSwapPolicyDenied`** in the swap engine (DEV-only).
 * **Phase 40:** **`RUNTIME_SWAP_POLICY_DENIAL_MESSAGES`** supports the internal DEV runtime picker only.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** admission rules are stability-critical; change only for policy bugs.
 * See `docs/staking-runtime-phase42-stabilization.md`.
 */

export type RuntimeSwapPolicyResult =
  | { allowed: true }
  | { allowed: false; reason: RuntimeSwapPolicyDenialReason }

export type RuntimeSwapPolicyDenialReason =
  | "policy_tx_modal_active_non_terminal"
  | "policy_transition_not_quiescent"
  | "policy_refresh_state_inconsistent"
  | "policy_target_passive_reads_blocked"
  | "policy_target_execution_inadequate_for_active_path"
  | "policy_unknown_chain_family"
  | "policy_wallet_compatibility_denied"

/** Phase 40–45 — user-facing copy for policy denials (DEV picker + any future UI). No internal runtime jargon. */
export const RUNTIME_SWAP_POLICY_DENIAL_MESSAGES: Record<
  RuntimeSwapPolicyDenialReason,
  string
> = {
  policy_tx_modal_active_non_terminal:
    "Please finish or close your current transaction before switching networks.",
  policy_transition_not_quiescent:
    "Please wait for the current transaction to finish, then try again.",
  policy_refresh_state_inconsistent:
    "Staking is still updating. Wait a moment and try again.",
  policy_target_passive_reads_blocked:
    "That network isn’t available for balance checks yet.",
  policy_target_execution_inadequate_for_active_path:
    "That network can’t be used for this action with your wallet right now.",
  policy_unknown_chain_family: "That network isn’t supported here yet.",
  policy_wallet_compatibility_denied:
    "Your wallet can’t use that network for staking yet.",
}

export type RuntimeSwapTxModalSurface = Readonly<{
  dialogOpen: boolean
  transactionRuntime: TransactionRuntimeSnapshot | null
  uiPhase: TransactionStatusUiPhase | null
}>

const DEFAULT_TX_MODAL_SURFACE: RuntimeSwapTxModalSurface = {
  dialogOpen: false,
  transactionRuntime: null,
  uiPhase: null,
}

/** Controller must be quiescent before swap protocol or policy sequencing (Phase 34–35). */
export function isRuntimeSwapEntryAllowed(
  controller: RuntimeTransitionControllerState
): boolean {
  return (
    controller.sequenceStage === "idle" &&
    controller.lifecycle === "stable" &&
    !controller.refreshPaused
  )
}

/** @internal Registered by `TransactionStatusProvider` so swap policy sees latest modal snapshot. */
let txModalSurfaceGetter: (() => RuntimeSwapTxModalSurface) | null = null

/** Phase 37 — DEV-only stress harness: when set, masks the registered getter for policy evaluation. */
let devStressTxModalSurfaceOverride: RuntimeSwapTxModalSurface | null = null

export function setRuntimeSwapStressTxModalSurfaceOverride(
  surface: RuntimeSwapTxModalSurface | null
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  devStressTxModalSurfaceOverride = surface
}

export function registerRuntimeSwapTxModalSurfaceGetter(
  getter: (() => RuntimeSwapTxModalSurface) | null
): void {
  txModalSurfaceGetter = getter
}

export function getRuntimeSwapTxModalSurfaceForPolicy(): RuntimeSwapTxModalSurface {
  if ((process.env.NODE_ENV !== 'production') && devStressTxModalSurfaceOverride) {
    return devStressTxModalSurfaceOverride
  }
  return txModalSurfaceGetter?.() ?? DEFAULT_TX_MODAL_SURFACE
}

/**
 * Phase 35 — future wallet vs deployment checks (chain, signer family, etc.). **Permissive today**;
 * **`evaluateRuntimeSwapPolicy`** still invokes this so call sites stay stable when rules tighten.
 */
export function validateRuntimeWalletCompatibility(input: Readonly<{
  walletChainId: number | null
  deployment: StakingDeploymentConfig
}>): RuntimeSwapPolicyResult {
  void input
  return { allowed: true }
}

function isTxModalBlockingRuntimeSwap(surface: RuntimeSwapTxModalSurface): boolean {
  if (!surface.dialogOpen) return false
  if (surface.transactionRuntime === null) return false
  if (surface.uiPhase === null) return true
  return !TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP.has(surface.uiPhase)
}

function refreshPausedUnexpectedly(
  controller: RuntimeTransitionControllerState
): boolean {
  return (
    controller.refreshPaused &&
    controller.sequenceStage === "idle" &&
    controller.lifecycle === "stable"
  )
}

export type RuntimeSwapPolicyEvaluateInput = Readonly<{
  currentSelection: ActiveRuntimeSelection
  currentController: RuntimeTransitionControllerState
  nextDeployment: StakingDeploymentConfig
  /** When omitted, uses **`getRuntimeSwapTxModalSurfaceForPolicy()`**. */
  txModalSurface?: RuntimeSwapTxModalSurface | null
  walletChainId?: number | null
}>

/**
 * Phase 35 — pure admission control before **`executeRuntimeSwap`** mutates controller state.
 */
export function evaluateRuntimeSwapPolicy(
  input: RuntimeSwapPolicyEvaluateInput
): RuntimeSwapPolicyResult {
  const { currentSelection, currentController, nextDeployment } = input
  const txSurface = input.txModalSurface ?? getRuntimeSwapTxModalSurfaceForPolicy()

  if (isTxModalBlockingRuntimeSwap(txSurface)) {
    return { allowed: false, reason: "policy_tx_modal_active_non_terminal" }
  }

  if (!isRuntimeSwapEntryAllowed(currentController)) {
    return { allowed: false, reason: "policy_transition_not_quiescent" }
  }

  if (refreshPausedUnexpectedly(currentController)) {
    return { allowed: false, reason: "policy_refresh_state_inconsistent" }
  }

  const nextCaps = getRuntimeCapabilitiesForDeployment(nextDeployment)

  if (!isRuntimeFamilyEnabled(nextDeployment.chainFamily)) {
    return { allowed: false, reason: "policy_target_passive_reads_blocked" }
  }

  if (!nextCaps.supportsPassiveReads) {
    return { allowed: false, reason: "policy_target_passive_reads_blocked" }
  }

  if (nextDeployment.chainFamily !== "evm" && nextDeployment.chainFamily !== "tron") {
    return { allowed: false, reason: "policy_unknown_chain_family" }
  }

  const currentExecCapable = currentSelection.capabilities.supportsStakingExecution
  /**
   * Product runtime: allow leaving the executable EVM row for passive **Tron** (passive reads),
   * so the app can steady-state on Tron without policy forcing a return path through EVM.
   * Passive sibling **EVM** rows stay blocked from executable EVM — chip + token picker dedupe EVM to legacy.
   */
  if (
    currentExecCapable &&
    !isDeploymentRuntimeExecutable(nextDeployment) &&
    !(nextDeployment.chainFamily === "tron" && nextCaps.supportsPassiveReads)
  ) {
    return {
      allowed: false,
      reason: "policy_target_execution_inadequate_for_active_path",
    }
  }

  const wallet = validateRuntimeWalletCompatibility({
    walletChainId: input.walletChainId ?? null,
    deployment: nextDeployment,
  })
  if (!wallet.allowed) {
    return wallet
  }

  return { allowed: true }
}
