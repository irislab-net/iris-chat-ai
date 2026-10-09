import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import type { TransactionWireStepPhase } from "@/staking/tx/types/transactionStatusWirePhase"
import { deriveCurrentTxHashFromSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"

export type StakingActiveTransactionStep = "approve" | "deposit" | "withdraw"

export type StakingActiveTransactionItem = {
  hash: string
  scenario: TransactionStatusScenario
  step: StakingActiveTransactionStep
  phase: "submitted" | "confirming"
  amountLabel: string
}

export type StakingActiveTransactionAwareness = {
  hasActiveTransactions: boolean
  activeTransactionCount: number
  activeTransactions: readonly StakingActiveTransactionItem[]
  latestActiveTransaction: StakingActiveTransactionItem | null
}

const EMPTY_AWARENESS: StakingActiveTransactionAwareness = {
  hasActiveTransactions: false,
  activeTransactionCount: 0,
  activeTransactions: [],
  latestActiveTransaction: null,
}

function wirePhaseToReceiptPhase(
  wire: TransactionWireStepPhase
): "submitted" | "confirming" | null {
  if (wire === "submitted") return "submitted"
  if (wire === "confirming") return "confirming"
  return null
}

function pushActiveWire(
  items: StakingActiveTransactionItem[],
  seen: Set<string>,
  input: {
    scenario: TransactionStatusScenario
    step: StakingActiveTransactionStep
    wirePhase: TransactionWireStepPhase
    hash: string | null | undefined
    amountLabel: string
  }
): void {
  const phase = wirePhaseToReceiptPhase(input.wirePhase)
  const hash = input.hash?.trim() ?? ""
  if (!phase || !hash) return
  const key = hash.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  items.push({
    hash,
    scenario: input.scenario,
    step: input.step,
    phase,
    amountLabel: input.amountLabel,
  })
}

function sortActiveTransactions(
  items: StakingActiveTransactionItem[]
): StakingActiveTransactionItem[] {
  const phaseRank = (p: "submitted" | "confirming") => (p === "confirming" ? 1 : 0)
  const stepRank = (step: StakingActiveTransactionStep) =>
    step === "deposit" || step === "withdraw" ? 1 : 0
  return [...items].sort(
    (a, b) =>
      phaseRank(b.phase) - phaseRank(a.phase) ||
      stepRank(b.step) - stepRank(a.step)
  )
}

/**
 * Canonical active staking tx list for ambient UX (modal open, detached, or both).
 * Source of truth: `TransactionStatusProvider` snapshot wires + `uiPhase`.
 */
export function deriveStakingActiveTransactionAwareness(
  snapshot: TransactionStatusSnapshot
): StakingActiveTransactionAwareness {
  const scenario = snapshot.scenario
  if (!scenario) return EMPTY_AWARENESS

  const items: StakingActiveTransactionItem[] = []
  const seen = new Set<string>()
  const amountLabel = snapshot.amountLabel

  if (scenario === "deposit") {
    pushActiveWire(items, seen, {
      scenario,
      step: "approve",
      wirePhase: snapshot.approveWirePhase,
      hash: snapshot.approveTxHash,
      amountLabel,
    })
    pushActiveWire(items, seen, {
      scenario,
      step: "deposit",
      wirePhase: snapshot.depositWirePhase,
      hash: snapshot.depositTxHash,
      amountLabel,
    })
  } else if (scenario === "withdraw") {
    pushActiveWire(items, seen, {
      scenario,
      step: "withdraw",
      wirePhase: snapshot.withdrawWirePhase,
      hash: snapshot.withdrawTxHash,
      amountLabel,
    })
  }

  const uiAwaitingReceipt =
    snapshot.uiPhase === "submitted" || snapshot.uiPhase === "confirming"

  if (uiAwaitingReceipt && items.length === 0) {
    const hash = deriveCurrentTxHashFromSnapshot(snapshot)
    if (hash) {
      const step: StakingActiveTransactionStep =
        scenario === "withdraw"
          ? "withdraw"
          : snapshot.depositTxHash?.trim()
            ? "deposit"
            : "approve"
      const key = hash.toLowerCase()
      const phase = snapshot.uiPhase
      if (
        !seen.has(key) &&
        (phase === "submitted" || phase === "confirming")
      ) {
        items.push({
          hash,
          scenario,
          step,
          phase,
          amountLabel,
        })
      }
    }
  }

  if (items.length === 0) return EMPTY_AWARENESS

  const sorted = sortActiveTransactions(items)
  return {
    hasActiveTransactions: true,
    activeTransactionCount: sorted.length,
    activeTransactions: sorted,
    latestActiveTransaction: sorted[0] ?? null,
  }
}

export function stakingActiveTxAmbientCountLabel(count: number): string {
  if (count <= 0) return ""
  if (count === 1) return "1 transaction processing"
  return `${count} transactions processing`
}

export function stakingActiveTxHistoryHeadline(
  latest: StakingActiveTransactionItem | null,
  count: number
): string {
  if (!latest) return ""
  if (count > 1) return `${count} pending transactions`
  if (latest.scenario === "deposit") {
    return latest.phase === "confirming"
      ? "Deposit confirming"
      : "Deposit processing"
  }
  return latest.phase === "confirming"
    ? "Withdrawal confirming"
    : "Withdrawal processing"
}

export function stakingActiveTxAmbientPillLabel(
  latest: StakingActiveTransactionItem | null
): string {
  if (!latest) return ""
  return stakingActiveTxRowLabel(latest)
}

/** Per-row label for stacked / expandable ambient lists. */
export function stakingActiveTxRowLabel(item: StakingActiveTransactionItem): string {
  if (item.scenario === "deposit") {
    if (item.step === "approve") {
      return item.phase === "confirming"
        ? "Approval confirming…"
        : "Approval processing…"
    }
    return item.phase === "confirming"
      ? "Deposit confirming…"
      : "Deposit processing…"
  }
  return item.phase === "confirming"
    ? "Withdrawal confirming…"
    : "Withdrawal processing…"
}

export function shortenStakingTxHash(hash: string): string {
  const t = hash.trim()
  if (t.length <= 12) return t
  return `${t.slice(0, 6)}…${t.slice(-4)}`
}

export function stakingActiveTxLingerSuccessLabel(
  count: number
): string {
  if (count <= 1) return "Transaction confirmed"
  return `${count} transactions confirmed`
}

export function stakingActiveTxLingerFailedLabel(count: number): string {
  if (count <= 1) return "Transaction failed"
  return `${count} transactions failed`
}
