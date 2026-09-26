import { describe, expect, it } from "vitest"

import {
  stampUiMessageFromRef,
  replyTargetFromMessage,
} from "@/lib/chat/message-stamp"
import { serverMessageId } from "@/lib/chat-message-id"

describe("message stamp", () => {
  it("stamps server id and created_at from PersistedMessageRef", () => {
    const stamped = stampUiMessageFromRef(
      { id: "temp", role: "user", content: "hello" },
      {
        id: 42,
        created_at: "2026-09-21T00:00:00Z",
        reply_to_id: 7,
        reply_to: {
          id: 7,
          role: "assistant",
          excerpt: "prior",
          created_at: "2026-09-20T00:00:00Z",
        },
      }
    )

    expect(stamped.id).toBe(serverMessageId(42))
    expect(stamped.createdAt).toBe("2026-09-21T00:00:00Z")
    expect(stamped.replyToId).toBe(7)
    expect(stamped.replyTo?.excerpt).toBe("prior")
  })

  it("builds a reply target only for server message ids", () => {
    expect(
      replyTargetFromMessage({ id: "local-uuid", role: "user", content: "hi" })
    ).toBeNull()
    expect(
      replyTargetFromMessage({
        id: serverMessageId(9),
        role: "assistant",
        content: "answer",
        createdAt: "2026-09-21T00:00:00Z",
      })
    ).toEqual({
      id: 9,
      role: "assistant",
      excerpt: "answer",
      createdAt: "2026-09-21T00:00:00Z",
    })
  })
})
