/**
 * Paper instrument metadata — max leverage sourced from Hyperliquid `meta`
 * when available. Isolated module so leverage constants are not scattered.
 *
 * TIERED_MARGIN_NOT_MODELED — Hyperliquid margin tables / tiers are not
 * implemented in V2.2. Maintenance uses the simple max-leverage formula.
 */

import { hyperliquidCoin } from "@/lib/api/candles"

const HL_INFO = "https://api.hyperliquid.xyz/info"

/**
 * Offline / pre-fetch fallbacks from last-known HL meta shapes.
 * Used ONLY when the live meta cache has no entry — not a claim of live parity.
 */
const FALLBACK_MAX_LEVERAGE: Record<string, number> = {
  BTC: 40,
  ETH: 25,
  SOL: 20,
  PAXG: 20,
}

/** Safe default when coin is unknown and meta missing. */
export const PAPER_DEFAULT_MAX_LEVERAGE = 5

/** Migration / open default when no leverage stored. */
export const PAPER_DEFAULT_LEVERAGE = 1

/** Documented V2.2 limitation. */
export const TIERED_MARGIN_NOT_MODELED = true as const

const maxLeverageCache = new Map<string, number>()
let testOverride: Map<string, number> | null = null

function coinKey(symbol: string): string {
  return (
    hyperliquidCoin(symbol) ??
    symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  )
}

/** Sync max leverage for a paper symbol. Prefer cache → fallback → default. */
export function getMaxLeverage(symbol: string): number {
  const key = coinKey(symbol)
  if (!key) return PAPER_DEFAULT_MAX_LEVERAGE
  if (testOverride?.has(key)) return testOverride.get(key)!
  if (maxLeverageCache.has(key)) return maxLeverageCache.get(key)!
  if (FALLBACK_MAX_LEVERAGE[key] != null) return FALLBACK_MAX_LEVERAGE[key]!
  return PAPER_DEFAULT_MAX_LEVERAGE
}

export function getPaperInstrument(symbol: string): {
  symbol: string
  coin: string
  maxLeverage: number
  tieredMarginModeled: false
} {
  const coin = coinKey(symbol)
  return {
    symbol: symbol.trim().toUpperCase(),
    coin,
    maxLeverage: getMaxLeverage(symbol),
    tieredMarginModeled: false,
  }
}

export function validateLeverage(
  symbol: string,
  leverage: number
): { ok: true } | { ok: false; error: string } {
  const max = getMaxLeverage(symbol)
  if (!Number.isFinite(leverage) || leverage < 1) {
    return { ok: false, error: "Leverage must be >= 1" }
  }
  if (leverage > max) {
    return {
      ok: false,
      error: `Leverage exceeds max ${max}x for ${coinKey(symbol) || symbol}`,
    }
  }
  return { ok: true }
}

/** Maintenance margin rate from max leverage (non-tiered V2.2). */
export function maintenanceMarginRate(symbol: string): number {
  const max = getMaxLeverage(symbol)
  if (!(max > 0)) return 0.5
  return 1 / max / 2
}

/**
 * Refresh max leverage from Hyperliquid public `meta`.
 * Safe to call from the client; failures leave cache/fallbacks intact.
 */
export async function refreshPaperInstruments(
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(HL_INFO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
      signal,
    })
    if (!res.ok) return
    const data = (await res.json()) as {
      universe?: Array<{ name?: string; maxLeverage?: number }>
    }
    const universe = data.universe
    if (!Array.isArray(universe)) return
    for (const asset of universe) {
      const name = asset.name?.trim().toUpperCase()
      const max = asset.maxLeverage
      if (!name || typeof max !== "number" || !(max > 0)) continue
      maxLeverageCache.set(name, max)
    }
  } catch {
    // Network / abort — keep prior cache + fallbacks.
  }
}

/** Test-only — seed or clear max leverage overrides. Pass null to clear. */
export function usePaperInstrumentMaxLeverage(
  map: Record<string, number> | null
): void {
  if (map == null) {
    testOverride = null
    return
  }
  testOverride = new Map(
    Object.entries(map).map(([k, v]) => [k.trim().toUpperCase(), v])
  )
}
