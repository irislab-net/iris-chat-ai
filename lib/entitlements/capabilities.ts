import type { Capability, EntitlementRecord, EntitlementSnapshot } from "@/lib/entitlements/types"

export const KNOWN_CAPABILITIES = [
  "prediction.24h",
  "prediction.4h",
  "prediction.1m",
  "trading.real",
  "trading.testnet.execute",
  "trading.mainnet.execute",
  "intelligence.advanced",
] as const satisfies readonly Capability[]

function entitlementIndex(
  snapshot: EntitlementSnapshot
): Map<Capability, EntitlementRecord> {
  return new Map(snapshot.entitlements.map((entry) => [entry.capability, entry]))
}

export function hasCapability(
  snapshot: EntitlementSnapshot,
  capability: Capability,
  now = Date.now()
): boolean {
  if (!snapshot.resolved) return false
  const record = entitlementIndex(snapshot).get(capability)
  if (!record?.active) return false
  if (record.expiresAt == null) return true
  return new Date(record.expiresAt).getTime() > now
}

export function canUsePrediction24H(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "prediction.24h", now)
}

export function canUsePrediction4H(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "prediction.4h", now)
}

export function canUsePrediction1M(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "prediction.1m", now)
}

export function canUseRealTrading(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "trading.real", now)
}

export function canExecuteTestnet(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "trading.testnet.execute", now)
}

export function canExecuteMainnet(snapshot: EntitlementSnapshot, now?: number): boolean {
  return hasCapability(snapshot, "trading.mainnet.execute", now)
}

export function canUseAdvancedIntelligence(
  snapshot: EntitlementSnapshot,
  now?: number
): boolean {
  return hasCapability(snapshot, "intelligence.advanced", now)
}

export function unknownCapabilities(
  snapshot: EntitlementSnapshot,
  allowed: readonly Capability[] = KNOWN_CAPABILITIES
): Capability[] {
  const allowedSet = new Set(allowed)
  return snapshot.entitlements
    .map((entry) => entry.capability)
    .filter((capability) => !allowedSet.has(capability))
}
