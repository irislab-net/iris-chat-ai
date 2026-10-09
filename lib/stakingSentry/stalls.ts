import { stakingSentryBreadcrumb } from "@/lib/stakingSentry/breadcrumbs"
import { captureStakingStructuredEvent } from "@/lib/stakingSentry/capture"
import { STAKING_SENTRY_EVENT } from "@/lib/stakingSentry/taxonomy"
import type { StakingStructuredContexts } from "@/lib/stakingSentry/types"

export type StakingConnectStallReportContext = Readonly<{
  blockingGate: string
  executionConnected: boolean
  walletConnected: boolean
  executionAddress: string | null
  hasProvider: boolean
  hasSigner: boolean
  signerResolved: boolean
  activeDeploymentId: string
  runtimeKey: string
  runtimeHydrationEnabled: boolean
  vaultDataReady: boolean
  wrongNetwork: boolean
  reconnecting: boolean
  chainFamily: string
  walletVendor: string
  visibilityState: string
  userAgent: string
  isMobileUa: boolean
  appKitAccountStatus: string | null
  appKitCaipNetwork: string | null
  appKitChainId: string | number | null
  uiLoadingReason: string
  transitionLifecycle: string | null
  refreshPaused: boolean
  balancesFetched: boolean
  tokenMetaFetched: boolean
  canTransact: boolean
  awaitingSigner: boolean
  evmSignerPhase: string | null
  connectIntent: string | null
}>

export type StakingTxSignatureStallReportContext = Readonly<{
  txScenario: string
  signerResolved: boolean
  providerPresent: boolean
  hasSignerCapability: boolean
  executionConnected: boolean
  executionAddress: string | null
  visibilityState: string
  awaitingSignatureDurationMs: number
  appKitAccountStatus: string | null
  uiPhase: string | null
  dialogOpen: boolean
  preparingTransaction: boolean
  approveWirePhase: string
  depositWirePhase: string
  withdrawWirePhase: string
  walletVendor: string
  userAgent: string
  isMobileUa: boolean
  vaultLoading: boolean
}>

export type StakingVaultTxLoadingStallContext = Readonly<{
  durationMs: number
  activeDeploymentId: string
  runtimeKey: string
  chainFamily: string
  awaitingSigner: boolean
  canTransact: boolean
  vaultDataReady: boolean
  executionConnected: boolean
  hasSigner: boolean
  transitionLifecycle: string | null
  refreshPaused: boolean
  visibilityState: string
  isMobileUa: boolean
}>

function connectStallContexts(
  ctx: StakingConnectStallReportContext
): StakingStructuredContexts {
  return {
    staking_runtime: {
      runtime_key: ctx.runtimeKey,
      deployment_id: ctx.activeDeploymentId,
      chain_family: ctx.chainFamily,
      runtime_hydration_enabled: ctx.runtimeHydrationEnabled,
      transition_lifecycle: ctx.transitionLifecycle,
      refresh_paused: ctx.refreshPaused,
    },
    staking_wallet: {
      wallet_vendor: ctx.walletVendor,
      has_provider: ctx.hasProvider,
      has_signer: ctx.hasSigner,
      signer_resolved: ctx.signerResolved,
      evm_signer_phase: ctx.evmSignerPhase,
      connect_intent: ctx.connectIntent,
      appkit_account_status: ctx.appKitAccountStatus,
    },
    staking_visibility: {
      visibility_state: ctx.visibilityState,
      is_mobile_ua: ctx.isMobileUa,
    },
  }
}

/** One structured stall report per gate + deployment + runtime per session. */
export function captureStakingConnectStall(
  context: StakingConnectStallReportContext,
  dedupeKey: string
): void {
  stakingSentryBreadcrumb("connect_stalled", {
    blocking_gate: context.blockingGate,
    wallet_vendor: context.walletVendor,
    has_signer: context.hasSigner,
  })

  captureStakingStructuredEvent({
    event: STAKING_SENTRY_EVENT.runtime.connect_stalled,
    level: "warning",
    message: `${STAKING_SENTRY_EVENT.runtime.connect_stalled}:${context.blockingGate}`,
    dedupeKey,
    tags: {
      blocking_gate: context.blockingGate,
      wallet_vendor: context.walletVendor,
      chain_family: context.chainFamily,
      deployment_id: context.activeDeploymentId,
      runtime_key: context.runtimeKey,
      wrong_network: context.wrongNetwork ? "true" : "false",
      execution_connected: context.executionConnected ? "true" : "false",
      runtime_hydration: context.runtimeHydrationEnabled ? "enabled" : "disabled",
      signer_state: context.hasSigner ? "resolved" : "missing",
    },
    contexts: {
      ...connectStallContexts(context),
      staking_network: {
        wrong_network: context.wrongNetwork,
        reconnecting: context.reconnecting,
        appkit_caip_network: context.appKitCaipNetwork,
        appkit_chain_id:
          context.appKitChainId != null ? String(context.appKitChainId) : null,
      },
    },
    fingerprint: [
      STAKING_SENTRY_EVENT.runtime.connect_stalled,
      context.blockingGate,
      context.activeDeploymentId,
    ],
  })
}

/** Mobile: tx modal stuck in awaiting_signature without wallet prompt. */
export function captureStakingTxSignatureStall(
  context: StakingTxSignatureStallReportContext,
  dedupeKey: string
): void {
  stakingSentryBreadcrumb("runtime_deadlock_detected", {
    kind: "tx_signature_stall",
    tx_scenario: context.txScenario,
    duration_ms: context.awaitingSignatureDurationMs,
  })

  captureStakingStructuredEvent({
    event: STAKING_SENTRY_EVENT.tx.awaiting_signature_stalled,
    level: "warning",
    message: `${STAKING_SENTRY_EVENT.tx.awaiting_signature_stalled}:${context.txScenario}`,
    dedupeKey,
    tags: {
      tx_scenario: context.txScenario,
      wallet_vendor: context.walletVendor,
      ui_phase: context.uiPhase,
      signer_state: context.signerResolved ? "resolved" : "missing",
    },
    contexts: {
      staking_tx: {
        tx_scenario: context.txScenario,
        awaiting_signature_duration_ms: context.awaitingSignatureDurationMs,
        dialog_open: context.dialogOpen,
        preparing_transaction: context.preparingTransaction,
        approve_wire_phase: context.approveWirePhase,
        deposit_wire_phase: context.depositWirePhase,
        withdraw_wire_phase: context.withdrawWirePhase,
        vault_loading: context.vaultLoading,
      },
      staking_wallet: {
        provider_present: context.providerPresent,
        execution_connected: context.executionConnected,
        appkit_account_status: context.appKitAccountStatus,
      },
      staking_visibility: {
        visibility_state: context.visibilityState,
        is_mobile_ua: context.isMobileUa,
      },
    },
    fingerprint: [
      STAKING_SENTRY_EVENT.tx.awaiting_signature_stalled,
      context.txScenario,
      context.walletVendor,
    ],
  })
}

/** vault_tx_loading gate held beyond threshold — dependency visibility for connect stalls. */
export function captureStakingVaultTxLoadingStall(
  context: StakingVaultTxLoadingStallContext,
  dedupeKey: string
): void {
  stakingSentryBreadcrumb("runtime_deadlock_detected", {
    kind: "vault_tx_loading",
    duration_ms: context.durationMs,
  })

  captureStakingStructuredEvent({
    event: STAKING_SENTRY_EVENT.runtime.vault_tx_loading_stalled,
    level: "warning",
    message: STAKING_SENTRY_EVENT.runtime.vault_tx_loading_stalled,
    dedupeKey,
    tags: {
      blocking_gate: "vault_tx_loading",
      deployment_id: context.activeDeploymentId,
      runtime_key: context.runtimeKey,
      chain_family: context.chainFamily,
      signer_state: context.hasSigner ? "resolved" : "missing",
    },
    contexts: {
      staking_runtime: {
        runtime_key: context.runtimeKey,
        deployment_id: context.activeDeploymentId,
        transition_lifecycle: context.transitionLifecycle,
        refresh_paused: context.refreshPaused,
        duration_ms: context.durationMs,
      },
      staking_tx: {
        vault_tx_loading: true,
        awaiting_signer: context.awaitingSigner,
        can_transact: context.canTransact,
        vault_data_ready: context.vaultDataReady,
      },
      staking_visibility: {
        visibility_state: context.visibilityState,
        is_mobile_ua: context.isMobileUa,
      },
    },
    fingerprint: [
      STAKING_SENTRY_EVENT.runtime.vault_tx_loading_stalled,
      context.activeDeploymentId,
      context.runtimeKey,
    ],
  })
}
