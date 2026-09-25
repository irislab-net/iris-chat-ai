/**
 * Chat turn failure codes from POST /message and POST /message/stream.
 *
 * JSON failures use `{ error, success: "false", code? }` with a real HTTP status.
 * After the SSE stream opens, credit / guest / agent failures are `event: error`
 * with HTTP 200 — branch on `code` / `message`, not `response.status`.
 */

export const CHAT_CREDIT_ERROR_CODES = [
  "daily_limit_reached",
  "weekly_limit_reached",
  "insufficient_credit",
] as const

export type ChatCreditErrorCode = (typeof CHAT_CREDIT_ERROR_CODES)[number]

export const CHAT_LOGIN_REQUIRED_CODE = "login_required" as const

/** Messages that are retryable agent/store failures — never open the paywall. */
export const CHAT_RETRYABLE_FAILURE_MESSAGES = [
  "agent execution failed",
  "failed to reserve credit",
] as const

export function normalizeChatErrorCode(
  code: unknown
): string | undefined {
  if (typeof code !== "string") return undefined
  const trimmed = code.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function isChatCreditErrorCode(
  code: string | undefined
): code is ChatCreditErrorCode {
  return (
    code === "daily_limit_reached" ||
    code === "weekly_limit_reached" ||
    code === "insufficient_credit"
  )
}

export function isChatLoginRequiredCode(code: string | undefined): boolean {
  return code === CHAT_LOGIN_REQUIRED_CODE
}

export function isChatRetryableFailureMessage(message: string | undefined): boolean {
  const text = message?.trim().toLowerCase() ?? ""
  return (CHAT_RETRYABLE_FAILURE_MESSAGES as readonly string[]).includes(text)
}

/**
 * HTTP status that JSON `/message` would use for the same failure.
 * Used when SSE `event: error` omits a status (stream stays 200).
 */
export function httpStatusForChatErrorCode(
  code: string | undefined
): number | undefined {
  if (!code) return undefined
  if (isChatCreditErrorCode(code)) return 402
  if (isChatLoginRequiredCode(code)) return 403
  if (code === "unauthorized" || code === "invalid_token") return 401
  if (
    code === "bad_request" ||
    code === "effort_not_allowed" ||
    code === "invalid_command"
  ) {
    return 400
  }
  if (code === "stream_unsupported") return 500
  return undefined
}

export type ChatTurnErrorFields = {
  message: string
  code?: string
  status?: number
  trial?: unknown
}

/** Build a thrown Error for SSE `event: error` with code → status mapped. */
export function chatStreamErrorFromEvent(data: {
  message: string
  code?: string
}): Error & ChatTurnErrorFields {
  const code = normalizeChatErrorCode(data.code)
  const status = httpStatusForChatErrorCode(code)
  return Object.assign(new Error(data.message || "Chat stream failed"), {
    ...(code ? { code } : {}),
    ...(status != null ? { status } : {}),
  })
}
