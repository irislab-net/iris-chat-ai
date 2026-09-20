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

  it("advertises show_trade_signal and desk tools for pro users on the trading desk", () => {
    expect(
      resolveAvailableUiActions({ role: "pro", onDesk: true })
    ).toEqual([
      "show_trade_signal",
      "navigate_to_page",
      "draw_chart_indicator",
      "clear_chart_indicators",
      "show_wallet_balance",
      "preview_ghost_trade",
      "preview_position_bracket",
      "modify_position_bracket",
      "fill_order_form",
    ])
  })

  it("executes show_trade_signal into a paper ticket", () => {
    const previewGhostTrade = vi.fn()
    const switchSymbol = vi.fn()

    const result = executeChatClientActions(
      [
        {
          tool_name: "show_trade_signal",
          execution_target: "client",
          input: JSON.stringify({
            symbol: "BTC",
            direction: "SHORT",
            setup: "Model short edge fade",
            entry: 81558,
            stopLoss: 81756.7,
            takeProfit: 80505.9,
            leverage: 5,
            thesis: "Short model p=0.76 with edge 0.065",
          }),
        },
      ],
      { previewGhostTrade, switchSymbol }
    )

    expect(result.paperTicket).toMatchObject({
      symbol: "BTC",
      side: "SHORT",
      markPrice: 81558,
      stopLoss: 81756.7,
      takeProfit: 80505.9,
      leverage: 5,
      setup: "Model short edge fade",
    })
    expect(switchSymbol).toHaveBeenCalledWith("BTC")
    expect(previewGhostTrade).toHaveBeenCalled()
    expect(result.summaries[0]).toMatchObject({
      tool: "show_trade_signal",
      applied: true,
    })
  })

  it("executes chart and order client actions", () => {
    const drawChartIndicator = vi.fn()
    const fillOrderForm = vi.fn()
    const navigate = vi.fn()
    const focusDeskPane = vi.fn()

    const result = executeChatClientActions(
      [
        {
          tool_name: "draw_chart_indicator",
          execution_target: "client",
          input: '{"type":"support","price":62000}',
        },
        {
          tool_name: "fill_order_form",
          execution_target: "client",
          input:
            '{"side":"buy","symbol":"BTCUSDT","quantity":0.5,"price":62000,"stop_loss":61000,"take_profit":64000,"leverage":10}',
        },
      ],
      {
        navigate,
        openDesk: vi.fn(),
        drawChartIndicator,
        fillOrderForm,
        focusDeskPane,
      }
    )

    expect(navigate).toHaveBeenCalledWith("/?tab=news")
    expect(focusDeskPane).toHaveBeenCalledWith({ pane: "chart" })
    expect(drawChartIndicator).toHaveBeenCalledWith({
      type: "support",
      price: 62000,
      mode: "append",
    })
    expect(fillOrderForm).toHaveBeenCalledWith({
      side: "LONG",
      symbol: "BTCUSDT",
      quantity: 0.5,
      limitPrice: 62000,
      stopLoss: 61000,
      takeProfit: 64000,
      leverage: 10,
    })
    expect(result.summaries).toHaveLength(2)
  })

  it("queues bracket apply after modify_position_bracket", () => {
    const previewPositionBracket = vi.fn()
    const pendingBracketApply = vi.fn()

    const result = executeChatClientActions(
      [
        {
          tool_name: "modify_position_bracket",
          execution_target: "client",
          input:
            '{"symbol":"ETH","stop_loss":3300,"take_profit":3600,"reason":"Tighten risk"}',
        },
      ],
      {
        navigate: vi.fn(),
        openDesk: vi.fn(),
        focusDeskPane: vi.fn(),
        previewPositionBracket,
        pendingBracketApply,
        resolvePosition: () => ({
          id: "pos-1",
          symbol: "ETH",
          side: "LONG",
          entryPrice: 3400,
          quantity: 1,
        }),
      }
    )

    expect(previewPositionBracket).toHaveBeenCalled()
    expect(pendingBracketApply).toHaveBeenCalledWith(
      expect.objectContaining({
        positionId: "pos-1",
        stopLoss: 3300,
        takeProfit: 3600,
      })
    )
    expect(result.pendingBracket?.positionId).toBe("pos-1")
  })
})
