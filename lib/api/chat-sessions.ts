import { chatApiFetch } from "@/lib/api/chat-client"
import { unwrapChatPayload } from "@/lib/api/chat"
import type { SessionListItem, SessionListResult } from "@/lib/api/types"
import {
  isConversationDeleted,
  type ChatStore,
  type StoredConversation,
  upsertConversation,
} from "@/lib/chat-storage"

export type SessionPatchInput = {
  title?: string
  pinned?: boolean
  deleted?: boolean
}

export type ChatSessionDeleteResult = {
  session_id: string
  deleted: true
}

function isSessionPreview(value: unknown): value is SessionListItem["preview"] {
  if (!value || typeof value !== "object") return false
  const preview = value as SessionListItem["preview"]
  return typeof preview.role === "string" && typeof preview.content === "string"
}

function isSessionListItem(value: unknown): value is SessionListItem {
  if (!value || typeof value !== "object") return false
  const item = value as SessionListItem
  return (
    typeof item.session_id === "string" &&
    typeof item.title === "string" &&
    typeof item.pinned === "boolean" &&
    typeof item.last_message_at === "string" &&
    typeof item.first_message_at === "string" &&
    typeof item.message_count === "number" &&
    isSessionPreview(item.preview)
  )
}

export function normalizeSessionListResult(body: unknown): SessionListResult {
  const payload = unwrapChatPayload<{ sessions?: SessionListResult }>(body)
  const sessions = payload.sessions ?? (payload as SessionListResult)
  if (!sessions || !Array.isArray(sessions.items)) {
    return { items: [], limit: 0, offset: 0, total: 0 }
  }
  return {
    items: sessions.items.filter(isSessionListItem),
    limit: Number(sessions.limit) || 0,
    offset: Number(sessions.offset) || 0,
    total: Number(sessions.total) || sessions.items.length,
  }
}

function throwChatApiError(
  res: Response,
  body: unknown,
  fallback: string
): never {
  const payload = body as { error?: string; code?: string }
  throw Object.assign(new Error(payload.error || fallback), {
    status: res.status,
    body,
    code: payload.code,
  })
}

export async function fetchChatSessions(input?: {
  limit?: number
  offset?: number
  signal?: AbortSignal
}): Promise<SessionListResult> {
  const params = new URLSearchParams()
  if (input?.limit != null) params.set("limit", String(input.limit))
  if (input?.offset != null) params.set("offset", String(input.offset))
  const query = params.toString()
  const res = await chatApiFetch(query ? `/sessions?${query}` : "/sessions", {
    signal: input?.signal,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throwChatApiError(res, body, `sessions failed ${res.status}`)
  }
  return normalizeSessionListResult(body)
}

export async function patchChatSession(
  sessionId: string,
  patch: SessionPatchInput,
  signal?: AbortSignal
): Promise<SessionListItem> {
  const res = await chatApiFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    signal,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throwChatApiError(res, body, `session patch failed ${res.status}`)
  }
  const payload = unwrapChatPayload<{ session?: SessionListItem }>(body)
  const session = payload.session
  if (!isSessionListItem(session)) {
    throw Object.assign(new Error("invalid session payload"), {
      status: 200,
      body,
      code: "bad_request",
    })
  }
  return session
}

export async function deleteChatSession(
  sessionId: string,
  signal?: AbortSignal
): Promise<ChatSessionDeleteResult> {
  const res = await chatApiFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    signal,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throwChatApiError(res, body, `session delete failed ${res.status}`)
  }
  const payload = unwrapChatPayload<{
    session_id?: string
    deleted?: boolean
  }>(body)
  if (typeof payload.session_id !== "string" || payload.deleted !== true) {
    throw Object.assign(new Error("invalid session delete payload"), {
      status: 200,
      body,
      code: "bad_request",
    })
  }
  return { session_id: payload.session_id, deleted: true }
}

/** Merge JWT `GET /sessions` metadata (title / pin / timestamps) into the local store. */
export function applySessionListToStore(
  store: ChatStore,
  sessions: SessionListItem[]
): ChatStore {
  let next = store
  for (const session of sessions) {
    if (isConversationDeleted(next, session.session_id)) continue
    const existing = next.conversations.find(
      (chat) => chat.id === session.session_id
    )
    const stub: StoredConversation = {
      id: session.session_id,
      title: session.title.trim() || existing?.title || "Chat",
      createdAt: existing?.createdAt ?? session.first_message_at,
      updatedAt: session.last_message_at || existing?.updatedAt || session.first_message_at,
      messages: existing?.messages ?? [],
      history: existing?.history ?? [],
      pinned: session.pinned,
    }
    next = upsertConversation(next, stub)
  }
  return next
}

