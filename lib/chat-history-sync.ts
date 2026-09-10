import {
  fetchAllCoPilotHistory,
  groupHistoryBySession,
  historyItemsToCoPilotMessages,
  historyItemsToUiMessages,
  sortHistoryItemsAsc,
  type ConversationHistoryItem,
} from "@/lib/api/chat-history"
import { parseServerMessageId, serverMessageId } from "@/lib/chat-message-id"
import {
  conversationTitleFromMessages,
  hasUserMessages,
  readChatStore,
  type ChatStore,
  type ChatUiMessage,
  type StoredConversation,
  upsertConversation,
  writeChatStore,
} from "@/lib/chat-storage"

function messageMatchKey(message: Pick<ChatUiMessage, "role" | "content">) {
  return `${message.role}:${message.content.trim()}`
}

function overlayLocalMessageFields(
  serverMessages: ChatUiMessage[],
  localMessages: ChatUiMessage[]
): ChatUiMessage[] {
  const localByServerId = new Map<number, ChatUiMessage>()
  const localByKey = new Map<string, ChatUiMessage>()

  for (const message of localMessages) {
    const serverId = parseServerMessageId(message.id)
    if (serverId) localByServerId.set(serverId, message)
    if (message.content.trim()) {
      localByKey.set(messageMatchKey(message), message)
    }
  }

  const merged = serverMessages.map((message) => {
    const serverId = parseServerMessageId(message.id)
    const local =
      (serverId ? localByServerId.get(serverId) : undefined) ??
      localByKey.get(messageMatchKey(message))
    if (!local) return message

    return {
      ...message,
      feedback: local.feedback,
      suggestedPrompts: local.suggestedPrompts,
      paperTicket: local.paperTicket,
    }
  })

  const serverKeys = new Set(serverMessages.map(messageMatchKey))
  for (const message of localMessages) {
    const isUiOnly =
      message.error ||
      message.paperTicket ||
      message.action === "retry" ||
      message.action === "connect" ||
      Boolean(message.suggestedPrompts?.length)
    if (!isUiOnly) continue
    if (!message.content.trim() && message.action !== "connect") continue
    if (serverKeys.has(messageMatchKey(message))) continue
    merged.push(message)
  }

  return merged
}

export function buildStoredConversationFromHistory(
  sessionId: string,
  items: ConversationHistoryItem[],
  local?: StoredConversation
): StoredConversation | null {
  const sorted = sortHistoryItemsAsc(items)
  const messages = historyItemsToUiMessages(sorted)
  if (!hasUserMessages(messages)) return null

  const history = historyItemsToCoPilotMessages(sorted)
  const createdAt = sorted[0]?.created_at ?? new Date().toISOString()
  const updatedAt = sorted[sorted.length - 1]?.created_at ?? createdAt
  const mergedMessages = local
    ? overlayLocalMessageFields(messages, local.messages)
    : messages

  return {
    id: sessionId,
    title: local?.title ?? conversationTitleFromMessages(mergedMessages),
    createdAt: local?.createdAt ?? createdAt,
    updatedAt,
    messages: mergedMessages,
    history,
  }
}

export function mergeServerHistoryIntoStore(
  local: ChatStore,
  items: ConversationHistoryItem[]
): ChatStore {
  const grouped = groupHistoryBySession(items)
  const serverConversations: StoredConversation[] = []

  for (const [sessionId, sessionItems] of grouped) {
    const localConversation = local.conversations.find((c) => c.id === sessionId)
    const built = buildStoredConversationFromHistory(
      sessionId,
      sessionItems,
      localConversation
    )
    if (built) serverConversations.push(built)
  }

  const serverIds = new Set(serverConversations.map((c) => c.id))
  const localOnly = local.conversations.filter(
    (conversation) =>
      !serverIds.has(conversation.id) && hasUserMessages(conversation.messages)
  )

  const conversations = [...localOnly, ...serverConversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )

  const activeId =
    local.activeId && conversations.some((c) => c.id === local.activeId)
      ? local.activeId
      : conversations[0]?.id ?? null

  return { version: 1, conversations, activeId }
}

export function remapMessagesWithServerHistory(
  messages: ChatUiMessage[],
  items: ConversationHistoryItem[]
): ChatUiMessage[] {
  const sorted = sortHistoryItemsAsc(items).filter(
    (item) =>
      (item.role === "user" || item.role === "assistant") &&
      item.content.trim().length > 0
  )
  const persisted = messages.filter(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      message.content.trim().length > 0
  )

  const idMap = new Map<string, string>()
  for (let index = 0; index < persisted.length; index += 1) {
    const local = persisted[index]
    const remote = sorted[index]
    if (!remote) break
    if (local.role !== remote.role) continue
    if (local.content.trim() !== remote.content.trim()) continue
    idMap.set(local.id, serverMessageId(remote.id))
  }

  if (idMap.size === 0) return messages
  return messages.map((message) => {
    const nextId = idMap.get(message.id)
    return nextId ? { ...message, id: nextId } : message
  })
}

export async function syncChatHistoryFromServer(
  ownerId: string,
  signal?: AbortSignal
): Promise<ChatStore> {
  const items = await fetchAllCoPilotHistory({ signal })
  const local = readChatStore(ownerId)
  const merged = mergeServerHistoryIntoStore(local, items)
  writeChatStore(ownerId, merged)
  return merged
}

export async function refreshSessionInStore(
  ownerId: string,
  sessionId: string,
  signal?: AbortSignal
): Promise<ChatStore> {
  const items = await fetchAllCoPilotHistory({ sessionId, signal })
  const local = readChatStore(ownerId)
  const localConversation = local.conversations.find((c) => c.id === sessionId)
  const built = buildStoredConversationFromHistory(
    sessionId,
    items,
    localConversation
  )

  if (!built) return local

  const remappedMessages = localConversation
    ? remapMessagesWithServerHistory(localConversation.messages, items)
    : built.messages

  const conversation: StoredConversation = {
    ...built,
    messages: overlayLocalMessageFields(built.messages, remappedMessages),
    title: built.title,
    createdAt: built.createdAt,
  }

  const merged = upsertConversation(local, conversation)
  writeChatStore(ownerId, merged)
  return merged
}
