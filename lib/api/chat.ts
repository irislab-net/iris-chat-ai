import type {
  ChatApiEffort,
  ChatClientContext,
  ChatCreditBalance,
  ChatMessageResponse,
  ChatToolCallResult,
  CoPilotChatJsonResponse,
  CoPilotEffort,
  CoPilotToolCall,
  CoPilotUsage,
  CoPilotUsageResponse,
  TrialInfo,
  User,
} from "@/lib/api/types"
import {
  buildChatClientContext as buildChatClientContextFromTools,
} from "@/lib/chat/client-tools"
import { isChatCreditBalance } from "@/lib/api/credit-usage"
import { WORKSPACE_TAB_NEWS, workspaceTabHref } from "@/lib/workspace-tab"
import type { WorkspaceTab } from "@/lib/workspace-tab"

/** Same-origin chat proxy base — browser calls go through app/v1/[...path]/route.ts. */
export const CHAT_API_BASE = "/v1/chat"

export function chatApiPath(subpath: string): string {
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`
  return `${CHAT_API_BASE}${path}`
}

export {
  createChatClientActionHandlers,
  executeChatClientActions,
  type ChatClientActionHandlers,
} from "@/lib/chat/client-tools"

export function toChatApiEffort(effort?: CoPilotEffort): ChatApiEffort {
  if (effort === "instant" || effort === undefined) return "normal"
  if (effort === "high") return "ultimate"
  return "high"
}

export function chatRoleFromUser(
  user: User | null | undefined,
  isProUser = false
): string {
  const role = user?.role?.trim().toLowerCase()
  if (role === "admin" || role === "pro" || role === "user") return role
  if (isProUser || user?.tier === "pro" || user?.tier === "ultimate") {
    return "pro"
  }
  return "user"
}

/** Desk symbol for chat `client_context.active_symbol` — ETH/BTC/XAU, not pairs. */
export function toChatApiSymbol(symbol?: string) {
  const raw = (symbol || "ETH")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  if (!raw) return "ETH"
  const desk = raw.replace(/USDT$/, "").replace(/USD$/, "")
  return desk || "ETH"
}

export function buildChatClientContext(input: {
  user?: User | null
  isProUser?: boolean
  symbol?: string
  pathname?: string
  workspaceTab?: WorkspaceTab | null
  locale?: string
  timezone?: string
}): ChatClientContext {
  return buildChatClientContextFromTools(input)
}

export function usageFromCreditBalance(
  balance?: ChatCreditBalance | null
): CoPilotUsage | undefined {
  if (!balance) return undefined
  const used = Number(balance.daily_limit) - Number(balance.remaining_daily)
  return {
    plan: "daily",
    used: Number.isFinite(used) ? used : "—",
    limit: balance.daily_limit,
    remaining: balance.remaining_daily,
    day: balance.daily_reset_at,
  }
}

export function usageFromTrial(trial?: TrialInfo | null): CoPilotUsage | undefined {
  if (!trial) return undefined
  return {
    plan: "guest",
    used: trial.messages_used,
    limit: trial.messages_limit,
    remaining: trial.messages_remaining,
    day: trial.weekly_reset_at,
  }
}

export function unwrapChatPayload<T extends object>(body: unknown): T {
  if (!body || typeof body !== "object") return {} as T
  const record = body as Record<string, unknown>
  if (record.data && typeof record.data === "object") {
    return record.data as T
  }
  return body as T
}

export function chatToolToLegacy(call: ChatToolCallResult): CoPilotToolCall {
  return {
    name: call.tool_name,
    arguments: call.input,
    function: {
      name: call.tool_name,
      arguments: call.input,
    },
  }
}

export function parseSuggestedActionList(
  value: unknown,
  limit = 4
): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim())
    .slice(0, limit)
}

export function parseSuggestedPrompts(
  metadata?: Record<string, unknown> | null
): string[] {
  if (!metadata) return []
  const keys = [
    "suggested_actions",
    "suggested_prompts",
    "follow_up_prompts",
    "follow_up_questions",
    "suggested_messages",
  ] as const
  for (const key of keys) {
    const parsed = parseSuggestedActionList(metadata[key])
    if (parsed.length > 0) return parsed
  }
  return []
}

export function adaptChatMessageResponse(
  data: ChatMessageResponse
): CoPilotChatJsonResponse {
  const clientTargeted = [
    ...(data.tool_calls ?? []),
    ...(data.client_actions ?? []),
  ].filter((call) => call.execution_target !== "server")
  const toolCalls = clientTargeted.map(chatToolToLegacy)
  const message = (data.output_text || "").trim()
  const reasoning =
    typeof data.reasoning === "string" && data.reasoning.trim()
      ? data.reasoning.trim()
      : undefined
  const suggestedFromField = parseSuggestedActionList(data.suggested_actions)
  const suggestedPrompts =
    suggestedFromField.length > 0
      ? suggestedFromField
      : parseSuggestedPrompts(data.metadata)
  return {
    message,
    output_text: data.output_text,
    ...(reasoning ? { reasoning } : {}),
    conversation_id: data.session_id,
    session_id: data.session_id,
    usage: usageFromCreditBalance(data.credit_balance) ?? usageFromTrial(data.trial),
    credit_balance: data.credit_balance,
    trial: data.trial,
    code: data.code,
    tool_calls: toolCalls,
    client_actions: clientTargeted,
    suggestedPrompts,
    user_message: data.user_message,
    assistant_message: data.assistant_message,
  }
}

export function parseToolActionInput(
  input: string | Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!input) return {}
  if (typeof input === "object" && !Array.isArray(input)) return input
  if (typeof input !== "string" || !input.trim()) return {}
  try {
    const parsed = JSON.parse(input) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function pathForChatPage(page: unknown): string | null {
  if (page === "trading_chart") return workspaceTabHref(WORKSPACE_TAB_NEWS)
  if (page === "wallet_page") return workspaceTabHref(WORKSPACE_TAB_NEWS)
  return null
}

export function creditsToUsageResponse(body: unknown): CoPilotUsageResponse {
  const payload = unwrapChatPayload<{
    balance?: ChatCreditBalance
    credit_balance?: ChatCreditBalance
    trial?: TrialInfo
    error?: string
  }>(body)
  const balance =
    payload.balance ??
    payload.credit_balance ??
    (isChatCreditBalance(payload) ? payload : undefined)
  return {
    usage: usageFromCreditBalance(balance) ?? usageFromTrial(payload.trial),
    credit_balance: balance,
    trial: payload.trial,
    error: payload.error,
  }
}

/** Strip role/tier for guest chat — server assigns free tier automatically. */
export function toGuestClientContext(
  context: ChatClientContext
): Omit<ChatClientContext, "role"> {
  const { role: _role, ...rest } = context
  return rest
}
