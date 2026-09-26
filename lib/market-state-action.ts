/**
 * Deterministic Market State → next-action presentation.
 *
 * Source of truth: `InsightSummary.stance` (API string). There is no separate
 * action / recommendation field on the insight payload.
 *
 * Presentation only — does not invent trades, entries, stops, or sizing.
 * Wait / monitor semantics stay observational (desk lean, not order tickets).
 */

export type MarketStateKind = "wait" | "long" | "short" | "no_setup" | "unknown"

export type MarketStateActionPresentation = {
  /** Normalized kind used for mapping. */
  kind: MarketStateKind
  /** User-facing status value (usually the API stance, uppercased when known). */
  displayStatus: string
  /** Why this status — one line for traders scanning the bullet. */
  interpretation: string | null
  /** What to do now — concrete posture, never a buy/sell ticket. */
  nextAction: string
}

function normalizeStanceKey(stance: string): string {
  return stance.trim().toUpperCase().replace(/\s+/g, " ")
}

/**
 * Classify canonical stance strings observed in product docs + live payload.
 * Matching is conservative: unknown values stay `unknown` (no invented action).
 */
export function classifyMarketStance(stance: string): MarketStateKind {
  const key = normalizeStanceKey(stance)
  if (!key) return "unknown"

  if (
    key === "WAIT" ||
    key === "HOLD" ||
    key === "STAND ASIDE" ||
    key === "NO SIGNAL" ||
    key === "FLAT"
  ) {
    return "wait"
  }

  if (key === "NO SETUP" || key === "NONE") {
    return "no_setup"
  }

  if (key === "LONG" || key === "BULL" || key === "BUY" || key === "UP") {
    return "long"
  }

  if (key === "SHORT" || key === "BEAR" || key === "SELL" || key === "DOWN") {
    return "short"
  }

  // Soft contains for compound API strings, e.g. "WAIT / NO SETUP"
  if (/\bWAIT\b/.test(key) || /\bNO SIGNAL\b/.test(key)) return "wait"
  if (/\bNO SETUP\b/.test(key)) return "no_setup"
  if (/\bLONG\b/.test(key) || /\bBULL\b/.test(key)) return "long"
  if (/\bSHORT\b/.test(key) || /\bBEAR\b/.test(key)) return "short"

  return "unknown"
}

/**
 * Map API stance → status / interpretation / next-action lines.
 * Deterministic; no LLM; no backend changes.
 */
export function getMarketStateActionPresentation(
  stance: string
): MarketStateActionPresentation {
  const raw = stance.trim()
  const kind = classifyMarketStance(raw)
  const displayStatus = raw ? normalizeStanceKey(raw) : "—"

  switch (kind) {
    case "wait":
      return {
        kind,
        displayStatus: displayStatus === "—" ? "WAIT" : displayStatus,
        interpretation:
          "Models have not locked a clear long or short on this candle.",
        nextAction: "Don't trade yet. Wait for a clear signal.",
      }
    case "no_setup":
      return {
        kind,
        displayStatus,
        interpretation: "Nothing actionable is set up on this candle.",
        nextAction: "Stay out. No setup to take.",
      }
    case "long":
      return {
        kind,
        displayStatus,
        interpretation: "Desk bias is long. This is a lean, not a buy order.",
        nextAction: "Long bias. Watch for your long entry.",
      }
    case "short":
      return {
        kind,
        displayStatus,
        interpretation: "Desk bias is short. This is a lean, not a sell order.",
        nextAction: "Short bias. Watch for your short entry.",
      }
    case "unknown":
    default:
      return {
        kind: "unknown",
        displayStatus,
        interpretation: null,
        nextAction: "Stance unclear. Check Analysis first.",
      }
  }
}
