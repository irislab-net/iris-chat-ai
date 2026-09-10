import { describe, expect, it } from "vitest"

import type { ConversationHistoryItem } from "@/lib/api/chat-history"
import {
  buildStoredConversationFromHistory,
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
      },
      {
        id: serverMessageId(2),
        role: "assistant",
        content: "Stand aside.",
      },
    ])
    expect(built?.history).toEqual([
      { role: "user", content: "Long ETH?" },
      { role: "assistant", content: "Stand aside." },
    ])
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
})
