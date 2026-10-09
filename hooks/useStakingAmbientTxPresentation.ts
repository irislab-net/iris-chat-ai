import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import {
  deriveStakingActiveTransactionAwareness,
  type StakingActiveTransactionAwareness,
  type StakingActiveTransactionItem,
} from "@/staking/tx/stakingActiveTransactionAwareness"
import { deriveCurrentTxHashFromSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/** Presentation-only terminal linger (does not delay provider cleanup). */
export const STAKING_AMBIENT_TERMINAL_LINGER_MS = 3_200
export const STAKING_AMBIENT_TERMINAL_FADE_MS = 420

export type StakingAmbientDisplayMode =
  | "hidden"
  | "active"
  | "linger-success"
  | "linger-failed"

export type StakingAmbientPresentation = StakingActiveTransactionAwareness & {
  mode: StakingAmbientDisplayMode
  /** Whether any ambient chrome should render (active or lingering). */
  isVisible: boolean
  /** Terminal linger fade-out in progress. */
  isFading: boolean
  /** Rows to show (active list or last-known list during linger). */
  displayTransactions: readonly StakingActiveTransactionItem[]
}

type LingerState = {
  outcome: "success" | "failed"
  items: readonly StakingActiveTransactionItem[]
}

function snapshotTerminalOutcome(
  snap: TransactionStatusSnapshot
): "success" | "failed" | null {
  if (snap.uiPhase === "confirmed" || snap.uiPhase === "success") return "success"
  if (snap.uiPhase === "failed" || snap.uiPhase === "error") return "failed"
  return null
}

function itemsFromTerminalSnapshot(
  snap: TransactionStatusSnapshot
): readonly StakingActiveTransactionItem[] {
  const active = deriveStakingActiveTransactionAwareness(snap)
  if (active.activeTransactions.length > 0) return active.activeTransactions
  const hash = deriveCurrentTxHashFromSnapshot(snap)
  if (!hash || !snap.scenario) return []
  const phase =
    snap.uiPhase === "submitted" || snap.uiPhase === "confirming"
      ? snap.uiPhase
      : "confirming"
  return [
    {
      hash,
      scenario: snap.scenario,
      step:
        snap.scenario === "withdraw"
          ? "withdraw"
          : snap.depositTxHash?.trim()
            ? "deposit"
            : "approve",
      phase,
      amountLabel: snap.amountLabel,
    },
  ]
}

/**
 * Ambient presentation state — mount once via `StakingAmbientTxPresentationProvider`.
 * Subscribes to provider snapshot only; does not mutate lifecycle.
 */
export function useStakingAmbientTxPresentationState(): StakingAmbientPresentation {
  const { snapshot } = useTransactionStatus()
  const awareness = useMemo(
    () => deriveStakingActiveTransactionAwareness(snapshot),
    [snapshot]
  )

  const [linger, setLinger] = useState<LingerState | null>(null)
  const [isFading, setIsFading] = useState(false)
  const lingerRef = useRef<LingerState | null>(null)
  const prevSnapshotRef = useRef(snapshot)
  const prevAwarenessRef = useRef(awareness)
  const lingerTimerRef = useRef<number | null>(null)
  const fadeTimerRef = useRef<number | null>(null)
  lingerRef.current = linger

  const clearLingerTimers = useCallback(() => {
    if (lingerTimerRef.current !== null) {
      window.clearTimeout(lingerTimerRef.current)
      lingerTimerRef.current = null
    }
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  const startLinger = useCallback(
    (outcome: "success" | "failed", items: readonly StakingActiveTransactionItem[]) => {
      if (items.length === 0) return
      clearLingerTimers()
      setIsFading(false)
      setLinger({ outcome, items })
      lingerTimerRef.current = window.setTimeout(() => {
        lingerTimerRef.current = null
        setIsFading(true)
        fadeTimerRef.current = window.setTimeout(() => {
          fadeTimerRef.current = null
          setLinger(null)
          setIsFading(false)
        }, STAKING_AMBIENT_TERMINAL_FADE_MS)
      }, STAKING_AMBIENT_TERMINAL_LINGER_MS)
    },
    [clearLingerTimers]
  )

  useEffect(() => {
    const prevSnap = prevSnapshotRef.current
    const prevAwareness = prevAwarenessRef.current
    const terminal = snapshotTerminalOutcome(snapshot)
    const prevTerminal = snapshotTerminalOutcome(prevSnap)

    if (terminal && terminal !== prevTerminal) {
      startLinger(terminal, itemsFromTerminalSnapshot(snapshot))
    }

    if (
      prevAwareness.hasActiveTransactions &&
      !awareness.hasActiveTransactions &&
      !terminal
    ) {
      const inferred: "success" | "failed" =
        prevSnap.uiPhase === "failed" || prevSnap.uiPhase === "error"
          ? "failed"
          : "success"
      const items =
        prevAwareness.activeTransactions.length > 0
          ? prevAwareness.activeTransactions
          : itemsFromTerminalSnapshot(prevSnap)
      startLinger(inferred, items)
    }

    if (awareness.hasActiveTransactions && lingerRef.current) {
      clearLingerTimers()
      setLinger(null)
      setIsFading(false)
    }

    prevSnapshotRef.current = snapshot
    prevAwarenessRef.current = awareness
  }, [snapshot, awareness, startLinger, clearLingerTimers])

  useEffect(() => () => clearLingerTimers(), [clearLingerTimers])

  const mode: StakingAmbientDisplayMode = useMemo(() => {
    if (awareness.hasActiveTransactions) return "active"
    if (linger?.outcome === "success") return "linger-success"
    if (linger?.outcome === "failed") return "linger-failed"
    return "hidden"
  }, [awareness.hasActiveTransactions, linger])

  const displayTransactions = useMemo(() => {
    if (awareness.hasActiveTransactions) return awareness.activeTransactions
    if (linger) return linger.items
    return []
  }, [awareness.hasActiveTransactions, awareness.activeTransactions, linger])

  const isVisible = mode !== "hidden"

  return {
    ...awareness,
    mode,
    isVisible,
    isFading,
    displayTransactions,
    latestActiveTransaction:
      displayTransactions[0] ?? awareness.latestActiveTransaction,
    activeTransactionCount: displayTransactions.length,
    hasActiveTransactions: awareness.hasActiveTransactions,
    activeTransactions: awareness.activeTransactions,
  }
}
