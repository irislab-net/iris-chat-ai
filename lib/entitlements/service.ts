import { apiJson } from "@/lib/api/client"
import {
  canExecuteMainnet,
  canExecuteTestnet,
  canUseAdvancedIntelligence,
  canUsePrediction1M,
  canUsePrediction24H,
  canUsePrediction4H,
  canUseRealTrading,
  KNOWN_CAPABILITIES,
} from "@/lib/entitlements/capabilities"
import type {
  Capability,
  EntitlementRecord,
  EntitlementSnapshot,
  EntitlementsApiResponse,
} from "@/lib/entitlements/types"
import type { TradingAccess } from "@/lib/trading/access"

const KNOWN_CAPABILITY_SET = new Set<Capability>(KNOWN_CAPABILITIES)

function unwrapEntitlements(body: unknown): EntitlementRecord[] {
  if (!body || typeof body !== "object") return []
  const record = body as Record<string, unknown>
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record
  const list = data.entitlements
  if (!Array.isArray(list)) return []
  return list
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const value = entry as Record<string, unknown>
      const capability = String(value.capability) as Capability
      if (!KNOWN_CAPABILITY_SET.has(capability)) return null
      return {
        capability,
        active: value.active === true,
        expiresAt: (value.expiresAt ?? value.expires_at ?? null) as string | null,
      } satisfies EntitlementRecord
    })
    .filter((entry): entry is EntitlementRecord => entry != null)
}

let entitlementsInFlight: Promise<EntitlementSnapshot> | null = null

export async function fetchEntitlements(): Promise<EntitlementSnapshot> {
  if (entitlementsInFlight) return entitlementsInFlight

  entitlementsInFlight = (async () => {
    try {
      const body = await apiJson<EntitlementsApiResponse | Record<string, unknown>>(
        "/v1/entitlements"
      )
      return {
        source: "SERVER",
        resolved: true,
        entitlements: unwrapEntitlements(body),
      }
    } catch {
      return {
        source: "UNAVAILABLE",
        resolved: false,
        entitlements: [],
      }
    } finally {
      entitlementsInFlight = null
    }
  })()

  return entitlementsInFlight
}

export function tradingAccessFromEntitlements(
  snapshot: EntitlementSnapshot
): TradingAccess {
  return {
    source: snapshot.source === "SERVER" ? "SERVER" : "UNAVAILABLE",
    resolved: snapshot.resolved,
    canUseRealTrading: canUseRealTrading(snapshot),
    canExecuteTestnet: canExecuteTestnet(snapshot),
    canExecuteMainnet: canExecuteMainnet(snapshot),
    canUsePrediction24H: canUsePrediction24H(snapshot),
    canUsePrediction4H: canUsePrediction4H(snapshot),
    canUsePrediction1M: canUsePrediction1M(snapshot),
    canUseAdvancedIntelligence: canUseAdvancedIntelligence(snapshot),
  }
}
