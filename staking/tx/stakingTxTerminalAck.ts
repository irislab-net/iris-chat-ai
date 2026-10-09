/**
 * Per-hash terminal acknowledgement ledger (in-memory, session-scoped).
 * Prevents duplicate success/failure UX across receipt handlers, hydrate finalize, and polls.
 */

export function normalizeStakingTxAckHash(hash: string): string {
  return hash.trim().toLowerCase()
}

export function claimStakingTxSuccessAck(
  ledger: Set<string>,
  hash: string
): boolean {
  const h = normalizeStakingTxAckHash(hash)
  if (!h) return false
  if (ledger.has(h)) return false
  ledger.add(h)
  return true
}

export function claimStakingTxErrorAck(ledger: Set<string>, hash: string): boolean {
  const h = normalizeStakingTxAckHash(hash)
  if (!h) return false
  if (ledger.has(h)) return false
  ledger.add(h)
  return true
}

export function hasStakingTxSuccessAck(ledger: Set<string>, hash: string): boolean {
  const h = normalizeStakingTxAckHash(hash)
  return h !== "" && ledger.has(h)
}

export function hasStakingTxErrorAck(ledger: Set<string>, hash: string): boolean {
  const h = normalizeStakingTxAckHash(hash)
  return h !== "" && ledger.has(h)
}
