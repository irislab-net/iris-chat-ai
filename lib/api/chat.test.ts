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

  it("builds a trading-chart client context", () => {
    expect(
      buildChatClientContext({
        user: { role: "user", tier: "free" } as never,
        pathname: "/",
        workspaceTab: "news",
      })
    ).toEqual({
      active_page: "trading_chart",
      active_symbol: "ETH",
      role: "user",
      locale: undefined,
      timeframe: undefined,
      prediction_horizon: null,
      mark_price: null,
      open_positions: undefined,
      draft_order: undefined,
      paper_account: undefined,
      available_ui_actions: ["navigate_to_page"],
    })
  })

  it("adapts output_text and session_id for the existing chat UI", () => {
    const adapted = adaptChatMessageResponse({
      session_id: "sess-1",
      output_text: "Support is near 62000.",
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
    expect(adapted.tool_calls?.[0]?.function?.name).toBe("navigate_to_page")
  })

  it("maps credits payload and navigates trading_chart actions", () => {
    expect(
      creditsToUsageResponse({
        balance: {
          remaining_daily: 10,
          remaining_weekly: 20,
          daily_limit: 100,
          weekly_limit: 200,
          daily_reset_at: "2026-09-06T00:00:00Z",
          weekly_reset_at: "2026-09-08T00:00:00Z",
        },
      }).usage?.remaining
    ).toBe(10)
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
