import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  LEGACY_CHAT_STORAGE_KEY,
  NEW_CHAT_TITLE,
  discardLegacyGlobalChatStore,
  getChatStorageKey,
  readChatStore,
  resolvePersistedConversationTitle,
  sortConversations,
  upsertConversation,
  writeChatStore,
  resolveActiveConversation,
  type ChatStore,
  type StoredConversation,
} from "@/lib/chat-storage"

function memoryLocalStorage() {
  const map = new Map<string, string>()
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key: string, value: string) {
      map.set(key, String(value))
    },
    removeItem(key: string) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    key(i: number) {
      return [...map.keys()][i] ?? null
    },
    get length() {
      return map.size
    },
  }
}

function sampleConversation(id: string, title: string): StoredConversation {
  return {
    id,
    title,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    messages: [
      { id: "m1", role: "user", content: "Should I long ETH?" },
      { id: "m2", role: "assistant", content: "Stand aside this candle." },
    ],
    history: [
      { role: "user", content: "Should I long ETH?" },
      { role: "assistant", content: "Stand aside this candle." },
    ],
  }
}

function storeWith(conversation: StoredConversation): ChatStore {
  return {
    version: 1,
    conversations: [conversation],
    activeId: conversation.id,
  }
}

describe("chat storage isolation", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    })
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memoryLocalStorage(),
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage")
  })

  it("returns User A data when reading as User A", () => {
    const userA = "user-a-id"
    const convo = sampleConversation("c-a", "A chat")
    writeChatStore(userA, storeWith(convo))

    const loaded = readChatStore(userA)
    expect(loaded.conversations).toHaveLength(1)
    expect(loaded.conversations[0]?.title).toBe("A chat")
    expect(loaded.activeId).toBe("c-a")
  })

  it("does not return User A chat when current owner is User B", () => {
    const userA = "user-a-id"
    const userB = "user-b-id"
    writeChatStore(userA, storeWith(sampleConversation("c-a", "Secret A")))

    const asB = readChatStore(userB)
    expect(asB.conversations).toHaveLength(0)
    expect(asB.activeId).toBeNull()

    // Keys remain isolated on disk
    expect(localStorage.getItem(getChatStorageKey(userA))).toContain("Secret A")
    expect(localStorage.getItem(getChatStorageKey(userB))).toBeNull()
  })

  it("does not expose User A chat to guest / logged-out owner", () => {
    const userA = "user-a-id"
    writeChatStore(userA, storeWith(sampleConversation("c-a", "Secret A")))

    const guest = readChatStore(null)
    expect(guest.conversations).toHaveLength(0)
    expect(guest.activeId).toBeNull()
    expect(getChatStorageKey(null)).toBe("iris-chat-v1:guest")
    expect(localStorage.getItem(getChatStorageKey(null))).toBeNull()
  })

  it("discards legacy global key and never migrates it into a user bucket", () => {
    const legacy = storeWith(sampleConversation("legacy", "Orphan legacy"))
    localStorage.setItem(LEGACY_CHAT_STORAGE_KEY, JSON.stringify(legacy))

    const userA = "user-a-id"
    const loaded = readChatStore(userA)
    expect(loaded.conversations).toHaveLength(0)
    expect(localStorage.getItem(LEGACY_CHAT_STORAGE_KEY)).toBeNull()

    // Writing as A still does not resurrect legacy into A
    writeChatStore(userA, storeWith(sampleConversation("c-a", "Fresh A")))
    discardLegacyGlobalChatStore()
    expect(localStorage.getItem(LEGACY_CHAT_STORAGE_KEY)).toBeNull()
    expect(readChatStore(userA).conversations[0]?.title).toBe("Fresh A")
    expect(readChatStore(null).conversations).toHaveLength(0)
  })

  it("uses distinct storage keys per owner", () => {
    expect(getChatStorageKey(null)).toBe("iris-chat-v1:guest")
    expect(getChatStorageKey("abc")).toBe("iris-chat-v1:user:abc")
    expect(getChatStorageKey("abc")).not.toBe(getChatStorageKey("def"))
  })

  it("normalizes missing conversation titles when reading storage", () => {
    const userA = "user-a-id"
    localStorage.setItem(
      getChatStorageKey(userA),
      JSON.stringify({
        version: 1,
        activeId: "broken",
        conversations: [
          {
            id: "broken",
            // title intentionally omitted — older / corrupted payloads
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            messages: [],
            history: [],
          },
        ],
      })
    )

    const loaded = readChatStore(userA)
    expect(loaded.conversations).toHaveLength(1)
    expect(loaded.conversations[0]?.title).toBe(NEW_CHAT_TITLE)
  })
})

describe("upsertConversation active + pin", () => {
  it("does not steal activeId when updating pin/rename metadata", () => {
    const active = sampleConversation("active", "Active")
    const other = { ...sampleConversation("other", "Other"), pinned: false }
    const store: ChatStore = {
      version: 1,
      conversations: [active, other],
      activeId: "active",
    }

    const next = upsertConversation(store, { ...other, pinned: true })
    expect(next.activeId).toBe("active")
    expect(next.conversations.find((c) => c.id === "other")?.pinned).toBe(true)
    expect(next.conversations[0]?.id).toBe("other")
  })

  it("sets activeId only when setActive is true", () => {
    const a = sampleConversation("a", "A")
    const b = sampleConversation("b", "B")
    const store: ChatStore = {
      version: 1,
      conversations: [a, b],
      activeId: "a",
    }

    const next = upsertConversation(
      store,
      { ...b, title: "B renamed", updatedAt: "2026-02-01T00:00:00.000Z" },
      { setActive: true }
    )
    expect(next.activeId).toBe("b")
  })

  it("sorts pinned conversations ahead of recent", () => {
    const recent = {
      ...sampleConversation("r", "Recent"),
      updatedAt: "2026-03-01T00:00:00.000Z",
    }
    const pinned = {
      ...sampleConversation("p", "Pinned"),
      pinned: true,
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    expect(sortConversations([recent, pinned]).map((c) => c.id)).toEqual([
      "p",
      "r",
    ])
  })

  it("resolveActiveConversation prefers activeId when still present", () => {
    const older = {
      ...sampleConversation("old", "Older"),
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    const newer = {
      ...sampleConversation("new", "Newer"),
      updatedAt: "2026-03-01T00:00:00.000Z",
    }
    const store: ChatStore = {
      version: 1,
      conversations: [newer, older],
      activeId: "old",
    }
    expect(resolveActiveConversation(store)?.id).toBe("old")
  })

  it("resolveActiveConversation keeps New chat blank when activeId is ephemeral", () => {
    const chat = sampleConversation("real", "Real")
    const store: ChatStore = {
      version: 1,
      conversations: [chat],
      activeId: "blank-uuid-not-in-list",
    }
    expect(resolveActiveConversation(store)).toBeNull()
  })

  it("resolveActiveConversation falls back to newest when activeId is missing", () => {
    const older = {
      ...sampleConversation("old", "Older"),
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    const newer = {
      ...sampleConversation("new", "Newer"),
      updatedAt: "2026-03-01T00:00:00.000Z",
    }
    const store: ChatStore = {
      version: 1,
      conversations: [older, newer],
      activeId: null,
    }
    expect(resolveActiveConversation(store)?.id).toBe("new")
  })

  it("resolvePersistedConversationTitle keeps a manual rename", () => {
    const existing = {
      ...sampleConversation("c1", "My renamed chat"),
      messages: [
        { id: "m1", role: "user" as const, content: "Should I long ETH?" },
        { id: "m2", role: "assistant" as const, content: "Stand aside." },
      ],
    }
    const nextMessages = [
      ...existing.messages,
      { id: "m3", role: "user" as const, content: "What about BTC?" },
    ]
    expect(resolvePersistedConversationTitle(existing, nextMessages)).toBe(
      "My renamed chat"
    )
  })

  it("resolvePersistedConversationTitle tracks auto titles from the first user message", () => {
    const existing = sampleConversation("c1", "Should I long ETH?")
    const nextMessages = [
      { id: "m1", role: "user" as const, content: "Should I long ETH?" },
      { id: "m2", role: "assistant" as const, content: "Stand aside." },
      { id: "m3", role: "user" as const, content: "And BTC?" },
    ]
    expect(resolvePersistedConversationTitle(existing, nextMessages)).toBe(
      "Should I long ETH?"
    )
  })
})
