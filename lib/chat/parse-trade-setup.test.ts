import { describe, expect, it } from "vitest"

import {
  isStructuredSignalSetupContent,
  parsePaperTicketFromAssistantText,
  parseTradeSetupFromText,
  resolvePaperTicketForAssistantMessage,
} from "@/lib/chat/parse-trade-setup"

describe("parseTradeSetupFromText", () => {
  it("parses short ETH setup from assistant prose", () => {
    const setup = parseTradeSetupFromText(`
*   **قیمت فعلی ETH:** 2483.1
*   **جهت پوزیشن:** Short (فروش)
*   **حد ضرر (SL):** 2495.8
*   **حد سود (TP):** 2470.1
    `)

    expect(setup).not.toBeNull()
    expect(setup?.symbol).toBe("ETH")
    expect(setup?.side).toBe("SHORT")
    expect(setup?.entryPrice).toBe(2483.1)
    expect(setup?.stopLoss).toBe(2495.8)
    expect(setup?.takeProfit).toBe(2470.1)
  })

  it("parses markdown Direction/Entry/SL/TP format", () => {
    const setup =
      parseTradeSetupFromText(`I am unable to open a paper trade directly. However, based on the provided market context, here is a potential trade setup for ETH:

**Direction:** SHORT
**Entry Price:** 2486.8 (current live price)
**Stop Loss:** 2495.8
**Take Profit:** 2470.1
**Leverage:** 10x
**Setup Name:** Short Bias with Model Confirmation`)

    expect(setup).not.toBeNull()
    expect(setup?.symbol).toBe("ETH")
    expect(setup?.side).toBe("SHORT")
    expect(setup?.entryPrice).toBe(2486.8)
    expect(setup?.stopLoss).toBe(2495.8)
    expect(setup?.takeProfit).toBe(2470.1)
    expect(setup?.leverage).toBe(10)
  })

  it("returns null when levels are missing", () => {
    expect(parseTradeSetupFromText("Maybe long ETH later.")).toBeNull()
  })

  it("builds a paper ticket from markdown setup prose", () => {
    const ticket =
      parsePaperTicketFromAssistantText(`I am unable to open a paper trade directly. However, based on the provided market context, here is a potential trade setup for ETH:

**Direction:** SHORT
**Entry Price:** 2486.8 (current live price)
**Stop Loss:** 2495.8
**Take Profit:** 2470.1
**Leverage:** 10x`)

    expect(ticket?.symbol).toBe("ETH")
    expect(ticket?.side).toBe("SHORT")
    expect(ticket?.leverage).toBe(10)
    expect(ticket?.quantity).toBeGreaterThan(0)
  })

  it("flags explicit setup blocks but not casual SL/TP mentions", () => {
    expect(
      isStructuredSignalSetupContent(
        "Exur setup. Not a profit guarantee.\n\nETH SHORT\nSetup: fade\nEntry 2473\nSL 2487\nTP 2441"
      )
    ).toBe(true)
    expect(
      isStructuredSignalSetupContent(
        "ETH SHORT Setup: Model short edge fade Entry 2,473.8 SL 2,487 TP 2,441.9 Leverage 5x"
      )
    ).toBe(true)
    expect(
      isStructuredSignalSetupContent(
        "The SL at 2487 is tight. TP 2441.9 looks reasonable for this ETH short."
      )
    ).toBe(false)
    expect(
      resolvePaperTicketForAssistantMessage({
        content: "SL 2487 and TP 2441.9 on ETH short look fine.",
      })
    ).toBeNull()
  })

  it("parses compact inline ETH SHORT setup prose", () => {
    const setup = parseTradeSetupFromText(
      "ETH SHORT Setup: Model short edge fade Entry 2,473.8 (market; fees and slippage apply if you open) SL 2,487 TP 2,441.9 Leverage 5x Size 37.8787 (risk ~$500.00 = 0.5% of demo equity)"
    )

    expect(setup).not.toBeNull()
    expect(setup?.symbol).toBe("ETH")
    expect(setup?.side).toBe("SHORT")
    expect(setup?.setup).toBe("Model short edge fade")
    expect(setup?.entryPrice).toBe(2473.8)
    expect(setup?.stopLoss).toBe(2487)
    expect(setup?.takeProfit).toBe(2441.9)
    expect(setup?.leverage).toBe(5)
  })

  it("builds a paper ticket when margin allows", () => {
    const ticket = parsePaperTicketFromAssistantText(`
Short ETH
SL: 2495.8
TP: 2470.1
Entry: 2483.1
    `)
    expect(ticket?.symbol).toBe("ETH")
    expect(ticket?.side).toBe("SHORT")
    expect(ticket?.quantity).toBeGreaterThan(0)
  })
})
