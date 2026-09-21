import { describe, expect, it } from "vitest"

import {
  applySessionListToStore,
  normalizeSessionListResult,
} from "@/lib/api/chat-sessions"
import type { ChatStore } from "@/lib/chat-storage"

describe("normalizeSessionListResult", () => {
  it("reads the sessions envelope and drops invalid rows", () => {
    const result = normalizeSessionListResult({
      sessions: {
        items: [
          {
            session_id: "sess-1",
            title: "BTC setup",
            pinned: true,
            last_message_at: "2026-09-21T10:00:00Z",
            first_message_at: "2026-09-20T09:00:00Z",
            message_count: 4,
            preview: { role: "assistant", content: "Support is near…" },
          },
          {
            session_id: "bad",
            title: "Missing preview",
            pinned: false,
            last_message_at: "2026-09-21T10:00:00Z",
            first_message_at: "2026-09-20T09:00:00Z",
            message_count: 1,
          },
          null,
        ],
        limit: 20,
        offset: 0,
        total: 2,
      },
    })

    expect(result).toEqual({
      items: [
        {
          session_id: "sess-1",
          title: "BTC setup",
          pinned: true,
          last_message_at: "2026-09-21T10:00:00Z",
          first_message_at: "2026-09-20T09:00:00Z",
          message_count: 4,
          preview: { role: "assistant", content: "Support is near…" },
        },
      ],
      limit: 20,
      offset: 0,
      total: 2,
    })
  })

  it("returns an empty page when the envelope is missing", () => {
    expect(normalizeSessionListResult({})).toEqual({
      items: [],
      limit: 0,
      offset: 0,
      total: 0,
    })
  })
})

describe("applySessionListToStore", () => {
  it("applies pin metadata without changing the active conversation", () => {
    const store: ChatStore = {
      version: 1,
      conversations: [
        {
          id: "active",
          title: "Active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
          messages: [{ id: "u1", role: "user", content: "hi" }],
          history: [{ role: "user", content: "hi" }],
        },
        {
          id: "other",
          title: "Other",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          messages: [{ id: "u2", role: "user", content: "yo" }],
          history: [{ role: "user", content: "yo" }],
        },
      ],
      activeId: "active",
    }

    const next = applySessionListToStore(store, [
      {
        session_id: "other",
        title: "Other",
        pinned: true,
        last_message_at: "2026-01-01T00:00:00Z",
        first_message_at: "2026-01-01T00:00:00Z",
        message_count: 1,
        preview: { role: "user", content: "yo" },
      },
      {
        session_id: "active",
        title: "Active",
        pinned: false,
        last_message_at: "2026-01-02T00:00:00Z",
        first_message_at: "2026-01-01T00:00:00Z",
        message_count: 1,
        preview: { role: "user", content: "hi" },
      },
    ])

    expect(next.activeId).toBe("active")
    expect(next.conversations[0]?.id).toBe("other")
    expect(next.conversations[0]?.pinned).toBe(true)
  })
})
