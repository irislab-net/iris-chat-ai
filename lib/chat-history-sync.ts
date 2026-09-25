import {
  fetchAllCoPilotHistory,
  groupHistoryBySession,
  historyItemsToCoPilotMessages,
  historyItemsToUiMessages,
  isHistoryUiMessage,
  sortHistoryItemsAsc,
  type ConversationHistoryItem,
} from "@/lib/api/chat-history"
import { summarizeSignalUserMessage } from "@/lib/chat/composer-mentions"
import { isStructuredSignalSetupContent } from "@/lib/chat/parse-trade-setup"
import { stripMarketContextAppendix } from "@/lib/iris-paper-trade/prompt"
import { parseServerMessageId, serverMessageId } from "@/lib/chat-message-id"
import {
  conversationTitleFromMessages,
  hasUserMessages,
  isConversationDeleted,
  readChatStore,
  sortConversations,
  type ChatStore,
  type ChatUiMessage,
  type StoredConversation,
  upsertConversation,
  writeChatStore,
} from "@/lib/chat-storage"

function messageMatchKey(message: Pick<ChatUiMessage, "role" | "content">) {
  const content =
    message.role === "user"
      ? summarizeSignalUserMessage(message.content)
      : stripMarketContextAppendix(message.content)
  return `${message.role}:${content}`
}

function overlayLocalFields(
  serverMessage: ChatUiMessage,
  local?: ChatUiMessage
): ChatUiMessage {
  if (!local) return serverMessage

  const preferLocalContent =
    Boolean(local.paperTicket) &&
    Boolean(local.content.trim()) &&
    (!isStructuredSignalSetupContent(serverMessage.content) ||
      isStructuredSignalSetupContent(local.content))

  return {
    ...serverMessage,
    content: preferLocalContent ? local.content : serverMessage.content,
    feedback: local.feedback ?? serverMessage.feedback,
    suggestedPrompts: local.suggestedPrompts ?? serverMessage.suggestedPrompts,
    reasoning: serverMessage.reasoning ?? local.reasoning,
    thinkingTrace: local.thinkingTrace ?? serverMessage.thinkingTrace,
    // Server history `client_actions` is the source of truth for signal cards.
    paperTicket: serverMessage.paperTicket ?? local.paperTicket,
    noTradeReason: serverMessage.noTradeReason ?? local.noTradeReason,
    clientActionSummaries:
      serverMessage.clientActionSummaries ?? local.clientActionSummaries,
  }
}

/**
 * Re-attach locally cached signal cards after server history sync.
 * Prefer tickets hydrated from history `client_actions`; fall back to local
 * when the server turn has no card yet (legacy rows / race).
 */
export function mergeAssistantPaperTickets(
  localMessages: ChatUiMessage[],
  serverMessages: ChatUiMessage[]
): ChatUiMessage[] {
  const localAssistants = localMessages.filter(
    (message) => message.role === "assistant"
  )
  if (
    !localAssistants.some((message) => Boolean(message.paperTicket))
  ) {
    return serverMessages
  }

  let assistantIndex = 0
  const merged = serverMessages.map((message) => {
    if (message.role !== "assistant") return message
    const local = localAssistants[assistantIndex]
    assistantIndex += 1
    if (!local?.paperTicket) return message
    return {
      ...message,
      paperTicket: message.paperTicket ?? local.paperTicket,
      noTradeReason: message.noTradeReason ?? local.noTradeReason,
      content: message.content.trim()
        ? message.content
        : local.content || message.content,
    }
  })

  for (let index = assistantIndex; index < localAssistants.length; index += 1) {
    const local = localAssistants[index]
    if (!local?.paperTicket) continue
    merged.push(local)
  }

  return merged
}

function overlayLocalMessageFields(
  serverMessages: ChatUiMessage[],
  localMessages: ChatUiMessage[]
): ChatUiMessage[] {
  const localByServerId = new Map<number, ChatUiMessage>()
  const localByKey = new Map<string, ChatUiMessage>()
  const localAssistants = localMessages.filter(
    (message) =>
      message.role === "assistant" &&
      (Boolean(message.content.trim()) || Boolean(message.paperTicket))
  )

  for (const message of localMessages) {
    const serverId = parseServerMessageId(message.id)
    if (serverId) localByServerId.set(serverId, message)
    if (message.content.trim()) {
      localByKey.set(messageMatchKey(message), message)
    }
  }

  let assistantOrdinal = 0
  const usedLocalIds = new Set<string>()

  const merged = serverMessages.map((message) => {
    const serverId = parseServerMessageId(message.id)
    let local =
      (serverId ? localByServerId.get(serverId) : undefined) ??
      localByKey.get(messageMatchKey(message))

    if (!local && message.role === "assistant") {
      const candidate = localAssistants[assistantOrdinal]
      if (
        candidate &&
        (candidate.paperTicket ||
          candidate.feedback ||
          Boolean(candidate.suggestedPrompts?.length))
      ) {
        local = candidate
      }
    }

    if (message.role === "assistant") {
      assistantOrdinal += 1
    }

    if (local) usedLocalIds.add(local.id)
    return overlayLocalFields(message, local)
  })

  const serverKeys = new Set(serverMessages.map(messageMatchKey))
  for (const message of localMessages) {
    if (usedLocalIds.has(message.id)) continue
    const isUiOnly =
      message.error ||
      message.action === "retry" ||
      message.action === "connect" ||
      Boolean(message.suggestedPrompts?.length) ||
      Boolean(message.paperTicket)
    if (!isUiOnly) continue
    if (
      !message.content.trim() &&
      message.action !== "connect" &&
      !message.paperTicket
    ) {
      continue
    }
    if (message.content.trim() && serverKeys.has(messageMatchKey(message))) {
      continue
    }
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
    ? mergeAssistantPaperTickets(
        local.messages,
        overlayLocalMessageFields(messages, local.messages)
      )
    : messages

  return {
    id: sessionId,
    title: local?.title ?? conversationTitleFromMessages(mergedMessages),
    createdAt: local?.createdAt ?? createdAt,
    updatedAt,
    messages: mergedMessages,
    history,
    // Keep local pin across history refresh — server pin arrives via session list.
    pinned: local?.pinned,
  }
}

export function mergeServerHistoryIntoStore(
  local: ChatStore,
  items: ConversationHistoryItem[]
): ChatStore {
  const deletedIds = local.deletedIds ?? []
  const deleted = new Set(deletedIds)
  const grouped = groupHistoryBySession(items)
  const serverConversations: StoredConversation[] = []

  for (const [sessionId, sessionItems] of grouped) {
    if (deleted.has(sessionId)) continue
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
      !deleted.has(conversation.id) &&
      !serverIds.has(conversation.id) &&
      hasUserMessages(conversation.messages)
  )

  const conversations = sortConversations([
    ...localOnly,
    ...serverConversations,
  ])

  const activeId =
    local.activeId && conversations.some((c) => c.id === local.activeId)
      ? local.activeId
      : null

  return { version: 1, conversations, activeId, deletedIds }
}

export function remapMessagesWithServerHistory(
  messages: ChatUiMessage[],
  items: ConversationHistoryItem[]
): ChatUiMessage[] {
  const sorted = sortHistoryItemsAsc(items).filter(isHistoryUiMessage)
  const persisted = messages.filter(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      (message.content.trim().length > 0 ||
        Boolean(message.paperTicket) ||
        Boolean(message.noTradeReason))
  )

  const idMap = new Map<string, string>()
  for (let index = 0; index < persisted.length; index += 1) {
    const local = persisted[index]
    const remote = sorted[index]
    if (!remote) break
    if (local.role !== remote.role) continue

    const localContent =
      local.role === "user"
        ? summarizeSignalUserMessage(local.content.trim())
        : local.content.trim()
    const remoteContent =
      remote.role === "user"
        ? summarizeSignalUserMessage(remote.content.trim())
        : remote.content.trim()

    // Signal-only turns may both have empty content — still remap by ordinal.
    if (
      localContent !== remoteContent &&
      !(localContent === "" && remoteContent === "")
    ) {
      continue
    }
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
  const local = readChatStore(ownerId)
  if (isConversationDeleted(local, sessionId)) return local

  const items = await fetchAllCoPilotHistory({ sessionId, signal })
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
    messages: mergeAssistantPaperTickets(
      localConversation?.messages ?? remappedMessages,
      overlayLocalMessageFields(built.messages, remappedMessages)
    ),
    title: built.title,
    createdAt: built.createdAt,
    pinned: localConversation?.pinned ?? built.pinned,
  }

  // Refresh must not steal selection when the user has another chat open.
  const merged = upsertConversation(local, conversation)
  writeChatStore(ownerId, merged)
  return merged
}
