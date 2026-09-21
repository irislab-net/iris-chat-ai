import type { MessageQuote, PersistedMessageRef } from "@/lib/api/types"
import { parseServerMessageId, serverMessageId } from "@/lib/chat-message-id"
import type { ChatUiMessage } from "@/lib/chat-storage"

/** Apply server id + created_at (+ reply quote) onto a UI bubble. */
export function stampUiMessageFromRef(
  message: ChatUiMessage,
  ref: PersistedMessageRef | undefined
): ChatUiMessage {
  if (!ref || !(ref.id > 0)) return message
  return {
    ...message,
    id: serverMessageId(ref.id),
    createdAt: ref.created_at,
    ...(ref.reply_to_id != null ? { replyToId: ref.reply_to_id } : {}),
    ...(ref.reply_to ? { replyTo: ref.reply_to } : {}),
  }
}

export function replyTargetFromMessage(message: ChatUiMessage): {
  id: number
  role: "user" | "assistant"
  excerpt: string
  createdAt: string
} | null {
  const id = parseServerMessageId(message.id)
  if (id == null || (message.role !== "user" && message.role !== "assistant")) {
    return null
  }
  const excerpt = message.content.trim().slice(0, 240)
  if (!excerpt) return null
  return {
    id,
    role: message.role,
    excerpt,
    createdAt: message.createdAt ?? "",
  }
}

export function quoteFromReplyTarget(target: {
  id: number
  role: "user" | "assistant"
  excerpt: string
  createdAt: string
}): MessageQuote {
  return {
    id: target.id,
    role: target.role,
    excerpt: target.excerpt,
    created_at: target.createdAt,
  }
}
