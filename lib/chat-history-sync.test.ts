import { describe, expect, it } from "vitest"

import type { ConversationHistoryItem } from "@/lib/api/chat-history"
import {
  buildStoredConversationFromHistory,
  mergeAssistantPaperTickets,
  mergeServerHistoryIntoStore,
  remapMessagesWithServerHistory,
} from "@/lib/chat-history-sync"
import { serverMessageId } from "@/lib/chat-message-id"
import type { ChatStore, StoredConversation } from "@/lib/chat-storage"

const sessionA = "sess-a"
const sessionB = "sess-b"

function historyItem(
  id: number,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  createdAt: string
): ConversationHistoryItem {
  return {
    id,
    session_id: sessionId,
    role,
    content,
    created_at: createdAt,
  }
}

describe("chat history sync", () => {
  it("groups server history into stored conversations", () => {
    const built = buildStoredConversationFromHistory(sessionA, [
      historyItem(2, sessionA, "assistant", "Stand aside.", "2026-01-02T10:00:00Z"),
      historyItem(1, sessionA, "user", "Long ETH?", "2026-01-02T09:59:00Z"),
    ])

    expect(built?.id).toBe(sessionA)
    expect(built?.messages).toEqual([
      {
        id: serverMessageId(1),
        role: "user",
        content: "Long ETH?",
        createdAt: "2026-01-02T09:59:00Z",
      },
      {
        id: serverMessageId(2),
        role: "assistant",
        content: "Stand aside.",
        createdAt: "2026-01-02T10:00:00Z",
      },
    ])
    expect(built?.history).toEqual([
      { role: "user", content: "Long ETH?" },
      { role: "assistant", content: "Stand aside." },
    ])
  })

  it("does not revive conversations the user deleted locally", () => {
    const local: ChatStore = {
      version: 1,
      conversations: [],
      activeId: null,
      deletedIds: [sessionA],
    }

    const merged = mergeServerHistoryIntoStore(local, [
      historyItem(1, sessionA, "user", "Long ETH?", "2026-01-02T09:59:00Z"),
      historyItem(2, sessionA, "assistant", "Stand aside.", "2026-01-02T10:00:00Z"),
      historyItem(3, sessionB, "user", "BTC?", "2026-01-02T11:00:00Z"),
      historyItem(4, sessionB, "assistant", "Neutral.", "2026-01-02T11:01:00Z"),
    ])

    expect(merged.conversations.map((c) => c.id)).toEqual([sessionB])
    expect(merged.deletedIds).toEqual([sessionA])
  })

  it("merges server sessions with local-only drafts and preserves feedback", () => {
    const localDraft: StoredConversation = {
      id: "local-only",
      title: "Draft",
      createdAt: "2026-01-03T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
      messages: [{ id: "u1", role: "user", content: "Offline draft" }],
      history: [{ role: "user", content: "Offline draft" }],
    }
    const local: ChatStore = {
      version: 1,
      conversations: [
        localDraft,
        {
          id: sessionA,
          title: "Old title",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          messages: [
            { id: "legacy-user", role: "user", content: "Long ETH?" },
            {
              id: "legacy-assistant",
              role: "assistant",
              content: "Stand aside.",
              feedback: "up",
            },
          ],
          history: [],
        },
      ],
      activeId: sessionA,
    }

    const merged = mergeServerHistoryIntoStore(local, [
      historyItem(1, sessionA, "user", "Long ETH?", "2026-01-02T09:59:00Z"),
      historyItem(2, sessionA, "assistant", "Stand aside.", "2026-01-02T10:00:00Z"),
      historyItem(3, sessionB, "user", "BTC?", "2026-01-02T11:00:00Z"),
      historyItem(4, sessionB, "assistant", "Neutral.", "2026-01-02T11:01:00Z"),
    ])

    expect(merged.conversations.map((c) => c.id)).toEqual([
      "local-only",
      sessionB,
      sessionA,
    ])
    const syncedA = merged.conversations.find((c) => c.id === sessionA)
    expect(syncedA?.messages[1]?.id).toBe(serverMessageId(2))
    expect(syncedA?.messages[1]?.feedback).toBe("up")
  })

  it("keeps paperTicket on the matching assistant turn after server sync", () => {
    const setupContent = [
      "Exur setup. Not a profit guarantee.",
      "",
      "ETH SHORT",
      "Setup: fade",
      "Entry 2,473.8",
      "SL 2,487",
      "TP 2,441.9",
      "Leverage 5x",
    ].join("\n")

    const built = buildStoredConversationFromHistory(
      sessionA,
      [
        historyItem(
          1,
          sessionA,
          "user",
          "Trading desk request for eth. Use ALL available Exur evidence.",
          "2026-01-02T09:59:00Z"
        ),
        historyItem(2, sessionA, "assistant", setupContent, "2026-01-02T10:00:00Z"),
        historyItem(3, sessionA, "user", "Why this entry?", "2026-01-02T10:01:00Z"),
        historyItem(
          4,
          sessionA,
          "assistant",
          "The stop sits above entry because this is a short.",
          "2026-01-02T10:02:00Z"
        ),
      ],
      {
        id: sessionA,
        title: "Signal",
        createdAt: "2026-01-02T09:59:00Z",
        updatedAt: "2026-01-02T10:02:00Z",
        messages: [
          { id: "u-local", role: "user", content: "Signal · eth" },
          {
            id: "a-local",
            role: "assistant",
            content: setupContent,
            paperTicket: {
              symbol: "ETH",
              side: "SHORT",
              quantity: 1,
              markPrice: 2473.8,
              stopLoss: 2487,
              takeProfit: 2441.9,
              leverage: 5,
              setup: "fade",
              thesis: "Short bias",
            },
          },
          { id: "u2-local", role: "user", content: "Why this entry?" },
          {
            id: "a2-local",
            role: "assistant",
            content: "The stop sits above entry because this is a short.",
          },
        ],
        history: [],
      }
    )

    expect(built?.messages).toHaveLength(4)
    expect(built?.messages[0]?.content).toBe("Signal · eth")
    expect(built?.messages[1]?.paperTicket?.symbol).toBe("ETH")
    expect(built?.messages[3]?.paperTicket).toBeUndefined()
  })

  it("restores show_trade_signal cards when server history has no paperTicket", () => {
    const ticket = {
      symbol: "BTC",
      side: "LONG" as const,
      quantity: 0.01,
      markPrice: 95_000,
      stopLoss: 94_000,
      takeProfit: 97_000,
      leverage: 5,
      setup: "Trade signal",
      thesis: "",
    }

    const built = buildStoredConversationFromHistory(
      sessionA,
      [
        historyItem(1, sessionA, "user", "@signal BTC", "2026-01-02T09:59:00Z"),
        historyItem(2, sessionA, "assistant", "LONG BTC", "2026-01-02T10:00:00Z"),
      ],
      {
        id: sessionA,
        title: "Signal · BTC",
        createdAt: "2026-01-02T09:59:00Z",
        updatedAt: "2026-01-02T10:00:00Z",
        messages: [
          { id: "u-local", role: "user", content: "Signal · BTC" },
          {
            id: "a-local",
            role: "assistant",
            content: "LONG BTC",
            paperTicket: ticket,
          },
        ],
        history: [],
      }
    )

    expect(built?.messages[1]?.paperTicket).toEqual(ticket)
  })

  it("appends local signal turns the server omitted entirely", () => {
    const ticket = {
      symbol: "BTC",
      side: "SHORT" as const,
      quantity: 1,
      markPrice: 100,
      stopLoss: 110,
      takeProfit: 90,
      leverage: 5,
      setup: "Trade signal",
      thesis: "",
    }

    const merged = mergeAssistantPaperTickets(
      [
        { id: "u1", role: "user", content: "Signal · BTC" },
        {
          id: "a1",
          role: "assistant",
          content: "SHORT BTC",
          paperTicket: ticket,
        },
      ],
      [{ id: "srv-u", role: "user", content: "Signal · BTC" }]
    )

    expect(merged).toHaveLength(2)
    expect(merged[1]?.paperTicket?.symbol).toBe("BTC")
  })

  it("prefers local formatted setup content when paperTicket is preserved", () => {
    const localSetup = [
      "Exur setup. Not a profit guarantee.",
      "",
      "ETH SHORT",
      "Setup: fade",
      "Entry 2,473.8",
      "SL 2,487",
      "TP 2,441.9",
      "Leverage 5x",
    ].join("\n")

    const built = buildStoredConversationFromHistory(
      sessionA,
      [
        historyItem(
          1,
          sessionA,
          "user",
          "Signal · eth",
          "2026-01-02T09:59:00Z"
        ),
        historyItem(
          2,
          sessionA,
          "assistant",
          "I am unable to execute the open_paper_trade function. It appears to be an unknown tool.",
          "2026-01-02T10:00:00Z"
        ),
      ],
      {
        id: sessionA,
        title: "Signal",
        createdAt: "2026-01-02T09:59:00Z",
        updatedAt: "2026-01-02T10:00:00Z",
        messages: [
          { id: "u-local", role: "user", content: "Signal · eth" },
          {
            id: "a-local",
            role: "assistant",
            content: localSetup,
            paperTicket: {
              symbol: "ETH",
              side: "SHORT",
              quantity: 1,
              markPrice: 2473.8,
              stopLoss: 2487,
              takeProfit: 2441.9,
              leverage: 5,
              setup: "fade",
              thesis: "Short bias",
            },
          },
        ],
        history: [],
      }
    )

    expect(built?.messages[1]?.content).toBe(localSetup)
    expect(built?.messages[1]?.paperTicket?.symbol).toBe("ETH")
  })

  it("remaps local message ids onto server ids by turn order", () => {
    const remapped = remapMessagesWithServerHistory(
      [
        { id: "u-local", role: "user", content: "Long ETH?" },
        {
          id: "a-local",
          role: "assistant",
          content: "Stand aside.",
          feedback: "down",
        },
      ],
      [
        historyItem(10, sessionA, "user", "Long ETH?", "2026-01-02T09:59:00Z"),
        historyItem(11, sessionA, "assistant", "Stand aside.", "2026-01-02T10:00:00Z"),
      ]
    )

    expect(remapped[0]?.id).toBe(serverMessageId(10))
    expect(remapped[1]?.id).toBe(serverMessageId(11))
    expect(remapped[1]?.feedback).toBe("down")
  })

  it("remaps summarized signal user labels onto full server prompts", () => {
    const remapped = remapMessagesWithServerHistory(
      [
        { id: "u-local", role: "user", content: "Signal · eth" },
        { id: "a-local", role: "assistant", content: "Stand aside." },
      ],
      [
        historyItem(
          10,
          sessionA,
          "user",
          "Trading desk request for eth. Use ALL available Exur evidence.",
          "2026-01-02T09:59:00Z"
        ),
        historyItem(11, sessionA, "assistant", "Stand aside.", "2026-01-02T10:00:00Z"),
      ]
    )

    expect(remapped[0]?.id).toBe(serverMessageId(10))
    expect(remapped[1]?.id).toBe(serverMessageId(11))
  })

  it("hydrates paperTicket from history client_actions without local cache", () => {
    const built = buildStoredConversationFromHistory(sessionA, [
      historyItem(1, sessionA, "user", "@signal BTC", "2026-01-02T09:59:00Z"),
      {
        id: 2,
        session_id: sessionA,
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
              entry: 95_000,
              stop_loss: 94_000,
              take_profit: 97_000,
              leverage: 5,
              setup: "Breakout",
              thesis: "Momentum",
            },
          },
        ],
      },
    ])

    expect(built?.messages).toHaveLength(2)
    expect(built?.messages[1]?.content).toBe("")
    expect(built?.messages[1]?.paperTicket).toMatchObject({
      symbol: "BTC",
      side: "LONG",
      markPrice: 95_000,
      stopLoss: 94_000,
      takeProfit: 97_000,
      leverage: 5,
      setup: "Breakout",
      thesis: "Momentum",
    })
  })

  it("prefers server client_actions ticket over stale local paperTicket", () => {
    const built = buildStoredConversationFromHistory(
      sessionA,
      [
        historyItem(1, sessionA, "user", "@signal ETH", "2026-01-02T09:59:00Z"),
        {
          id: 2,
          session_id: sessionA,
          role: "assistant",
          content: "LONG ETH",
          created_at: "2026-01-02T10:00:00Z",
          client_actions: [
            {
              tool_name: "show_trade_signal",
              execution_target: "client",
              input: JSON.stringify({
                symbol: "ETH",
                direction: "LONG",
                entry: 2_500,
                stop_loss: 2_400,
                take_profit: 2_700,
                leverage: 3,
                setup: "Server setup",
                thesis: "From history",
              }),
            },
          ],
        },
      ],
      {
        id: sessionA,
        title: "Signal",
        createdAt: "2026-01-02T09:59:00Z",
        updatedAt: "2026-01-02T10:00:00Z",
        messages: [
          { id: "u-local", role: "user", content: "Signal · ETH" },
          {
            id: "a-local",
            role: "assistant",
            content: "LONG ETH",
            paperTicket: {
              symbol: "ETH",
              side: "SHORT",
              quantity: 1,
              markPrice: 1,
              stopLoss: 2,
              takeProfit: 0.5,
              leverage: 1,
              setup: "Stale local",
              thesis: "Old",
            },
          },
        ],
        history: [],
      }
    )

    expect(built?.messages[1]?.paperTicket).toMatchObject({
      symbol: "ETH",
      side: "LONG",
      markPrice: 2_500,
      setup: "Server setup",
      thesis: "From history",
    })
  })

  it("hydrates no_trade reason from history client_actions", () => {
    const built = buildStoredConversationFromHistory(sessionA, [
      historyItem(1, sessionA, "user", "@signal SOL", "2026-01-02T09:59:00Z"),
      {
        id: 2,
        session_id: sessionA,
        role: "assistant",
        content: "",
        created_at: "2026-01-02T10:00:00Z",
        client_actions: [
          {
            tool_name: "no_trade",
            execution_target: "client",
            input: { reason: "Range is too tight for a clean setup." },
          },
        ],
      },
    ])

    expect(built?.messages[1]?.noTradeReason).toBe(
      "Range is too tight for a clean setup."
    )
    expect(built?.messages[1]?.paperTicket).toBeUndefined()
  })
})
