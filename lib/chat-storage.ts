import type { CoPilotHistoryMessage, MessageQuote } from "@/lib/api/types"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import type { ChatClientActionSummary } from "@/lib/chat/client-tools"

export type ChatUiMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  /** Server `created_at` (RFC3339) — bubble clock; never invent with Date.now(). */
  createdAt?: string
  /** Server parent message id when this turn is a reply. */
  replyToId?: number
  /** Nested quote from live POST or GET /history. */
  replyTo?: MessageQuote
  error?: boolean
  /** Safe user-facing error line (credits / recovery). */
  errorText?: string
  /** Inline CTA rendered under the bubble (e.g. Continue with Google / Try again). */
  action?: "connect" | "retry"
  /** Validated trade signal for the chat card. */
  paperTicket?: PaperTradeTicket
  /** `no_trade` client action reason for the muted card. */
  noTradeReason?: string
  /** Summaries of frontend tools executed for this reply. */
  clientActionSummaries?: ChatClientActionSummary[]
  /** Present when `action` is `retry` — user text for that failed turn. */
  retryUserMessage?: string
  /** Optional follow-up chips returned by IRIS metadata. */
  suggestedPrompts?: string[]
  /** User quality signal for assistant replies. */
  feedback?: "up" | "down"
}

export type ChatMessageFeedback = NonNullable<ChatUiMessage["feedback"]>

export type StoredConversation = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatUiMessage[]
  history: CoPilotHistoryMessage[]
  pinned?: boolean
}

export type ChatStore = {
  version: 1
  conversations: StoredConversation[]
  activeId: string | null
  /** Session IDs the user deleted locally — kept so server history sync cannot revive them. */
  deletedIds?: string[]
}

/** Pre-Phase-0 global key — ownership cannot be proven; discard, never migrate. */
export const LEGACY_CHAT_STORAGE_KEY = "iris-chat-v1"

const STORAGE_KEY_PREFIX = "iris-chat-v1"
const WELCOME_DISMISSED_KEY = "iris-chat-welcome-dismissed"
const IRIS_CHAT_BADGE_DISMISSED_KEY = "iris-chat-badge-dismissed"
const MAX_CONVERSATIONS = 50
const MAX_DELETED_IDS = 200

export const CHAT_WELCOME_TEXT =
  "Ask in plain English: “Should I long ETH this candle?” I’ll use the live model board + news pulse."

/** Stable owner for chat persistence. `null` = guest / logged-out. */
export type ChatOwnerId = string | null

function emptyStore(): ChatStore {
  return { version: 1, conversations: [], activeId: null, deletedIds: [] }
}

function normalizeDeletedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .slice(-MAX_DELETED_IDS)
}

export function isConversationDeleted(store: ChatStore, id: string): boolean {
  return (store.deletedIds ?? []).includes(id)
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/**
 * Namespaced chat key. Prefer backend `User.id` for authenticated owners.
 * Guest uses a dedicated bucket so authenticated history is never rehydrated after logout.
 */
export function getChatStorageKey(ownerId: ChatOwnerId): string {
  if (!ownerId) return `${STORAGE_KEY_PREFIX}:guest`
  return `${STORAGE_KEY_PREFIX}:user:${ownerId}`
}

/**
 * Logout isolation is achieved by namespacing: guest/UI after logout must use
 * `readChatStore(null)`, which never reads `iris-chat-v1:user:{id}`.
 * Authenticated history is retained under the user key for same-account return.
 */
export function discardLegacyGlobalChatStore(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(LEGACY_CHAT_STORAGE_KEY)
  } catch {
    // private mode — ignore
  }
}

/** Remove one owner bucket (guest or user). Authenticated history is kept until logout clears guest only. */
export function clearChatStore(ownerId: ChatOwnerId): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(getChatStorageKey(ownerId))
  } catch {
    // private mode — ignore
  }
}

function parseStore(raw: string | null): ChatStore {
  if (!raw) return emptyStore()
  try {
    const parsed = JSON.parse(raw) as ChatStore
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.conversations)) {
      return emptyStore()
    }
    return {
      version: 1,
      conversations: parsed.conversations,
      activeId: parsed.activeId ?? null,
      deletedIds: normalizeDeletedIds(parsed.deletedIds),
    }
  } catch {
    return emptyStore()
  }
}

export function readChatStore(ownerId: ChatOwnerId): ChatStore {
  if (!canUseStorage()) return emptyStore()
  discardLegacyGlobalChatStore()
  try {
    return parseStore(window.localStorage.getItem(getChatStorageKey(ownerId)))
  } catch {
    return emptyStore()
  }
}

export function writeChatStore(ownerId: ChatOwnerId, store: ChatStore) {
  if (!canUseStorage()) return
  discardLegacyGlobalChatStore()
  try {
    window.localStorage.setItem(getChatStorageKey(ownerId), JSON.stringify(store))
  } catch {
    // quota / private mode — ignore
  }
}

/** Default conversation title sentinel — localize with workspace.newChat when displaying. */
export const NEW_CHAT_TITLE = "New chat"

export function conversationTitleFromMessages(messages: ChatUiMessage[]) {
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim())
  if (!firstUser) return NEW_CHAT_TITLE
  const text = firstUser.content.trim().replace(/\s+/g, " ")
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

export function hasUserMessages(messages: ChatUiMessage[]) {
  return messages.some((m) => m.role === "user" && m.content.trim())
}

/** Drop incomplete / noise rows before writing to localStorage. */
export function sanitizeMessages(messages: ChatUiMessage[]): ChatUiMessage[] {
  return messages.filter((m) => {
    if (m.id === "welcome") return false
    if (m.role === "system" && !m.error && m.action !== "connect") return false
    const text = m.content.trim()
    // Keep recoverable failed turns (may have empty content + retry CTA).
    if (m.error && m.action === "retry") return true
    // Signal-card turns can have empty output_text but a paperTicket.
    if (m.role === "assistant" && m.paperTicket) return true
    if (m.role === "assistant" && (!text || text === "(empty)")) return false
    return true
  })
}

/** Prefer API history when UI messages lost assistant replies. */
export function restoreMessages(
  messages: ChatUiMessage[] | undefined,
  history: CoPilotHistoryMessage[] | undefined
): ChatUiMessage[] {
  const cleaned = sanitizeMessages(messages ?? [])
  const hist = history ?? []

  const uiAssistants = cleaned.filter(
    (m) =>
      m.role === "assistant" &&
      ((m.content.trim() && m.content.trim() !== "(empty)") ||
        Boolean(m.paperTicket))
  ).length
  const histAssistants = hist.filter(
    (m) => m.role === "assistant" && m.content.trim()
  ).length

  if (histAssistants > uiAssistants) {
    const restored: ChatUiMessage[] = []
    for (const item of hist) {
      if (!item.content?.trim() || item.content.trim() === "(empty)") continue
      restored.push({
        id: crypto.randomUUID(),
        role: item.role,
        content: item.content,
      })
    }
    return restored
  }

  return cleaned
}

/** API history before a user message edit (drops that turn and everything after). */
export function truncateHistoryBeforeMessageIndex(
  messages: ChatUiMessage[],
  messageIndex: number,
  history: CoPilotHistoryMessage[]
): CoPilotHistoryMessage[] {
  const userCount = messages
    .slice(0, messageIndex)
    .filter((message) => message.role === "user").length

  const kept: CoPilotHistoryMessage[] = []
  let usersSeen = 0
  for (const item of history) {
    if (item.role === "user") {
      if (usersSeen >= userCount) break
      usersSeen++
    }
    kept.push(item)
  }
  return kept
}

export function isWelcomeDismissed() {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(WELCOME_DISMISSED_KEY) === "1"
}

export function dismissWelcome() {
  if (!canUseStorage()) return
  window.localStorage.setItem(WELCOME_DISMISSED_KEY, "1")
}

export function isIrisChatBadgeDismissed() {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(IRIS_CHAT_BADGE_DISMISSED_KEY) === "1"
}

export function dismissIrisChatBadge() {
  if (!canUseStorage()) return
  window.localStorage.setItem(IRIS_CHAT_BADGE_DISMISSED_KEY, "1")
}

export function sortConversations(
  conversations: StoredConversation[]
): StoredConversation[] {
  return [...conversations].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0
    const bPinned = b.pinned ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

/**
 * Insert or replace a conversation. By default does **not** change `activeId`
 * (pin/rename/session-list sync must not steal selection). Pass
 * `{ setActive: true }` when persisting the conversation the user is viewing.
 */
export function upsertConversation(
  store: ChatStore,
  conversation: StoredConversation,
  options?: { setActive?: boolean }
): ChatStore {
  if (isConversationDeleted(store, conversation.id)) {
    return store
  }
  const without = store.conversations.filter((c) => c.id !== conversation.id)
  const next = sortConversations([conversation, ...without]).slice(
    0,
    MAX_CONVERSATIONS
  )
  return {
    version: 1,
    conversations: next,
    activeId: options?.setActive ? conversation.id : store.activeId,
    deletedIds: store.deletedIds ?? [],
  }
}

export function deleteConversation(store: ChatStore, id: string): ChatStore {
  const conversations = store.conversations.filter((c) => c.id !== id)
  const deletedIds = normalizeDeletedIds([...(store.deletedIds ?? []), id])
  return {
    version: 1,
    conversations,
    activeId: store.activeId === id ? null : store.activeId,
    deletedIds,
  }
}

export function setActiveConversation(
  store: ChatStore,
  id: string | null
): ChatStore {
  return { ...store, activeId: id, deletedIds: store.deletedIds ?? [] }
}

export function formatChatTime(iso: string, locale?: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const now = Date.now()
  const diff = now - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  const tag = locale || undefined
  try {
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" })
    if (diff < minute) return rtf.format(0, "second")
    if (diff < hour) return rtf.format(-Math.floor(diff / minute), "minute")
    if (diff < day) return rtf.format(-Math.floor(diff / hour), "hour")
  } catch {
    if (diff < minute) return "Just now"
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`
    if (diff < day) return `${Math.floor(diff / hour)}h ago`
  }
  return date.toLocaleDateString(tag, {
    month: "short",
    day: "numeric",
  })
}
