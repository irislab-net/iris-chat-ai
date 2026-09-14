import type { ChatUiMessage } from "@/lib/chat-storage"

function formatConversationTranscript(messages: ChatUiMessage[]): string {
  return messages
    .filter(
      (message) =>
        message.content.trim().length > 0 &&
        (message.role === "user" || message.role === "assistant")
    )
    .map((message) => {
      const speaker = message.role === "user" ? "You" : "Exur"
      return `${speaker}:\n${message.content.trim()}`
    })
    .join("\n\n")
}

export { formatConversationTranscript }
