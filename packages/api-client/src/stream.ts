import {
  adaptChatMessageResponse,
  normalizeChatErrorCode,
  toChatApiEffort,
  toGuestClientContext,
} from "./chat-helpers"
import type { ApiClientConfig } from "./config"
import { createChatFetch } from "./fetch"
import { joinReasoningTexts, readChatSseStream } from "./sse"
import type {
  ChatClientContext,
  ChatMessageResponse,
  CoPilotChatJsonResponse,
  CoPilotEffort,
  CoPilotHistoryMessage,
} from "./types"

export const CHAT_STREAM_TIMEOUT_MS = 180_000

function mergeAbortSignals(
  primary: AbortSignal | undefined,
  secondary: AbortSignal
): AbortSignal {
  if (!primary) return secondary
  if (primary.aborted) return primary
  if (secondary.aborted) return secondary
  const controller = new AbortController()
  const abort = (signal: AbortSignal) => {
    if (controller.signal.aborted) return
    controller.abort(signal.reason)
  }
  primary.addEventListener("abort", () => abort(primary), { once: true })
  secondary.addEventListener("abort", () => abort(secondary), { once: true })
  return controller.signal
}

function createChatTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal
  clear: () => void
} {
  const controller = new AbortController()
  const id = setTimeout(() => {
    controller.abort(new DOMException("Chat request timed out", "TimeoutError"))
  }, timeoutMs)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  }
}

export type StreamChatInput = {
  message: string
  conversationId: string
  history?: CoPilotHistoryMessage[]
  effort?: CoPilotEffort
  clientContext?: ChatClientContext
  replyToId?: number
  signal?: AbortSignal
  isGuest?: boolean
  onReasoning?: (text: string) => void
  onTool?: (tool: string) => void
}

export function createChatStreamer(config: ApiClientConfig) {
  const { chatApiFetch, unwrapChatPayload } = createChatFetch(config)

  async function streamChat(
    input: StreamChatInput
  ): Promise<CoPilotChatJsonResponse> {
    const timeout = createChatTimeoutSignal(CHAT_STREAM_TIMEOUT_MS)
    const signal = mergeAbortSignals(input.signal, timeout.signal)
    const isGuest =
      input.isGuest ?? !(await config.tokenStore.getAccessToken())
    const baseContext = input.clientContext ?? {
      active_page: "chat",
      active_symbol: "",
      role: "user",
      available_ui_actions: ["show_trade_signal"],
    }
    const clientContext = isGuest
      ? toGuestClientContext(baseContext)
      : baseContext

    try {
      const res = await chatApiFetch("/message/stream", {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: JSON.stringify({
          session_id: input.conversationId,
          message: input.message,
          effort: isGuest ? "normal" : toChatApiEffort(input.effort),
          client_context: clientContext,
          ...(input.replyToId != null && input.replyToId > 0
            ? { reply_to_id: input.replyToId }
            : {}),
        }),
        signal,
      })

      const contentType = res.headers.get("content-type") || ""
      if (!res.ok || !contentType.includes("text/event-stream")) {
        const raw = await res.json().catch(() => ({}))
        const payload = unwrapChatPayload<
          ChatMessageResponse & { error?: string }
        >(raw)
        const adapted = adaptChatMessageResponse(payload)
        const code = normalizeChatErrorCode(
          payload.code ?? adapted.code ?? (raw as { code?: string }).code
        )
        throw Object.assign(
          new Error(
            payload.error || adapted.message || `HTTP ${res.status}`
          ),
          {
            status: res.status,
            body: raw,
            ...(code ? { code } : {}),
            trial: payload.trial ?? adapted.trial,
          }
        )
      }

      let donePayload: ChatMessageResponse | undefined
      const reasoningParts: string[] = []

      await readChatSseStream(
        res.body,
        (event) => {
          if (event.event === "reasoning") {
            reasoningParts.push(event.data.text)
            input.onReasoning?.(event.data.text)
            return
          }
          if (event.event === "tool") {
            input.onTool?.(event.data.tool)
            return
          }
          if (event.event === "error") {
            throw Object.assign(new Error(event.data.message), {
              code: event.data.code,
            })
          }
          if (event.event === "done") {
            donePayload = event.data
          }
        },
        signal
      )

      if (!donePayload) throw new Error("stream closed without done")

      const adapted = adaptChatMessageResponse(donePayload)
      const liveReasoning = joinReasoningTexts(reasoningParts)
      const reasoning =
        adapted.reasoning || (liveReasoning ? liveReasoning : undefined)

      return {
        ...adapted,
        ...(reasoning ? { reasoning } : {}),
      }
    } finally {
      timeout.clear()
    }
  }

  return { streamChat, chatApiFetch }
}
