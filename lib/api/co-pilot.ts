import { getStoredAccessToken } from "@/lib/api/auth"
import { chatApiFetch } from "@/lib/api/chat-client"
import {
  adaptChatMessageResponse,
  creditsToUsageResponse,
  toChatApiEffort,
  toGuestClientContext,
  unwrapChatPayload,
} from "@/lib/api/chat"
import {
  joinReasoningTexts,
  readChatSseStream,
} from "@/lib/api/chat-sse"
import type {
  ChatClientContext,
  ChatMessageResponse,
  CoPilotChatJsonResponse,
  CoPilotChatRequest,
  CoPilotHistoryMessage,
  CoPilotUsage,
  TrialInfo,
} from "@/lib/api/types"
import { isGuestChatSession } from "@/lib/chat-auth-session"
import { ensureGuestSession } from "@/lib/guest-chat"

/** Abort chat POSTs that hang without a response body. */
export const CHAT_REQUEST_TIMEOUT_MS = 90_000

/** Streaming turns can run longer than a single JSON `/message` call. */
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
    controller.abort(
      new DOMException("Chat request timed out", "TimeoutError")
    )
  }, timeoutMs)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  }
}

function chatErrorPayload(raw: unknown) {
  const payload = unwrapChatPayload<{
    error?: string
    code?: string
    trial?: TrialInfo
  }>(raw)
  return {
    message: payload.error || "Chat request failed",
    code: payload.code ?? (raw as { code?: string }).code,
    trial: payload.trial ?? (raw as { trial?: TrialInfo }).trial,
  }
}

export async function fetchCoPilotUsage() {
  const res = await chatApiFetch("/credits")
  const data = await res.json().catch(() => ({}))
  const mapped = creditsToUsageResponse(data)
  if (!res.ok) {
    const err = chatErrorPayload(data)
    throw Object.assign(new Error(mapped.error || err.message || `usage failed ${res.status}`), {
      status: res.status,
      body: data,
      code: err.code,
      trial: err.trial ?? mapped.trial,
    })
  }
  return mapped
}

export type StreamCoPilotChatHandlers = {
  onMeta?: (meta: {
    usage?: CoPilotUsage
    conversation_id?: string
  }) => void
  onDelta?: (delta: string, full: string) => void
  onReasoning?: (text: string) => void
  onTool?: (tool: string) => void
  onUsageHeaders?: (usage: CoPilotUsage) => void
  signal?: AbortSignal
}

export type CoPilotSessionRefresh = {
  refreshSession?: () => Promise<void>
  refreshAfterUpgrade?: () => Promise<void>
}

export async function sendCoPilotChat(input: {
  message: string
  conversationId: string
  history: CoPilotHistoryMessage[]
  signal?: AbortSignal
  effort?: CoPilotChatRequest["effort"]
  clientContext?: ChatClientContext
  tools?: CoPilotChatRequest["tools"]
  toolChoice?: CoPilotChatRequest["tool_choice"]
  parallelToolCalls?: boolean
  instructions?: string
  /** Server message id to reply to (omit / 0 = normal turn). */
  replyToId?: number
}): Promise<CoPilotChatJsonResponse> {
  const timeout = createChatTimeoutSignal(CHAT_REQUEST_TIMEOUT_MS)
  const signal = mergeAbortSignals(input.signal, timeout.signal)
  const isGuest = isGuestChatSession()
  const baseContext =
    input.clientContext ?? {
      active_page: "chat",
      active_symbol: "",
      role: "user",
      available_ui_actions: ["show_trade_signal"],
    }
  const clientContext = isGuest
    ? toGuestClientContext(baseContext)
    : baseContext

  try {
    const res = await chatApiFetch("/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: input.conversationId,
        message: input.message,
        effort: isGuest ? "normal" : toChatApiEffort(input.effort),
        client_context: clientContext,
        ...(input.replyToId != null && input.replyToId > 0
          ? { reply_to_id: input.replyToId }
          : {}),
        ...(input.instructions ? { instructions: input.instructions } : {}),
        ...(input.tools?.length ? { tools: input.tools } : {}),
        ...(input.toolChoice ? { tool_choice: input.toolChoice } : {}),
        ...(input.parallelToolCalls !== undefined
          ? { parallel_tool_calls: input.parallelToolCalls }
          : {}),
      }),
      signal,
    })
    const raw = await res.json().catch(() => ({}))
    const payload = unwrapChatPayload<ChatMessageResponse & { error?: string }>(raw)
    const adapted = adaptChatMessageResponse(payload)

    if (!res.ok) {
      const err = chatErrorPayload(raw)
      throw Object.assign(
        new Error(payload.error || err.message || adapted.message || `HTTP ${res.status}`),
        {
          status: res.status,
          body: raw,
          code: err.code ?? adapted.code,
          trial: err.trial ?? adapted.trial,
        }
      )
    }

    return adapted
  } finally {
    timeout.clear()
  }
}

export async function sendCoPilotChatWithSessionRetry(
  input: Parameters<typeof sendCoPilotChat>[0],
  session?: CoPilotSessionRefresh
): Promise<CoPilotChatJsonResponse> {
  try {
    return await sendCoPilotChat(input)
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    const code = (error as { code?: string } | null)?.code
    if (status === 403 && code === "login_required") throw error

    if (
      status === 402 &&
      !isGuestChatSession() &&
      session?.refreshAfterUpgrade
    ) {
      await session.refreshAfterUpgrade()
      return await sendCoPilotChat(input)
    }

    if (status !== 401) throw error

    if (isGuestChatSession()) {
      await ensureGuestSession()
    } else if (getStoredAccessToken() && session?.refreshSession) {
      await session.refreshSession()
      if (!getStoredAccessToken()) throw error
    } else {
      await ensureGuestSession()
    }
    return await sendCoPilotChat(input)
  }
}

async function streamCoPilotChatOnce(input: {
  message: string
  conversationId: string
  history: CoPilotHistoryMessage[]
  signal?: AbortSignal
  effort?: CoPilotChatRequest["effort"]
  clientContext?: ChatClientContext
  replyToId?: number
  onReasoning?: (text: string) => void
  onTool?: (tool: string) => void
}): Promise<CoPilotChatJsonResponse> {
  const timeout = createChatTimeoutSignal(CHAT_STREAM_TIMEOUT_MS)
  const signal = mergeAbortSignals(input.signal, timeout.signal)
  const isGuest = isGuestChatSession()
  const baseContext =
    input.clientContext ?? {
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
      headers: {
        Accept: "text/event-stream",
      },
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
      const payload = unwrapChatPayload<ChatMessageResponse & { error?: string }>(
        raw
      )
      const adapted = adaptChatMessageResponse(payload)
      const err = chatErrorPayload(raw)
      const code = err.code ?? adapted.code

      // Older gateways may not support SSE yet — fall back to JSON /message.
      if (res.status === 404 || code === "stream_unsupported") {
        return await sendCoPilotChat({
          message: input.message,
          conversationId: input.conversationId,
          history: input.history,
          effort: input.effort,
          clientContext: input.clientContext,
          replyToId: input.replyToId,
          signal: input.signal,
        })
      }

      throw Object.assign(
        new Error(
          payload.error || err.message || adapted.message || `HTTP ${res.status}`
        ),
        {
          status: res.status,
          body: raw,
          code,
          trial: err.trial ?? adapted.trial,
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

    if (!donePayload) {
      throw new Error("stream closed without done")
    }

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

export async function streamCoPilotChatWithSessionRetry(
  input: Parameters<typeof streamCoPilotChatOnce>[0],
  session?: CoPilotSessionRefresh
): Promise<CoPilotChatJsonResponse> {
  try {
    return await streamCoPilotChatOnce(input)
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    const code = (error as { code?: string } | null)?.code
    if (status === 403 && code === "login_required") throw error

    if (
      status === 402 &&
      !isGuestChatSession() &&
      session?.refreshAfterUpgrade
    ) {
      await session.refreshAfterUpgrade()
      return await streamCoPilotChatOnce(input)
    }

    if (status !== 401) throw error

    if (isGuestChatSession()) {
      await ensureGuestSession()
    } else if (getStoredAccessToken() && session?.refreshSession) {
      await session.refreshSession()
      if (!getStoredAccessToken()) throw error
    } else {
      await ensureGuestSession()
    }
    return await streamCoPilotChatOnce(input)
  }
}

export async function streamCoPilotChat(
  input: {
    message: string
    conversationId: string
    history: CoPilotHistoryMessage[]
    effort?: CoPilotChatRequest["effort"]
    clientContext?: ChatClientContext
    replyToId?: number
  },
  handlers: StreamCoPilotChatHandlers = {},
  session?: CoPilotSessionRefresh
) {
  const data = await streamCoPilotChatWithSessionRetry(
    {
      message: input.message,
      conversationId: input.conversationId,
      history: input.history,
      effort: input.effort,
      clientContext: input.clientContext,
      replyToId: input.replyToId,
      signal: handlers.signal,
      onReasoning: handlers.onReasoning,
      onTool: handlers.onTool,
    },
    session
  )

  const conversationId = data.conversation_id || input.conversationId
  if (data.usage || data.conversation_id) {
    handlers.onMeta?.({
      usage: data.usage,
      conversation_id: data.conversation_id,
    })
  }

  const message = (data.message || data.output_text || "").trim()
  return {
    message,
    reasoning: data.reasoning,
    conversationId,
    clientActions: data.client_actions,
    suggestedPrompts: data.suggestedPrompts,
    trial: data.trial,
    usage: data.usage,
    creditBalance: data.credit_balance,
    userMessage: data.user_message,
    assistantMessage: data.assistant_message,
  }
}

export function formatCoPilotUsage(usage: CoPilotUsage) {
  return `${usage.plan} · ${usage.used}/${usage.limit} used · ${usage.remaining} left`
}
