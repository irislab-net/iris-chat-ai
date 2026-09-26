import { describe, expect, it } from "vitest"

import {
  CANDLE_INTERVAL_MS,
  candlePeriodStart,
  formatEpochForChat,
  formatRelativeAge,
  getNextCandleBoundary,
  insightUpdatedLabel,
  msUntilNextCandleBoundary,
  NEWS_REFRESH_INTERVAL_MS,
  newsFeedUpdatedLabel,
  newsPublishedLabel,
  nextCandleCountdown,
  normalizeEpochMs,
  shouldRefreshAfterResume,
  shouldRefreshNewsAfterResume,
} from "@/lib/format"

/** Build an epoch-aligned instant: period start + offset within the 15m candle. */
function atOffset(periodStart: number, offsetMs: number) {
  return periodStart + offsetMs
}

describe("candle boundary timing", () => {
  // Fixed period start: an exact epoch quarter-hour (divisible by 15m).
  const period = 1_700_000_000_000 - (1_700_000_000_000 % CANDLE_INTERVAL_MS)
  const next = period + CANDLE_INTERVAL_MS
  const nextNext = next + CANDLE_INTERVAL_MS

  it("maps mid-candle (e.g. :07) to the upcoming boundary (e.g. :15)", () => {
    const now = atOffset(period, 7 * 60_000)
    expect(getNextCandleBoundary(now)).toBe(next)
    expect(msUntilNextCandleBoundary(now)).toBe(8 * 60_000)
  })

  it("maps one second before boundary to that boundary", () => {
    const now = atOffset(period, CANDLE_INTERVAL_MS - 1000)
    expect(getNextCandleBoundary(now)).toBe(next)
    expect(msUntilNextCandleBoundary(now)).toBe(1000)
  })

  it("at exact boundary, next is the following period (countdown shows 15:00)", () => {
    expect(getNextCandleBoundary(next)).toBe(nextNext)
    expect(msUntilNextCandleBoundary(next)).toBe(CANDLE_INTERVAL_MS)
    expect(nextCandleCountdown(next)).toBe("15:00")
  })

  it("chains successive boundaries (e.g. :30 → :45)", () => {
    const t30 = period + 2 * CANDLE_INTERVAL_MS
    const t45 = period + 3 * CANDLE_INTERVAL_MS
    expect(getNextCandleBoundary(t30)).toBe(t45)
  })

  it("crosses midnight / day rollover via epoch math", () => {
    // Any instant near end of a period still lands on the next epoch boundary.
    const nearEnd = next - 1
    expect(getNextCandleBoundary(nearEnd)).toBe(next)
    expect(getNextCandleBoundary(next)).toBe(nextNext)
  })

  it("countdown and boundary helper share the same remaining ms", () => {
    const now = atOffset(period, 7 * 60_000 + 30_000) // 07:30 into period
    const rem = msUntilNextCandleBoundary(now)
    const m = Math.floor(rem / 60000)
    const s = Math.floor((rem % 60000) / 1000)
    expect(nextCandleCountdown(now)).toBe(
      `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    )
    expect(now + rem).toBe(getNextCandleBoundary(now))
  })

  it("shouldRefreshAfterResume is true only after a period boundary crossed", () => {
    const fetchedAt = atOffset(period, 7 * 60_000)
    expect(
      shouldRefreshAfterResume(fetchedAt, atOffset(period, 10 * 60_000))
    ).toBe(false)
    expect(shouldRefreshAfterResume(fetchedAt, next)).toBe(true)
    expect(shouldRefreshAfterResume(fetchedAt, next + 5 * 60_000)).toBe(true)
    // Multiple boundaries elapsed → still a single boolean (caller refreshes once)
    expect(shouldRefreshAfterResume(fetchedAt, nextNext + 60_000)).toBe(true)
  })

  it("shouldRefreshNewsAfterResume follows the 5m news window", () => {
    const fetchedAt = atOffset(period, 1 * 60_000)
    expect(
      shouldRefreshNewsAfterResume(fetchedAt, fetchedAt + 4 * 60_000)
    ).toBe(false)
    expect(
      shouldRefreshNewsAfterResume(fetchedAt, fetchedAt + NEWS_REFRESH_INTERVAL_MS)
    ).toBe(true)
    expect(NEWS_REFRESH_INTERVAL_MS).toBe(5 * 60 * 1000)
  })

  it("candlePeriodStart is stable within a period", () => {
    expect(candlePeriodStart(atOffset(period, 1))).toBe(period)
    expect(candlePeriodStart(atOffset(period, CANDLE_INTERVAL_MS - 1))).toBe(
      period
    )
    expect(candlePeriodStart(next)).toBe(next)
  })
})

describe("freshness labeling (F3)", () => {
  const now = Date.parse("2026-08-12T10:10:00.000Z")

  it("formats a recent timestamp as ~3 minutes ago", () => {
    const ts = Date.parse("2026-08-12T10:07:00.000Z")
    expect(formatRelativeAge(ts, now)).toBe("3m ago")
    expect(insightUpdatedLabel(ts, now)).toBe("Updated 3m ago")
  })

  it("formats an hour-boundary age as ~1 hour ago", () => {
    const ts = Date.parse("2026-08-12T10:05:00.000Z")
    const later = Date.parse("2026-08-12T11:05:00.000Z")
    expect(formatRelativeAge(ts, later)).toBe("1h ago")
    expect(newsFeedUpdatedLabel(ts, later)).toBe("Updated 1h ago")
  })

  it("rejects far-future timestamps without negative labels", () => {
    const future = now + 10 * 60_000
    expect(formatRelativeAge(future, now)).toBeNull()
    expect(insightUpdatedLabel(future, now)).toBe("Updated time unavailable")
  })

  it("fails safely on invalid / missing timestamps", () => {
    expect(normalizeEpochMs(NaN)).toBeNull()
    expect(normalizeEpochMs(0)).toBeNull()
    expect(formatRelativeAge(-1, now)).toBeNull()
    expect(insightUpdatedLabel(null, now)).toBe("Updated time unavailable")
    expect(insightUpdatedLabel(undefined, now)).toBe("Updated time unavailable")
    expect(newsPublishedLabel(null, now)).toBeNull()
  })

  it("normalizes second-precision API epochs", () => {
    const sec = Math.floor(Date.parse("2026-08-12T10:07:00.000Z") / 1000)
    expect(normalizeEpochMs(sec)).toBe(sec * 1000)
    expect(formatRelativeAge(sec, now)).toBe("3m ago")
  })

  it("news published label uses publication age wording input", () => {
    const ts = Date.parse("2026-08-12T10:07:00.000Z")
    expect(newsPublishedLabel(ts, now)).toBe("3m ago")
  })

  it("formatEpochForChat keeps minute precision under two hours", () => {
    const ref = Date.parse("2026-08-12T11:15:00.000Z")
    const oneHour = Date.parse("2026-08-12T10:15:00.000Z")
    const oneHourFifteen = Date.parse("2026-08-12T10:00:00.000Z")
    expect(formatEpochForChat(oneHour, ref)).toBe("1h ago")
    expect(formatEpochForChat(oneHourFifteen, ref)).toBe("1h 15m ago")
  })

  it("authentication state does not determine freshness claims", () => {
    // F3 regression: labels are timestamp-only; auth must not invent Live/6h.
    const ts = Date.parse("2026-08-12T10:07:00.000Z")
    const labelFromPayload = insightUpdatedLabel(ts, now)
    expect(labelFromPayload).toBe("Updated 3m ago")
    expect(labelFromPayload).not.toMatch(/live|6h|delay|real-?time/i)
    expect(insightUpdatedLabel(ts, now)).toBe(newsFeedUpdatedLabel(ts, now))
    expect(insightUpdatedLabel(null, now)).not.toMatch(/live|6h/i)
  })
})
