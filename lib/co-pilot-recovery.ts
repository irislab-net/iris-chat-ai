import { isGuestChatSession } from "@/lib/chat-auth-session"

/** User-facing copy for recoverable co-pilot failures (no status codes / stack traces). */
export const COPILOT_RECOVERY_MESSAGE =
  "Something went wrong while receiving the response."

export const COPILOT_TIMEOUT_MESSAGE =
  "Exur took too long to respond. Check your connection and try again."

export const COPILOT_CREDIT_MESSAGE =
  "You've used this period's chat credits. Upgrade to continue."

export const COPILOT_PRO_SESSION_REFRESH_MESSAGE =
  "Your Plus plan is active, but this session needs a refresh. Try again."

export const COPILOT_AUTH_MESSAGE =
  "Sign in with Google to get answers from Exur. You can explore prompts and typing first."

export const COPILOT_TRIAL_EXHAUSTED_MESSAGE =
  "Your free messages this week are used up. Sign in to continue."

/** Map stored English error sentinels to workspace.errors.* translation keys. */
export function localizeCoPilotErrorText(
  text: string | undefined,
  t: (key: string) => string
): string {
  switch (text) {
    case COPILOT_TIMEOUT_MESSAGE:
      return t("errors.timeout")
    case COPILOT_CREDIT_MESSAGE:
      return t("errors.credits")
    case COPILOT_PRO_SESSION_REFRESH_MESSAGE:
      return t("errors.proSessionRefresh")
    case COPILOT_AUTH_MESSAGE:
      return t("errors.auth")
    case COPILOT_TRIAL_EXHAUSTED_MESSAGE:
      return t("errors.trialExhausted")
    case COPILOT_RECOVERY_MESSAGE:
    case undefined:
    case "":
      return t("errors.recovery")
    default:
      return text
  }
}
export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = (error as { name?: string }).name
  return name === "TimeoutError"
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = (error as { name?: string }).name
  return name === "AbortError"
}

/** Skip co-pilot for noise input (digits-only, no letters) — avoids bogus trade replies. */
export function isLowSignalUserMessage(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 2) return true
  if (/^\d+$/u.test(trimmed)) return true
  if (!/[\p{L}]/u.test(trimmed)) return true
  return false
}

/**
 * Map transport/API failures to safe UI copy.
 * Never surface HTTP codes, stack traces, or raw infrastructure text.
 */
function coPilotErrorCode(error: unknown): string | undefined {
  const direct = (error as { code?: string } | null)?.code
  if (direct) return direct
  const body = (error as { body?: { code?: string } } | null)?.body
  return body?.code
}

export function isCreditExhaustedError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status
  if (status === 402) return true
  if (error instanceof Error && /insufficient credit/i.test(error.message)) {
    return true
  }
  return false
}

export function coPilotUserFacingError(
  error: unknown,
  options?: { isProUser?: boolean }
): string {
  if (isTimeoutError(error)) return COPILOT_TIMEOUT_MESSAGE
  if (isAbortError(error)) return ""
  const status = (error as { status?: number } | null)?.status
  const code = coPilotErrorCode(error)
  if (status === 403 && code === "login_required") {
    return COPILOT_TRIAL_EXHAUSTED_MESSAGE
  }
  if (status === 401) return COPILOT_AUTH_MESSAGE
  if (isCreditExhaustedError(error)) {
    return options?.isProUser
      ? COPILOT_PRO_SESSION_REFRESH_MESSAGE
      : COPILOT_CREDIT_MESSAGE
  }
  // Known empty-completion path uses a friendly Error already — keep if it matches product tone.
  if (error instanceof Error) {
    const msg = error.message.trim()
    if (/insufficient credit/i.test(msg)) {
      return options?.isProUser
        ? COPILOT_PRO_SESSION_REFRESH_MESSAGE
        : COPILOT_CREDIT_MESSAGE
    }
    if (msg === "Exur returned an empty reply. Please try again.") {
      return COPILOT_RECOVERY_MESSAGE
    }
    // Drop technical transport messages (HTTP 502, Failed to fetch, etc.)
    if (/^HTTP\s+\d+/i.test(msg)) return COPILOT_RECOVERY_MESSAGE
    if (/failed to fetch/i.test(msg)) return COPILOT_RECOVERY_MESSAGE
    if (/network/i.test(msg)) return COPILOT_RECOVERY_MESSAGE
    if (/streaming response has no body/i.test(msg)) return COPILOT_RECOVERY_MESSAGE
    if (msg.length > 0 && msg.length < 160 && !/[<>{}]/.test(msg) && !/\bHTTP\b/i.test(msg)) {
      // Short opaque API `error` strings may be user-safe; still prefer recovery copy
      // unless we know the backend writes human copy. Default to recovery message.
      return COPILOT_RECOVERY_MESSAGE
    }
  }
  return COPILOT_RECOVERY_MESSAGE
}

export type FailedAssistantTurn = {
  id: string
  role: "assistant"
  content: string
  error: true
  action: "retry"
  /** User text this assistant turn was answering — used for single-turn retry. */
  retryUserMessage: string
}

/**
 * Build a recoverable failed assistant message.
 * Preserves any partial streamed content; never looks like a blank success bubble.
 */
export function buildFailedAssistantTurn(input: {
  assistantId: string
  partialContent: string
  fallbackContent?: string
  userMessage: string
  error: unknown
}): FailedAssistantTurn {
  const partial =
    input.partialContent.trim() || input.fallbackContent?.trim() || ""
  return {
    id: input.assistantId,
    role: "assistant",
    content: partial,
    error: true,
    action: "retry",
    retryUserMessage: input.userMessage,
  }
}

/** Remove an empty in-flight assistant bubble after expected abort (no scary error). */
export function removeEmptyAssistantTurn<
  T extends { id: string; content: string; paperTicket?: unknown },
>(messages: T[], assistantId: string): T[] {
  return messages.filter(
    (m) =>
      !(m.id === assistantId && !m.content.trim() && !m.paperTicket)
  )
}

/**
 * Replace a failed assistant turn with a fresh empty bubble for retry,
 * keeping prior messages (including the original user turn) intact.
 */
export function prepareMessagesForRetry<
  T extends {
    id: string
    content: string
    error?: boolean
    action?: string
    retryUserMessage?: string
  },
>(messages: T[], assistantId: string): T[] {
  return messages.map((m) =>
    m.id === assistantId
      ? ({
          ...m,
          content: "",
          error: false,
          action: undefined,
          retryUserMessage: undefined,
        } as T)
      : m
  )
}

/** Find retry payload for a failed assistant turn. */
export function isGuestTrialExhaustedError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status
  const code = coPilotErrorCode(error)
  return status === 403 && code === "login_required"
}

export function coPilotFailureAction(error: unknown): "connect" | "retry" {
  if (isGuestTrialExhaustedError(error)) return "connect"
  const status = (error as { status?: number } | null)?.status
  if (status === 401 && !isGuestChatSession()) return "connect"
  return "retry"
}

export function getRetryUserMessage(
  message: { id: string; action?: string; retryUserMessage?: string } | undefined
): string | null {
  if (!message || message.action !== "retry") return null
  const text = message.retryUserMessage?.trim()
  return text || null
}
