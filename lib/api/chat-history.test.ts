import { describe, expect, it } from "vitest"

import {
  historyItemsToUiMessages,
  isHistoryUiMessage,
  type ConversationHistoryItem,
} from "@/lib/api/chat-history"
import { serverMessageId } from "@/lib/chat-message-id"

describe("chat history client_actions", () => {
  it("keeps empty assistant turns that carry show_trade_signal", () => {
    const item: ConversationHistoryItem = {
      id: 2,
      session_id: "s1",
      role: "assistant",
      content: "",
      created_at: "2026-01-02T10:00:00Z",
      client_actions: [
        {
          tool_name: "show_trade_signal",
          execution_target: "client",
          input: {
            symbol: "BTC",
            direction: "LONG",
            entry: 100,
            stop_loss: 90,
            take_profit: 120,
          },
        },
      ],
    }

    expect(isHistoryUiMessage(item)).toBe(true)
    expect(isHistoryUiMessage({ ...item, client_actions: undefined })).toBe(
      false
    )
  })

  it("maps client_actions into paperTicket on UI messages", () => {
    const messages = historyItemsToUiMessages([
      {
        id: 1,
        session_id: "s1",
        role: "user",
        content: "@signal BTC",
        created_at: "2026-01-02T09:59:00Z",
      },
      {
        id: 2,
        session_id: "s1",
        role: "assistant",
        content: "LONG BTC",
        created_at: "2026-01-02T10:00:00Z",
        client_actions: [
          {
            tool_name: "show_trade_signal",
            execution_target: "client",
            input:
              '{"symbol":"BTC","direction":"SHORT","entry":90,"stop_loss":100,"take_profit":80,"setup":"Fade"}',
          },
        ],
      },
    ])

    expect(messages[0]?.id).toBe(serverMessageId(1))
    expect(messages[1]?.paperTicket).toMatchObject({
      symbol: "BTC",
      side: "SHORT",
      markPrice: 90,
      setup: "Fade",
    })
  })
})
