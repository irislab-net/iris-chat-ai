import { describe, expect, it } from "vitest"

import { formatTicketDecimal } from "@/lib/trading/format"

describe("formatTicketDecimal", () => {
  it("never renders scientific notation for tiny quantities", () => {
    expect(formatTicketDecimal(1e-8)).toBe("0.00000001")
    expect(formatTicketDecimal(1e-8)).not.toMatch(/e/i)
  })

  it("trims trailing zeros for ordinary decimals", () => {
    expect(formatTicketDecimal(1)).toBe("1")
    expect(formatTicketDecimal(0.01)).toBe("0.01")
    expect(formatTicketDecimal(0.5)).toBe("0.5")
  })

  it("formats integers when requested", () => {
    expect(formatTicketDecimal(3.7, { integer: true })).toBe("3")
  })
})
