import { apiFetch } from "@/lib/api/client"
import { CHAT_API_BASE, unwrapChatPayload } from "@/lib/api/chat"
import type { CoPilotHistoryMessage } from "@/lib/api/types"
import { serverMessageId } from "@/lib/chat-message-id"

export type ConversationHistoryItem = {
  id: number
  session_id: string
  role: "user" | "assistant" | "system" | string
  content: string
  created_at: string
}

export type ConversationHistoryResult = {
  items: ConversationHistoryItem[]
  limit: number
  offset: number
  total: number
}

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGES = 20

function normalizeHistoryResult(body: unknown): ConversationHistoryResult {
  const payload = unwrapChatPayload<{ history?: ConversationHistoryResult }>(body)
  const history = payload.history ?? (payload as ConversationHistoryResult)
  if (!history || !Array.isArray(history.items)) {
    return { items: [], limit: 0, offset: 0, total: 0 }
  }
  return {
    items: history.items.filter(
      (item): item is ConversationHistoryItem =>
        Boolean(item) &&
        typeof item.id === "number" &&
        typeof item.session_id === "string" &&
        typeof item.content === "string"
    ),
    limit: Number(history.limit) || 0,
    offset: Number(history.offset) || 0,
    total: Number(history.total) || history.items.length,
  }
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

  const res = await apiFetch(`${CHAT_API_BASE}/history?${params}`, {
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
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

export function historyItemsToUiMessages(items: ConversationHistoryItem[]) {
  return sortHistoryItemsAsc(items)
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        item.content.trim().length > 0
    )
    .map((item) => ({
      id: serverMessageId(item.id),
      role: item.role as "user" | "assistant",
      content: item.content,
    }))
}
