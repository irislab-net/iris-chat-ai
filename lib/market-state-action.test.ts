import { describe, expect, it } from "vitest"

import {
  classifyMarketStance,
  getMarketStateActionPresentation,
} from "@/lib/market-state-action"

describe("classifyMarketStance", () => {
  it("classifies wait family", () => {
    expect(classifyMarketStance("WAIT")).toBe("wait")
    expect(classifyMarketStance(" wait ")).toBe("wait")
    expect(classifyMarketStance("NO SIGNAL")).toBe("wait")
    expect(classifyMarketStance("STAND ASIDE")).toBe("wait")
  })

  it("classifies directional stances", () => {
    expect(classifyMarketStance("LONG")).toBe("long")
    expect(classifyMarketStance("BULL")).toBe("long")
    expect(classifyMarketStance("SHORT")).toBe("short")
    expect(classifyMarketStance("BEAR")).toBe("short")
  })

  it("classifies no setup", () => {
    expect(classifyMarketStance("NO SETUP")).toBe("no_setup")
  })

  it("leaves unknown API values unmapped", () => {
    expect(classifyMarketStance("RANGE")).toBe("unknown")
    expect(classifyMarketStance("")).toBe("unknown")
  })
})

describe("getMarketStateActionPresentation", () => {
  it("maps WAIT to plain don't-trade-yet guidance", () => {
    const p = getMarketStateActionPresentation("WAIT")
    expect(p.kind).toBe("wait")
    expect(p.displayStatus).toBe("WAIT")
    expect(p.nextAction).toMatch(/don't trade yet/i)
    expect(p.interpretation).toMatch(/clear long or short/i)
    expect(p.nextAction.toLowerCase()).not.toMatch(/\b(buy|sell)\b/)
  })

  it("maps LONG/SHORT to bias + watch-for-entry (not buy/sell tickets)", () => {
    const long = getMarketStateActionPresentation("LONG")
    expect(long.nextAction).toMatch(/long bias/i)
    expect(long.nextAction.toLowerCase()).not.toMatch(/\b(buy|sell)\b/)
    const short = getMarketStateActionPresentation("SHORT")
    expect(short.nextAction).toMatch(/short bias/i)
    expect(short.nextAction.toLowerCase()).not.toMatch(/\b(buy|sell)\b/)
  })

  it("does not invent action for unknown stance", () => {
    const p = getMarketStateActionPresentation("RANGE")
    expect(p.kind).toBe("unknown")
    expect(p.interpretation).toBeNull()
    expect(p.nextAction).toMatch(/stance unclear/i)
  })

  it("is deterministic for the same stance", () => {
    expect(getMarketStateActionPresentation("WAIT")).toEqual(
      getMarketStateActionPresentation("WAIT")
    )
  })
})
