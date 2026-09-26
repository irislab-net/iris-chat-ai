export function pct(v: number, digits = 1) {
  return (v * 100).toFixed(digits)
}

export function pctInt(v: number) {
  return Math.round(v * 100)
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Coerce API epoch seconds or milliseconds to ms. Returns null if unusable. */
export function normalizeEpochMs(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0) return null
  // Heuristic: values below ~1e12 are seconds (year ~2001 in ms is ~1e12).
  return raw < 1_000_000_000_000 ? raw * 1000 : raw
}

/**
 * Compact relative age from an API timestamp.
 * Returns null for invalid or far-future values (no negative / fake Live claims).
 */
export function formatRelativeAge(
  raw: number,
  now = Date.now()
): string | null {
  const ms = normalizeEpochMs(raw)
  if (ms == null) return null
  // Tolerate small clock skew; reject clearly-future stamps.
  if (ms > now + 120_000) return null
  const capped = Math.min(ms, now)
  const m = Math.round((now - capped) / 60_000)
  if (m < 60) return `${Math.max(0, m)}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

/** Insight payload generation time — not proof of "live" market data. */
export function insightUpdatedLabel(
  generatedAt: number | null | undefined,
  now = Date.now()
): string {
  if (generatedAt == null) return "Updated time unavailable"
  const age = formatRelativeAge(generatedAt, now)
  return age ? `Updated ${age}` : "Updated time unavailable"
}

/** News analytics generation time for the bulletin badge. */
export function newsFeedUpdatedLabel(
  generatedAt: number | null | undefined,
  now = Date.now()
): string {
  if (generatedAt == null) return "Updated time unavailable"
  const age = formatRelativeAge(generatedAt, now)
  return age ? `Updated ${age}` : "Updated time unavailable"
}

/** Article publication age (not feed fetch time). */
export function newsPublishedLabel(
  publishedAt: number | null | undefined,
  now = Date.now()
): string | null {
  if (publishedAt == null) return null
  return formatRelativeAge(publishedAt, now)
}

/** Relative age helper used by news cards; returns "—" when unusable. */
export function ago(ms: number, ref = Date.now()) {
  return formatRelativeAge(ms, ref) ?? "—"
}

/** Human-readable epoch for LLM context and chat display. */
export function formatEpochForChat(
  raw: number,
  now = Date.now()
): string | null {
  const ms = normalizeEpochMs(raw)
  if (ms == null) return null
  if (ms > now + 120_000) return null
  const capped = Math.min(ms, now)
  const totalMinutes = Math.round((now - capped) / 60_000)
  if (totalMinutes < 60) return `${Math.max(0, totalMinutes)}m ago`
  if (totalMinutes < 48 * 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (minutes === 0) return `${hours}h ago`
    return `${hours}h ${minutes}m ago`
  }
  const days = Math.round(totalMinutes / (60 * 24))
  return `${days}d ago`
}

export function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "source"
  }
}

/** 15-minute candle length in ms. Boundaries are epoch-aligned (same as countdown). */
export const CANDLE_INTERVAL_MS = 15 * 60 * 1000

/** Start of the candle period that contains `now` (epoch-aligned). */
export function candlePeriodStart(now: number): number {
  return now - (now % CANDLE_INTERVAL_MS)
}

/**
 * Absolute timestamp of the next candle boundary after `now`.
 * When `now` falls exactly on a boundary, returns the following boundary
 * (matches countdown showing `15:00` at that instant).
 */
export function getNextCandleBoundary(now: number): number {
  return now + (CANDLE_INTERVAL_MS - (now % CANDLE_INTERVAL_MS))
}

/** Ms until {@link getNextCandleBoundary}; always in `(0, CANDLE_INTERVAL_MS]`. */
export function msUntilNextCandleBoundary(now: number): number {
  return getNextCandleBoundary(now) - now
}

/**
 * True when at least one candle boundary elapsed since `lastFetchAt`
 * (used after tab sleep/resume — refresh at most once, no catch-up storm).
 */
export function shouldRefreshAfterResume(
  lastFetchAt: number,
  now: number
): boolean {
  return candlePeriodStart(now) > candlePeriodStart(lastFetchAt)
}

export function nextCandleCountdown(now = Date.now()) {
  const rem = msUntilNextCandleBoundary(now)
  const m = Math.floor(rem / 60000)
  const s = Math.floor((rem % 60000) / 1000)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
