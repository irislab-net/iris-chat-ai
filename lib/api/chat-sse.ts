import type { ChatMessageResponse } from "@/lib/api/types"

export type ChatSseReasoningEvent = {
  event: "reasoning"
  data: { text: string }
}

export type ChatSseToolEvent = {
  event: "tool"
  data: { tool: string }
}

export type ChatSseErrorEvent = {
  event: "error"
  data: { message: string; code?: string }
}

export type ChatSseDoneEvent = {
  event: "done"
  data: ChatMessageResponse
}

export type ChatSseEvent =
  | ChatSseReasoningEvent
  | ChatSseToolEvent
  | ChatSseErrorEvent
  | ChatSseDoneEvent

export type ChatThinkingStep =
  | { type: "reasoning"; text: string }
  | { type: "tool"; name: string }

/** Parse one SSE record (`event:` + `data:` + blank line). */
export function parseChatSseBlock(block: string): ChatSseEvent | null {
  const trimmed = block.trim()
  if (!trimmed || trimmed.startsWith(":")) return null

  let event = "message"
  const dataLines: string[] = []
  for (const rawLine of trimmed.split("\n")) {
    const line = rawLine.replace(/\r$/, "")
    if (line.startsWith("event:")) {
      event = line.slice(6).trim()
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (!dataLines.length) return null

  let data: unknown
  try {
    data = JSON.parse(dataLines.join("\n"))
  } catch {
    return null
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const record = data as Record<string, unknown>

  if (event === "reasoning") {
    if (typeof record.text !== "string") return null
    return { event: "reasoning", data: { text: record.text } }
  }
  if (event === "tool") {
    if (typeof record.tool !== "string" || !record.tool.trim()) return null
    return { event: "tool", data: { tool: record.tool.trim() } }
  }
  if (event === "error") {
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message.trim()
        : "Chat stream failed"
    const code =
      typeof record.code === "string" && record.code.trim()
        ? record.code.trim()
        : undefined
    return { event: "error", data: { message, ...(code ? { code } : {}) } }
  }
  if (event === "done") {
    return { event: "done", data: data as ChatMessageResponse }
  }

  return null
}

export async function readChatSseStream(
  body: ReadableStream<Uint8Array> | null,
  onEvent: (event: ChatSseEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!body) throw new Error("stream closed without body")

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const abort = () => {
    void reader.cancel().catch(() => {})
  }
  signal?.addEventListener("abort", abort, { once: true })

  try {
    while (true) {
      if (signal?.aborted) {
        throw signal.reason instanceof Error
          ? signal.reason
          : new DOMException("Aborted", "AbortError")
      }
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split("\n\n")
      buffer = parts.pop() || ""
      for (const part of parts) {
        const event = parseChatSseBlock(part)
        if (event) onEvent(event)
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      const event = parseChatSseBlock(buffer)
      if (event) onEvent(event)
    }
  } finally {
    signal?.removeEventListener("abort", abort)
    reader.releaseLock()
  }
}

export function appendThinkingStep(
  steps: ChatThinkingStep[] | undefined,
  step: ChatThinkingStep
): ChatThinkingStep[] {
  return [...(steps ?? []), step]
}

export function joinReasoningTexts(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n")
}
