import { useEffect, useRef } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import type { Provider } from "@reown/appkit-adapter-ethers"
import { captureStakingTxSignatureStall } from "@/lib/stakingSentryObservability"
import { walletDeepLinkTelemetry } from "@/lib/wallet/walletDeepLinkTelemetry"
import { notifyWalletConnectSignatureStall } from "@/lib/wallet/walletConnectSignatureStallBridge"
import {
  inferStakingWalletVendor,
  readStakingConnectStallEnvironment,
} from "@/staking/diagnostics/stakingConnectStallLogic"
import {
  isWalletHandoffLikely,
} from "@/staking/orchestration/stakingMobileResumeCoordinator"
import { registerStakingTxWalletDispatchListener } from "@/staking/tx/stakingTxWalletDispatchBridge"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"

export const STAKING_TX_SIGNATURE_STALL_THRESHOLD_MS = 15_000

/** After wallet return, wait for provider promise / tx hash before treating as stall. */
export const STAKING_TX_POST_RETURN_STALL_GRACE_MS = 15_000

/** Extra wait when Safari never emitted `visibilitychange(hidden)` before firing. */
const STALL_NO_HANDOFF_RECHECK_MS = 8_000

function wirePhaseIndicatesWalletDispatched(
  phase: string | undefined
): boolean {
  return phase === "submitted" || phase === "confirming"
}

export function snapshotIndicatesWalletRequestDispatched(
  snapshot: TransactionStatusSnapshot
): boolean {
  const hash =
    snapshot.depositTxHash?.trim() ||
    snapshot.withdrawTxHash?.trim() ||
    snapshot.approveTxHash?.trim() ||
    snapshot.txHash?.trim() ||
    ""
  if (hash) return true

  if (
    snapshot.uiPhase === "submitted" ||
    snapshot.uiPhase === "confirming" ||
    snapshot.uiPhase === "success"
  ) {
    return true
  }

  return (
    wirePhaseIndicatesWalletDispatched(snapshot.approveWirePhase) ||
    wirePhaseIndicatesWalletDispatched(snapshot.depositWirePhase) ||
    wirePhaseIndicatesWalletDispatched(snapshot.withdrawWirePhase)
  )
}

export function isSignatureStallRecoveryStillApplicable(input: Readonly<{
  snapshot: TransactionStatusSnapshot
  vaultLoading: boolean
}>): boolean {
  const s = input.snapshot
  if (!s.dialogOpen || s.uiPhase !== "awaiting_signature" || s.scenario == null) {
    return false
  }
  if (snapshotIndicatesWalletRequestDispatched(s)) return false
  // vault.loading stays true for the entire deposit()/approve() signer window
  // (including pre-send RPC). Do not suppress stall recovery while awaiting dispatch.
  if (isWalletHandoffLikely()) return false
  return true
}

export function useStakingTxSignatureStallWatchdog(input: Readonly<{
  readSnapshot: () => TransactionStatusSnapshot
  executionConnected: boolean
  executionAddress: string | null | undefined
  awaitingSigner: boolean
  canTransact: boolean
  loading: boolean
}>): void {
  const { walletProvider } = useAppKitProvider<Provider>("eip155")
  const { status: appKitAccountStatus } = useAppKitAccount({ namespace: "eip155" })

  const armedRef = useRef<string | null>(null)
  const enteredAtRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const walletLeftPageRef = useRef(false)
  const dispatchListenerRef = useRef<(() => void) | null>(null)
  const inputRef = useRef(input)
  inputRef.current = input
  const appKitAccountStatusRef = useRef(appKitAccountStatus)
  appKitAccountStatusRef.current = appKitAccountStatus

  const snap = input.readSnapshot()
  const uiPhase = snap.uiPhase
  const dialogOpen = snap.dialogOpen
  const scenario = snap.scenario
  const armKey =
    dialogOpen && uiPhase === "awaiting_signature" && scenario != null
      ? `${scenario}:${uiPhase}`
      : null

  useEffect(() => {
    const clearTimers = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (recheckTimerRef.current != null) {
        clearTimeout(recheckTimerRef.current)
        recheckTimerRef.current = null
      }
    }

    const disarm = () => {
      clearTimers()
      armedRef.current = null
      enteredAtRef.current = null
      dispatchListenerRef.current = null
    }

    const markHandoff = () => {
      walletLeftPageRef.current = true
    }

    if (armKey == null) {
      walletLeftPageRef.current = false
      disarm()
      return disarm
    }

    const env = readStakingConnectStallEnvironment()
    if (!env.isMobileUa) {
      walletLeftPageRef.current = false
      disarm()
      return disarm
    }

    if (armedRef.current === armKey) {
      return () => {}
    }

    disarm()
    armedRef.current = armKey

    const readInput = () => inputRef.current

    const emitStallTelemetry = (durationMs: number, live: TransactionStatusSnapshot) => {
      const cur = readInput()
      const txHash =
        live.depositTxHash?.trim() ||
        live.withdrawTxHash?.trim() ||
        live.approveTxHash?.trim() ||
        ""

      const dedupeKey = `signature_stall:${live.scenario ?? "unknown"}:${txHash || "no_hash"}`

      captureStakingTxSignatureStall(
        {
          txScenario: live.scenario ?? "unknown",
          signerResolved: Boolean(!cur.awaitingSigner && cur.canTransact),
          providerPresent: Boolean(walletProvider),
          hasSignerCapability: cur.canTransact,
          executionConnected: cur.executionConnected,
          executionAddress: cur.executionAddress?.trim() ?? null,
          visibilityState: env.visibilityState,
          awaitingSignatureDurationMs: durationMs,
          appKitAccountStatus: appKitAccountStatusRef.current ?? null,
          uiPhase: live.uiPhase ?? null,
          dialogOpen: live.dialogOpen,
          preparingTransaction: live.preparingTransaction,
          approveWirePhase: live.approveWirePhase,
          depositWirePhase: live.depositWirePhase,
          withdrawWirePhase: live.withdrawWirePhase,
          walletVendor: inferStakingWalletVendor(),
          userAgent: env.userAgent,
          isMobileUa: env.isMobileUa,
          vaultLoading: cur.loading,
        },
        dedupeKey
      )
    }

    const maybeNotifyStallRecovery = (
      durationMs: number,
      walletLeftPage: boolean
    ): boolean => {
      const cur = readInput()
      const live = cur.readSnapshot()
      if (
        !isSignatureStallRecoveryStillApplicable({
          snapshot: live,
          vaultLoading: cur.loading,
        })
      ) {
        return false
      }

      walletDeepLinkTelemetry("wallet_request_timeout", {
        scenario: live.scenario ?? "unknown",
        duration_ms: durationMs,
      })
      traceMobileStakingFlow("signature_stall_recovery_fired", {
        scenario: live.scenario ?? "unknown",
        durationMs,
        walletLeftPage,
        approveTxHash: live.approveTxHash,
        depositTxHash: live.depositTxHash,
      })
      notifyWalletConnectSignatureStall({
        scenario: live.scenario ?? "unknown",
        durationMs,
        walletLeftPage,
      })
      emitStallTelemetry(durationMs, live)
      return true
    }

    const onPrimaryTimer = () => {
      timerRef.current = null
      armedRef.current = null
      const enteredAt = enteredAtRef.current ?? Date.now()
      enteredAtRef.current = null
      const durationMs = Date.now() - enteredAt

      const cur = readInput()
      const live = cur.readSnapshot()
      if (
        !isSignatureStallRecoveryStillApplicable({
          snapshot: live,
          vaultLoading: cur.loading,
        })
      ) {
        return
      }

      recheckTimerRef.current = setTimeout(() => {
        recheckTimerRef.current = null
        const handoffSeen = walletLeftPageRef.current
        maybeNotifyStallRecovery(
          durationMs + STALL_NO_HANDOFF_RECHECK_MS,
          handoffSeen
        )
      }, STALL_NO_HANDOFF_RECHECK_MS)
    }

    const armDispatchStallTimer = () => {
      if (timerRef.current != null) return
      enteredAtRef.current = Date.now()
      timerRef.current = setTimeout(onPrimaryTimer, STAKING_TX_SIGNATURE_STALL_THRESHOLD_MS)
    }

    dispatchListenerRef.current = armDispatchStallTimer
    const unregisterDispatch = registerStakingTxWalletDispatchListener(
      armDispatchStallTimer
    )
    armDispatchStallTimer()

    /** Wallet return is normal — re-arm stall timer; do not fail while WC promise may resolve. */
    const deferStallEvaluationAfterWalletReturn = (source: string) => {
      const cur = readInput()
      const live = cur.readSnapshot()
      if (
        !live.dialogOpen ||
        live.uiPhase !== "awaiting_signature" ||
        snapshotIndicatesWalletRequestDispatched(live)
      ) {
        return
      }
      clearTimers()
      enteredAtRef.current = Date.now()
      armedRef.current = armKey
      traceMobileStakingFlow("signature_stall_deferred_after_wallet_return", {
        source,
        graceMs: STAKING_TX_POST_RETURN_STALL_GRACE_MS,
        submissionId: live.submissionId,
      })
      timerRef.current = setTimeout(
        onPrimaryTimer,
        STAKING_TX_POST_RETURN_STALL_GRACE_MS
      )
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        markHandoff()
        return
      }
      if (document.visibilityState === "visible") {
        deferStallEvaluationAfterWalletReturn("visibilitychange_visible")
      }
    }

    const onPageHide = () => {
      markHandoff()
    }

    const onPageShow = () => {
      if (document.visibilityState === "visible") {
        deferStallEvaluationAfterWalletReturn("pageshow")
      }
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      unregisterDispatch()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onPageShow)
      disarm()
    }
  }, [armKey, walletProvider])
}
