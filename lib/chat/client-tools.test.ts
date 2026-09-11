import { describe, expect, it, vi } from "vitest"

import {
  executeChatClientActions,
  resolveAvailableUiActions,
} from "@/lib/chat/client-tools"

describe("chat client tools", () => {
  it("advertises desk tools for pro users on the trading desk", () => {
    expect(
      resolveAvailableUiActions({ role: "pro", onDesk: true })
    ).toEqual([
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
