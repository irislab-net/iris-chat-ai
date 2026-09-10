import { describe, expect, it } from "vitest"

import {
  canUseAdvancedIntelligence,
  canUsePrediction24H,
  canUseRealTrading,
  hasCapability,
  unknownCapabilities,
} from "@/lib/entitlements/capabilities"
import { tradingAccessFromEntitlements } from "@/lib/entitlements/service"
import type { EntitlementSnapshot } from "@/lib/entitlements/types"

function snapshot(
  entitlements: EntitlementSnapshot["entitlements"],
  resolved = true
): EntitlementSnapshot {
  return {
    source: resolved ? "SERVER" : "UNAVAILABLE",
    resolved,
    entitlements,
  }
}

describe("entitlement capabilities", () => {
  it("fails closed when entitlements are unresolved", () => {
    const unresolved = snapshot([], false)
    expect(hasCapability(unresolved, "trading.real")).toBe(false)
    expect(canUseRealTrading(unresolved)).toBe(false)
    expect(canUsePrediction24H(unresolved)).toBe(false)
    expect(canUseAdvancedIntelligence(unresolved)).toBe(false)
    expect(tradingAccessFromEntitlements(unresolved)).toMatchObject({
      resolved: false,
      canUseRealTrading: false,
      canUseAdvancedIntelligence: false,
    })
  })

  it("checks active capabilities and expiration", () => {
    const now = Date.parse("2026-01-15T00:00:00.000Z")
    const active = snapshot([
      {
        capability: "trading.real",
        active: true,
        expiresAt: "2026-02-01T00:00:00.000Z",
      },
      {
        capability: "prediction.24h",
        active: true,
        expiresAt: null,
      },
    ])
    expect(hasCapability(active, "trading.real", now)).toBe(true)
    expect(hasCapability(active, "prediction.4h", now)).toBe(false)
    expect(canUsePrediction24H(active, now)).toBe(true)

    const expired = snapshot([
      {
        capability: "trading.real",
        active: true,
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
    ])
    expect(canUseRealTrading(expired, now)).toBe(false)
  })

  it("flags capabilities outside the known allow-list", () => {
    const mixed = snapshot([
      {
        capability: "trading.real",
        active: true,
        expiresAt: null,
      },
    ])
    expect(unknownCapabilities(mixed, ["prediction.24h"])).toEqual(["trading.real"])
    expect(tradingAccessFromEntitlements(mixed)).toMatchObject({
      canUseRealTrading: true,
      canExecuteTestnet: false,
      canExecuteMainnet: false,
      canUseAdvancedIntelligence: false,
    })
  })
})
