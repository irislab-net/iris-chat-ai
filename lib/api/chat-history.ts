import { chatApiFetch } from "@/lib/api/chat-client"
import { unwrapChatPayload } from "@/lib/api/chat"
import type {
  ChatToolCallResult,
  CoPilotHistoryMessage,
  MessageQuote,
} from "@/lib/api/types"
import { summarizeSignalUserMessage } from "@/lib/chat/composer-mentions"
import { executeChatClientActions } from "@/lib/chat/client-tools"
import { stripMarketContextAppendix } from "@/lib/iris-paper-trade/prompt"
import { serverMessageId } from "@/lib/chat-message-id"
import type { ChatUiMessage } from "@/lib/chat-storage"

export type ConversationHistoryItem = {
  id: number
  session_id: string
  role: "user" | "assistant" | "system" | string
  content: string
  created_at: string
  reply_to_id?: number
  reply_to?: MessageQuote
  /** Persisted client tools (e.g. show_trade_signal) — source of truth for signal cards. */
  client_actions?: ChatToolCallResult[]
  /** Joined model reasoning when the server stores it on history rows. */
  reasoning?: string
}

export type ConversationHistoryResult = {
  items: ConversationHistoryItem[]
  limit: number
  offset: number
  total: number
}

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGES = 20

function normalizeClientActions(
  value: unknown
): ChatToolCallResult[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined

  const actions: ChatToolCallResult[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue
    const item = raw as Record<string, unknown>
    if (typeof item.tool_name !== "string" || !item.tool_name.trim()) continue

    const target =
      item.execution_target === "server" || item.execution_target === "client"
        ? item.execution_target
        : "client"

    const input = item.input
    let normalizedInput: string | Record<string, unknown> = {}
    if (typeof input === "string") {
      normalizedInput = input
    } else if (input && typeof input === "object" && !Array.isArray(input)) {
      normalizedInput = input as Record<string, unknown>
    } else if (input != null) {
      continue
    }

    actions.push({
      tool_name: item.tool_name.trim(),
      execution_target: target,
      input: normalizedInput,
      ...(typeof item.output === "string" ? { output: item.output } : {}),
    })
  }

  return actions.length > 0 ? actions : undefined
}

function normalizeHistoryItem(raw: unknown): ConversationHistoryItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const item = raw as Record<string, unknown>
  if (typeof item.id !== "number" || !Number.isFinite(item.id)) return null
  if (typeof item.session_id !== "string" || !item.session_id.trim())
    return null
  if (typeof item.content !== "string") return null
  if (typeof item.created_at !== "string" || !item.created_at.trim())
    return null
  if (typeof item.role !== "string" || !item.role.trim()) return null

  const clientActions = normalizeClientActions(item.client_actions)
  const replyToId =
    typeof item.reply_to_id === "number" && Number.isFinite(item.reply_to_id)
      ? item.reply_to_id
      : undefined
  const replyTo =
    item.reply_to && typeof item.reply_to === "object"
      ? (item.reply_to as MessageQuote)
      : undefined
  const reasoning =
    typeof item.reasoning === "string" && item.reasoning.trim()
      ? item.reasoning.trim()
      : undefined

  return {
    id: item.id,
    session_id: item.session_id,
    role: item.role,
    content: item.content,
    created_at: item.created_at,
    ...(replyToId != null ? { reply_to_id: replyToId } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(clientActions ? { client_actions: clientActions } : {}),
    ...(reasoning ? { reasoning } : {}),
  }
}

function normalizeHistoryResult(body: unknown): ConversationHistoryResult {
  const payload = unwrapChatPayload<{ history?: ConversationHistoryResult }>(
    body
  )
  const history = payload.history ?? (payload as ConversationHistoryResult)
  if (!history || !Array.isArray(history.items)) {
    return { items: [], limit: 0, offset: 0, total: 0 }
  }
  const items = history.items
    .map(normalizeHistoryItem)
    .filter((item): item is ConversationHistoryItem => item != null)
  return {
    items,
    limit: Number(history.limit) || 0,
    offset: Number(history.offset) || 0,
    total: Number(history.total) || items.length,
  }
}

function historyItemHasClientSignal(item: ConversationHistoryItem): boolean {
  return (item.client_actions ?? []).some(
    (action) =>
      action.execution_target !== "server" &&
      (action.tool_name === "show_trade_signal" ||
        action.tool_name === "no_trade")
  )
}

/** Keep text turns and signal-only assistant turns (empty output_text + client_actions). */
export function isHistoryUiMessage(item: ConversationHistoryItem): boolean {
  if (item.role !== "user" && item.role !== "assistant") return false
  if (item.content.trim().length > 0) return true
  return item.role === "assistant" && historyItemHasClientSignal(item)
}

export async function fetchCoPilotHistoryPage(input?: {
  limit?: number
  offset?: number
  sessionId?: string
  signal?: AbortSignal
}): Promise<ConversationHistoryResult> {
  const params = new URLSearchParams()
  const limit = input?.limit ?? DEFAULT_PAGE_SIZE
  params.set("limit", String(limit))
  params.set("offset", String(input?.offset ?? 0))
  if (input?.sessionId) params.set("session_id", input.sessionId)

  const res = await chatApiFetch(`/history?${params}`, {
    signal: input?.signal,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(
      new Error(
        (body as { error?: string }).error || `history failed ${res.status}`
      ),
      { status: res.status, body }
    )
  }
  return normalizeHistoryResult(body)
}

export async function fetchAllCoPilotHistory(input?: {
  sessionId?: string
  signal?: AbortSignal
}): Promise<ConversationHistoryItem[]> {
  const items: ConversationHistoryItem[] = []
  let offset = 0

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchCoPilotHistoryPage({
      limit: DEFAULT_PAGE_SIZE,
      offset,
      sessionId: input?.sessionId,
      signal: input?.signal,
    })
    if (result.items.length === 0) break
    items.push(...result.items)
    offset += result.items.length
    if (offset >= result.total) break
  }

  return items
}

export function groupHistoryBySession(
  items: ConversationHistoryItem[]
): Map<string, ConversationHistoryItem[]> {
  const grouped = new Map<string, ConversationHistoryItem[]>()
  for (const item of items) {
    const list = grouped.get(item.session_id) ?? []
    list.push(item)
    grouped.set(item.session_id, list)
  }
  return grouped
}

export function sortHistoryItemsAsc(items: ConversationHistoryItem[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function historyItemsToCoPilotMessages(
  items: ConversationHistoryItem[]
): CoPilotHistoryMessage[] {
  return sortHistoryItemsAsc(items)
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        item.content.trim().length > 0
    )
    .map((item) => ({
      role: item.role as CoPilotHistoryMessage["role"],
      content: item.content,
    }))
}

export function historyItemsToUiMessages(
  items: ConversationHistoryItem[]
): ChatUiMessage[] {
  return sortHistoryItemsAsc(items)
    .filter(isHistoryUiMessage)
    .map((item) => {
      const clientResult =
        item.role === "assistant"
          ? executeChatClientActions(item.client_actions)
          : null
      const content =
        item.role === "user"
          ? summarizeSignalUserMessage(item.content)
          : stripMarketContextAppendix(item.content)

      return {
        id: serverMessageId(item.id),
        role: item.role as "user" | "assistant",
        content,
        createdAt: item.created_at,
        ...(item.reply_to_id != null ? { replyToId: item.reply_to_id } : {}),
        ...(item.reply_to ? { replyTo: item.reply_to } : {}),
        ...(item.reasoning ? { reasoning: item.reasoning } : {}),
        ...(clientResult?.paperTicket
          ? { paperTicket: clientResult.paperTicket }
          : {}),
        ...(clientResult?.noTradeReason
          ? { noTradeReason: clientResult.noTradeReason }
          : {}),
        ...(clientResult?.summaries.length
          ? { clientActionSummaries: clientResult.summaries }
          : {}),
      }
    })
}
