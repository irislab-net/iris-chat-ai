import { describe, expect, it } from "vitest"

import {
  creditUsageFromBalance,
  formatCreditUsageCompact,
  isChatCreditBalance,
} from "@/lib/api/credit-usage"

describe("credit usage", () => {
  const balance = {
    remaining_daily: 800,
    remaining_weekly: 4000,
    daily_limit: 1000,
    weekly_limit: 5000,
    daily_reset_at: "2026-09-21T00:00:00Z",
    weekly_reset_at: "2026-09-22T00:00:00Z",
  }

  it("detects credit balance payloads", () => {
    expect(isChatCreditBalance(balance)).toBe(true)
    expect(isChatCreditBalance({ remaining_daily: 1 })).toBe(false)
  })

  it("builds daily and weekly usage status", () => {
    const usage = creditUsageFromBalance(balance)
    expect(usage.daily).toMatchObject({
      used: 200,
      remaining: 800,
      limit: 1000,
      usedFraction: 0.2,
    })
    expect(usage.weekly).toMatchObject({
      used: 1000,
      remaining: 4000,
      limit: 5000,
      usedFraction: 0.2,
    })
  })

  it("formats a compact remaining label", () => {
    expect(formatCreditUsageCompact(balance)).toBe(
      "Daily 800/1,000 · Weekly 4,000/5,000"
    )
  })
})
