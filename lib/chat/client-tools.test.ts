import { describe, expect, it, vi } from "vitest"

import {
  executeChatClientActions,
  formatUtcOffset,
  resolveAvailableUiActions,
  resolveClientTimezone,
} from "@/lib/chat/client-tools"

describe("chat client tools", () => {
  it("formats timezone as a UTC offset", () => {
    expect(formatUtcOffset(210)).toBe("+03:30")
    expect(formatUtcOffset(-300)).toBe("-05:00")
    expect(formatUtcOffset(0)).toBe("+00:00")
  })

  it("resolves the browser offset for client_context.timezone", () => {
    const date = new Date("2026-09-20T12:00:00Z")
    vi.spyOn(date, "getTimezoneOffset").mockReturnValue(-210)
    expect(resolveClientTimezone(date)).toBe("+03:30")
  })

  it("advertises show_trade_signal for pro users", () => {
    expect(resolveAvailableUiActions({ role: "pro" })).toEqual([
      "show_trade_signal",
      "navigate_to_page",
    ])
  })

  it("adds admin_user_lookup for admins", () => {
    expect(resolveAvailableUiActions({ role: "admin" })).toEqual([
      "show_trade_signal",
      "navigate_to_page",
      "admin_user_lookup",
    ])
  })

  it("executes show_trade_signal into a paper ticket", () => {
    const result = executeChatClientActions([
      {
        tool_name: "show_trade_signal",
        execution_target: "client",
        input: JSON.stringify({
          symbol: "BTC",
          direction: "LONG",
          setup: "Range Breakout",
          entry: 81806,
          stopLoss: 81690,
          takeProfit: 82050,
          leverage: 10,
          timeHorizon: "~2 hours",
          entryReason:
            "Price has broken above the recent 30-minute high, indicating potential for further upside.",
          stopLossReason:
            "Stop loss placed below the previous 1-minute candle low to protect against a false breakout.",
          takeProfitReason:
            "Targeting the next significant resistance level based on prior price action.",
          thesis:
            "BTC is showing signs of a short-term breakout from a consolidation range.",
        }),
      },
    ])

    expect(result.paperTicket).toMatchObject({
      symbol: "BTC",
      side: "LONG",
      markPrice: 81806,
      stopLoss: 81690,
      takeProfit: 82050,
      leverage: 10,
      setup: "Range Breakout",
      quantity: 0,
      timeHorizon: "~2 hours",
      entryReason:
        "Price has broken above the recent 30-minute high, indicating potential for further upside.",
      stopLossReason:
        "Stop loss placed below the previous 1-minute candle low to protect against a false breakout.",
      takeProfitReason:
        "Targeting the next significant resistance level based on prior price action.",
      thesis:
        "BTC is showing signs of a short-term breakout from a consolidation range.",
    })
    expect(result.summaries[0]).toMatchObject({
      tool: "show_trade_signal",
      applied: true,
    })
  })

  it("does not invent leverage, size, setup, or symbol for show_trade_signal", () => {
    const result = executeChatClientActions([
      {
        tool_name: "show_trade_signal",
        execution_target: "client",
        input: JSON.stringify({
          symbol: "BTC",
          direction: "LONG",
          entry: 81529,
          stopLoss: 81321,
          takeProfit: 81642,
        }),
      },
    ])

    expect(result.paperTicket).toMatchObject({
      symbol: "BTC",
      side: "LONG",
      leverage: 0,
      quantity: 0,
      setup: "",
    })
  })

  it("skips show_trade_signal when symbol is missing", () => {
    const result = executeChatClientActions([
      {
        tool_name: "show_trade_signal",
        execution_target: "client",
        input: JSON.stringify({
          direction: "LONG",
          entry: 100,
          stopLoss: 90,
          takeProfit: 120,
        }),
      },
    ])

    expect(result.paperTicket).toBeUndefined()
    expect(result.summaries[0]?.applied).toBe(false)
  })

  it("executes no_trade into a reason", () => {
    const result = executeChatClientActions([
      {
        tool_name: "no_trade",
        execution_target: "client",
        input: JSON.stringify({
          reason: "Live data is stale; no safe SL/TP levels.",
        }),
      },
    ])

    expect(result.noTradeReason).toBe(
      "Live data is stale; no safe SL/TP levels."
    )
    expect(result.paperTicket).toBeUndefined()
    expect(result.summaries[0]).toMatchObject({
      tool: "no_trade",
      applied: true,
    })
  })
})
