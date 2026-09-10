import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  LEGACY_CHAT_STORAGE_KEY,
  discardLegacyGlobalChatStore,
  getChatStorageKey,
  readChatStore,
  writeChatStore,
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
})
