import { describe, expect, it, vi } from "vitest"

import {
  adaptChatMessageResponse,
  buildChatClientContext,
  chatRoleFromUser,
  creditsToUsageResponse,
  executeChatClientActions,
  pathForChatPage,
  parseSuggestedPrompts,
  toChatApiEffort,
  toChatApiSymbol,
} from "@/lib/api/chat"

describe("chat API adapters", () => {
  it("maps UI effort onto the /v1/chat contract", () => {
    expect(toChatApiEffort("instant")).toBe("normal")
    expect(toChatApiEffort("medium")).toBe("high")
    expect(toChatApiEffort("high")).toBe("ultimate")
    expect(toChatApiEffort(undefined)).toBe("normal")
  })

  it("reads follow-up prompts from chat metadata", () => {
    expect(
      parseSuggestedPrompts({
        follow_up_questions: ["What changed on BTC?", "  ", 42, "Show funding"],
      })
    ).toEqual(["What changed on BTC?", "Show funding"])
  })

  it("prefers top-level suggested_actions for next-message chips", () => {
    const adapted = adaptChatMessageResponse({
      session_id: "sess-1",
      output_text: "BTC is consolidating.",
      suggested_actions: [
        "Analyze BTC on the 1h timeframe",
        "  ",
        "Show key support levels",
        42 as never,
        "Review funding",
      ],
      metadata: {
        follow_up_questions: ["Ignored legacy metadata"],
      },
    })
    expect(adapted.suggestedPrompts).toEqual([
      "Analyze BTC on the 1h timeframe",
      "Show key support levels",
      "Review funding",
    ])
  })

  it("falls back to metadata suggested_actions when top-level is empty", () => {
    expect(
      parseSuggestedPrompts({
        suggested_actions: ["Deep dive ETH funding"],
      })
    ).toEqual(["Deep dive ETH funding"])
  })

  it("normalizes symbols to desk tickers for chat context", () => {
    expect(toChatApiSymbol("ETH")).toBe("ETH")
    expect(toChatApiSymbol("ETHUSDT")).toBe("ETH")
    expect(toChatApiSymbol("ETH-USDT")).toBe("ETH")
    expect(toChatApiSymbol("XAUUSD")).toBe("XAU")
    expect(toChatApiSymbol()).toBe("ETH")
  })

  it("derives chat role from account tier", () => {
    expect(chatRoleFromUser({ role: "admin" } as never)).toBe("admin")
    expect(chatRoleFromUser({ role: "member", tier: "pro" } as never)).toBe(
      "pro"
    )
    expect(chatRoleFromUser({ role: "member", tier: "free" } as never, true)).toBe(
      "pro"
    )
    expect(chatRoleFromUser(null)).toBe("user")
  })

  it("builds a chat client context with show_trade_signal", () => {
    expect(
      buildChatClientContext({
        user: { role: "user", tier: "free" } as never,
        pathname: "/",
        workspaceTab: "news",
        timezone: "+03:30",
      })
    ).toEqual({
      active_page: "chat",
      active_symbol: "",
      role: "user",
      locale: undefined,
      timezone: "+03:30",
      timeframe: undefined,
      open_positions: undefined,
      draft_order: undefined,
      paper_account: undefined,
      available_ui_actions: ["show_trade_signal", "navigate_to_page"],
    })
  })

  it("adapts output_text and merges client tool_calls into client_actions", () => {
    const adapted = adaptChatMessageResponse({
      session_id: "sess-1",
      output_text: "Support is near 62000.",
      tool_calls: [
        {
          tool_name: "show_trade_signal",
          execution_target: "client",
          input:
            '{"symbol":"BTC","direction":"SHORT","setup":"Fade","entry":81558,"stopLoss":81756.7,"takeProfit":80505.9,"leverage":5,"thesis":"Short edge"}',
        },
      ],
      client_actions: [
        {
          tool_name: "navigate_to_page",
          execution_target: "client",
          input: '{"page":"trading_chart"}',
        },
      ],
      credit_balance: {
        remaining_daily: 800,
        remaining_weekly: 4000,
        daily_limit: 1000,
        weekly_limit: 5000,
        daily_reset_at: "2026-09-06T00:00:00Z",
        weekly_reset_at: "2026-09-08T00:00:00Z",
      },
    })
    expect(adapted.message).toBe("Support is near 62000.")
    expect(adapted.conversation_id).toBe("sess-1")
    expect(adapted.usage).toMatchObject({
      remaining: 800,
      limit: 1000,
      used: 200,
    })
    expect(adapted.client_actions?.map((a) => a.tool_name)).toEqual([
      "show_trade_signal",
      "navigate_to_page",
    ])
    expect(adapted.tool_calls?.[0]?.function?.name).toBe("show_trade_signal")
  })

  it("maps credits payload and navigates trading_chart actions", () => {
    const mapped = creditsToUsageResponse({
      balance: {
        remaining_daily: 10,
        remaining_weekly: 20,
        daily_limit: 100,
        weekly_limit: 200,
        daily_reset_at: "2026-09-06T00:00:00Z",
        weekly_reset_at: "2026-09-08T00:00:00Z",
      },
    })
    expect(mapped.usage?.remaining).toBe(10)
    expect(mapped.credit_balance?.weekly_limit).toBe(200)
    expect(pathForChatPage("trading_chart")).toBe("/?tab=news")
    const navigate = vi.fn()
    executeChatClientActions(
      [
        {
          tool_name: "navigate_to_page",
          execution_target: "client",
          input: '{"page":"trading_chart"}',
        },
      ],
      { navigate, openDesk: vi.fn(), focusDeskPane: vi.fn() }
    )
    expect(navigate).toHaveBeenCalledWith("/?tab=news")
  })
})
