import { chatApiFetch } from "@/lib/api/chat-client"
import { parseServerMessageId } from "@/lib/chat-message-id"
import type { ChatMessageFeedback } from "@/lib/chat-storage"

export type ChatFeedbackVote = ChatMessageFeedback | null

export async function submitChatMessageFeedback(input: {
  sessionId: string
  messageId: string
  vote: ChatFeedbackVote
}): Promise<boolean> {
  const messageId = parseServerMessageId(input.messageId)
  if (!messageId) return false

  const res = await chatApiFetch("/feedback", {
    method: "POST",
    body: JSON.stringify({
      session_id: input.sessionId,
      message_id: messageId,
      vote: input.vote,
    }),
  })

  if (res.status === 404 || res.status === 501 || res.status === 405) {
    return false
  }

  return res.ok
}
