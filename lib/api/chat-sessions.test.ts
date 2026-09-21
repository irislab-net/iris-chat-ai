import { describe, expect, it } from "vitest"

import { normalizeSessionListResult } from "@/lib/api/chat-sessions"

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
