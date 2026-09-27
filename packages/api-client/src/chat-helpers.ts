import type {
  ChatApiEffort,
  ChatClientContext,
  ChatCreditBalance,
  ChatMessageResponse,
  ChatToolCallResult,
  CoPilotChatJsonResponse,
  CoPilotEffort,
  CoPilotUsage,
  TrialInfo,
} from "./types"

export function toChatApiEffort(effort?: CoPilotEffort): ChatApiEffort {
  if (effort === "instant" || effort === undefined) return "normal"
  if (effort === "high") return "ultimate"
  return "high"
}

export function toGuestClientContext(
  context: ChatClientContext
): ChatClientContext {
  const { role: _role, ...rest } = context
  return { ...rest, role: "user" }
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

export function usageFromTrial(
  trial?: TrialInfo | null
): CoPilotUsage | undefined {
  if (!trial) return undefined
  return {
    plan: "guest",
    used: trial.messages_used,
    limit: trial.messages_limit,
    remaining: trial.messages_remaining,
    day: trial.weekly_reset_at,
  }
}

function parseSuggestedActionList(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim())
    .slice(0, limit)
}

export function adaptChatMessageResponse(
  data: ChatMessageResponse
): CoPilotChatJsonResponse {
  const clientTargeted = [
    ...(data.tool_calls ?? []),
    ...(data.client_actions ?? []),
  ].filter((call) => call.execution_target !== "server")
  const toolCalls = clientTargeted.map((call: ChatToolCallResult) => ({
    name: call.tool_name,
    arguments: call.input,
    function: {
      name: call.tool_name,
      arguments: call.input,
    },
  }))
  const message = (data.output_text || "").trim()
  const reasoning =
    typeof data.reasoning === "string" && data.reasoning.trim()
      ? data.reasoning.trim()
      : undefined
  const suggestedPrompts = parseSuggestedActionList(data.suggested_actions)
  return {
    message,
    output_text: data.output_text,
    ...(reasoning ? { reasoning } : {}),
    conversation_id: data.session_id,
    session_id: data.session_id,
    usage:
      usageFromCreditBalance(data.credit_balance) ?? usageFromTrial(data.trial),
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

export function normalizeChatErrorCode(code?: string | null): string | undefined {
  if (!code || typeof code !== "string") return undefined
  const trimmed = code.trim()
  return trimmed || undefined
}
