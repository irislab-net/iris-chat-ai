import type {
  StakingHistoryRow,
  StakingTxStatus,
  StakingTxType,
} from "@/staking/execution/stakingEtherscanHistory"
import type { StakingActiveTransactionItem } from "@/staking/tx/stakingActiveTransactionAwareness"

export type StakingOptimisticHistoryMode =
  | "hidden"
  | "active"
  | "linger-success"
  | "linger-failed"

export type StakingOptimisticHistoryBuildInput = {
  displayTransactions: readonly StakingActiveTransactionItem[]
  mode: StakingOptimisticHistoryMode
  deploymentId: string
  walletFrom: string
  vaultTo: string
  tokenSymbol: string
  submittedAtMs: number | null
  /** Stable per-hash timestamp (seconds) for ordering without flicker. */
  resolveAnchorTimestampSec: (hash: string) => number
}

function stepToTxType(
  step: StakingActiveTransactionItem["step"]
): StakingTxType {
  if (step === "approve") return "approve"
  if (step === "withdraw") return "withdraw"
  return "deposit"
}

function rowStatusForMode(mode: StakingOptimisticHistoryMode): StakingTxStatus {
  if (mode === "linger-success") return "success"
  if (mode === "linger-failed") return "failed"
  return "pending"
}

function optimisticTypeLabel(
  item: StakingActiveTransactionItem,
  status: StakingTxStatus
): string {
  const base =
    item.step === "approve"
      ? "Approval"
      : item.scenario === "withdraw"
        ? "Unstake"
        : "Stake"
  if (status === "pending") return `${base} pending`
  if (status === "success") return `${base} confirmed`
  return `${base} failed`
}

function parseAmountLabel(
  amountLabel: string,
  fallbackSymbol: string
): { amount: string | null; symbol: string } {
  const trimmed = amountLabel.trim()
  if (!trimmed) return { amount: null, symbol: fallbackSymbol }
  const match = trimmed.match(/^([\d.,]+)\s+(\S+)$/)
  if (match) return { amount: match[1], symbol: match[2] }
  return { amount: trimmed, symbol: fallbackSymbol }
}

function addressesForStep(
  step: StakingActiveTransactionItem["step"],
  walletFrom: string,
  vaultTo: string
): { from: string; to: string } {
  if (step === "withdraw") {
    return { from: vaultTo, to: walletFrom }
  }
  return { from: walletFrom, to: vaultTo }
}

export function buildOptimisticStakingHistoryRows(
  input: StakingOptimisticHistoryBuildInput
): StakingHistoryRow[] {
  if (input.mode === "hidden" || input.displayTransactions.length === 0) {
    return []
  }

  const status = rowStatusForMode(input.mode)
  const walletFrom = input.walletFrom.trim()
  const vaultTo = input.vaultTo.trim()
  const deploymentId = input.deploymentId.trim()

  return input.displayTransactions.map(item => {
    const { amount, symbol } = parseAmountLabel(
      item.amountLabel,
      input.tokenSymbol
    )
    const { from, to } = addressesForStep(item.step, walletFrom, vaultTo)
    return {
      hash: item.hash.trim(),
      type: stepToTxType(item.step),
      typeLabel: optimisticTypeLabel(item, status),
      amount,
      amountWei: null,
      feeAmountWei: null,
      symbol,
      timestamp: input.resolveAnchorTimestampSec(item.hash),
      from,
      to,
      methodId: "",
      status,
      deploymentId,
    }
  })
}

/**
 * Merge indexer rows with optimistic overlays — same hash transitions in place.
 * Indexer data wins except when indexer is still `pending` and overlay is terminal.
 */
export function mergeOptimisticStakingHistoryRows(
  indexerRows: StakingHistoryRow[],
  optimisticRows: StakingHistoryRow[]
): StakingHistoryRow[] {
  if (optimisticRows.length === 0) return indexerRows

  const byHash = new Map<string, StakingHistoryRow>()
  for (const row of indexerRows) {
    byHash.set(row.hash.toLowerCase(), row)
  }

  for (const opt of optimisticRows) {
    const key = opt.hash.toLowerCase()
    const existing = byHash.get(key)
    if (!existing) {
      byHash.set(key, opt)
      continue
    }
    if (existing.status === "pending" && opt.status !== "pending") {
      byHash.set(key, {
        ...existing,
        status: opt.status,
        typeLabel: opt.typeLabel,
        amount: existing.amount ?? opt.amount,
        symbol: existing.symbol || opt.symbol,
      })
      continue
    }
    if (existing.status === "pending" && opt.status === "pending") {
      byHash.set(key, {
        ...existing,
        typeLabel: opt.typeLabel,
        amount: existing.amount ?? opt.amount,
        symbol: existing.symbol || opt.symbol,
        timestamp: Math.max(existing.timestamp, opt.timestamp),
        deploymentId: existing.deploymentId || opt.deploymentId,
      })
    }
  }

  return Array.from(byHash.values()).sort((a, b) => b.timestamp - a.timestamp)
}
