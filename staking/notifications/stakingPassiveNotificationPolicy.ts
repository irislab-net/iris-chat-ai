/**
 * Passive / system staking notifications (Phase 3): canonical dedupe ids + cooldown helpers.
 * Transaction receipt toasts (Phases 1–2) stay in `TransactionStatusProvider` — do not route here.
 */

import { createStakingToastDedupeKey } from "@/staking/ui/stakingToast"

/** Single Sonner ownership for wrong-chain passive alerts (vault + surfaces). */
export function stakingPassiveWrongNetworkDedupeId(): string {
  return createStakingToastDedupeKey("network", "wrong_chain")
}

/** Token / RPC metadata load failures (EVM + Tron passive reads). */
export function stakingPassiveRpcMetaDedupeId(): string {
  return createStakingToastDedupeKey("vault", "rpc_meta")
}

/** Min delay between RPC-meta passive error toasts (reconnect / retry storms). */
export const STAKING_PASSIVE_RPC_META_MIN_INTERVAL_MS = 26_000

/** Min delay between indexer activity passive error toasts (any distinct key). */
export const STAKING_PASSIVE_INDEXER_MIN_INTERVAL_MS = 14_000

/** Min delay between affiliate list passive error toasts. */
export const STAKING_PASSIVE_AFFILIATE_MIN_INTERVAL_MS = 14_000

/** Pure — callers store `lastEmitMs` in a ref and assign on successful emit. */
export function stakingPassiveMinIntervalElapsed(
  nowMs: number,
  lastEmitMs: number | null,
  minIntervalMs: number
): boolean {
  if (lastEmitMs == null) return true
  return nowMs - lastEmitMs >= minIntervalMs
}
