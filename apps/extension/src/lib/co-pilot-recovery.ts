import {
  isChatCreditErrorCode,
  isChatLoginRequiredCode,
  isChatRetryableFailureMessage,
  normalizeChatErrorCode,
} from "@/lib/api/chat-errors"
import { isGuestChatSession } from "@/lib/chat-auth-session"

/** User-facing copy for recoverable co-pilot failures (no status codes / stack traces). */
export const COPILOT_RECOVERY_MESSAGE =
  "Something went wrong while receiving the response."

export const COPILOT_TIMEOUT_MESSAGE =
  "Exur took too long to respond. Check your connection and try again."

export const COPILOT_NETWORK_MESSAGE =
  "Couldn't reach Exur. Check your connection and try again."

export const COPILOT_SERVER_MESSAGE =
  "Exur's servers hit a problem. Please try again in a moment."

export const COPILOT_STREAM_INTERRUPTED_MESSAGE =
  "The response ended unexpectedly. Please try again."

export const COPILOT_EMPTY_REPLY_MESSAGE =
  "Exur returned an empty reply. Please try again."

export const COPILOT_SIGNAL_SYMBOL_REQUIRED_MESSAGE =
  "Signal needs a market — add something like ETH or BTC after /Signal."

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
    case COPILOT_NETWORK_MESSAGE:
      return t("errors.network")
    case COPILOT_SERVER_MESSAGE:
      return t("errors.server")
    case COPILOT_STREAM_INTERRUPTED_MESSAGE:
      return t("errors.streamInterrupted")
    case COPILOT_EMPTY_REPLY_MESSAGE:
      return t("errors.emptyReply")
    case COPILOT_SIGNAL_SYMBOL_REQUIRED_MESSAGE:
      return t("errors.signalSymbolRequired")
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
      // API/stream messages (e.g. "agent execution failed") — show as returned.
      return text
  }
}

/** True when the message is unsafe to surface (HTML, stacks, raw HTTP). */
function isUnsafeTechnicalErrorMessage(message: string): boolean {
  if (!message) return true
  if (/[<>{}]/.test(message)) return true
  if (/^HTTP\s+\d+/i.test(message)) return true
  if (/\bHTTP\b/i.test(message) && /\b\d{3}\b/.test(message)) return true
  if (
    /\b(?:stack|traceback|TypeError|ReferenceError|ECONN|ENOTFOUND|EAI_AGAIN)\b/i.test(
      message
    )
  ) {
    return true
  }
  if (/\bat\s+\S+:\d+/i.test(message)) return true
  return false
}

/** Prefer the backend's human message when it is safe to show. */
function sanitizeApiErrorMessage(message: string): string | null {
  const msg = message.trim().replace(/\s+/g, " ")
  if (!msg || msg.length > 280) return null
  if (isUnsafeTechnicalErrorMessage(msg)) return null
  if (/^failed to fetch$/i.test(msg)) return null
  if (/^networkerror/i.test(msg)) return null
  if (/streaming response has no body/i.test(msg)) return null
  if (/^stream closed without done$/i.test(msg)) return null
  // snake_case codes sometimes arrive as the message body.
  if (/^[a-z][a-z0-9]+(?:_[a-z0-9]+)+$/i.test(msg)) {
    const spaced = msg.replace(/_/g, " ")
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
  }
  // Sentence-case common lowercase API phrases.
  if (/^[a-z]/.test(msg)) {
    return msg.charAt(0).toUpperCase() + msg.slice(1)
  }
  return msg
}
/** Backend rejected @signal / /Signal without a resolvable market symbol. */
export function isSignalSymbolRequiredError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""
  const text = msg.trim()
  if (!text) return false
  if (
    /symbol required/i.test(text) &&
    /(?:@signal|\/signal|active_symbol)/i.test(text)
  ) {
    return true
  }
  return /active_symbol in client context/i.test(text)
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
  const direct = normalizeChatErrorCode(
    (error as { code?: string } | null)?.code
  )
  if (direct) return direct
  return normalizeChatErrorCode(
    (error as { body?: { code?: string } } | null)?.body?.code
  )
}

export function isCreditExhaustedError(error: unknown): boolean {
  // Agent / credit-store failures must never open the out-of-credit paywall.
  if (error instanceof Error && isChatRetryableFailureMessage(error.message)) {
    return false
  }
  const code = coPilotErrorCode(error)
  if (isChatCreditErrorCode(code)) return true
  const status = (error as { status?: number } | null)?.status
  if (status === 402) return true
  if (
    error instanceof Error &&
    (/insufficient credit/i.test(error.message) ||
      /usage limit reached/i.test(error.message))
  ) {
    return true
  }
  return false
}

export function coPilotUserFacingError(
  error: unknown,
  _options?: { isProUser?: boolean }
): string {
  if (isTimeoutError(error)) return COPILOT_TIMEOUT_MESSAGE
  if (isAbortError(error)) return ""
  if (isSignalSymbolRequiredError(error)) {
    return COPILOT_SIGNAL_SYMBOL_REQUIRED_MESSAGE
  }
  const status = (error as { status?: number } | null)?.status
  const code = coPilotErrorCode(error)
  // Guests: sign-in copy for login_required and mis-tagged credit/paywall codes.
  if (isGuestTrialExhaustedError(error)) {
    return COPILOT_TRIAL_EXHAUSTED_MESSAGE
  }
  if (status === 401 || code === "unauthorized" || code === "invalid_token") {
    return COPILOT_AUTH_MESSAGE
  }
  // Real credit/limit codes (incl. Plus daily/weekly caps). Session refresh after
  // upgrade is handled silently in withCreditSessionRetry — never show that CTA here.
  if (isCreditExhaustedError(error)) {
    return COPILOT_CREDIT_MESSAGE
  }

  if (error instanceof Error) {
    const msg = error.message.trim()
    if (/insufficient credit/i.test(msg) || /usage limit reached/i.test(msg)) {
      return COPILOT_CREDIT_MESSAGE
    }
    if (
      msg === COPILOT_EMPTY_REPLY_MESSAGE ||
      msg === "Exur returned an empty reply. Please try again."
    ) {
      return COPILOT_EMPTY_REPLY_MESSAGE
    }
    if (/failed to fetch/i.test(msg) || /^networkerror/i.test(msg)) {
      return COPILOT_NETWORK_MESSAGE
    }
    if (/network/i.test(msg) && !sanitizeApiErrorMessage(msg)) {
      return COPILOT_NETWORK_MESSAGE
    }
    if (
      /streaming response has no body/i.test(msg) ||
      /^stream closed without done$/i.test(msg)
    ) {
      return COPILOT_STREAM_INTERRUPTED_MESSAGE
    }
    if (/^HTTP\s+\d+/i.test(msg) || (status != null && status >= 500)) {
      return COPILOT_SERVER_MESSAGE
    }

    // Prefer the real API/stream reason (agent failed, invalid command, …).
    const safe = sanitizeApiErrorMessage(msg)
    if (safe) return safe
  }

  if (status != null && status >= 500) return COPILOT_SERVER_MESSAGE
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
  T extends {
    id: string
    content: string
    paperTicket?: unknown
    noTradeReason?: unknown
  },
>(messages: T[], assistantId: string): T[] {
  return messages.filter(
    (m) =>
      !(
        m.id === assistantId &&
        !m.content.trim() &&
        !m.paperTicket &&
        !m.noTradeReason
      )
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

/**
 * Guest free trial is used up — prompt sign-in, never Upgrade or generic retry.
 *
 * Stream path: HTTP 200 + event:error with code login_required (no 403).
 * Some gateways also emit registered credit codes (402 / insufficient_credit)
 * for guests; those must still map to sign-in, not the Plus upgrade paywall.
 */
export function isGuestTrialExhaustedError(error: unknown): boolean {
  if (isChatLoginRequiredCode(coPilotErrorCode(error))) return true
  if (isGuestChatSession() && isCreditExhaustedError(error)) return true
  if (
    error instanceof Error &&
    isGuestChatSession() &&
    /guest trial exhausted/i.test(error.message)
  ) {
    return true
  }
  return false
}

/**
 * After a guest chat failure, prefer the sign-in prompt when the server
 * (or refreshed /credits trial) says free messages are gone — even if the
 * SSE error was mis-tagged as agent/reserve failure.
 */
export function shouldShowGuestSignInPrompt(
  error: unknown,
  trial?: { messages_remaining?: number } | null
): boolean {
  if (isGuestTrialExhaustedError(error)) return true
  if ((trial?.messages_remaining ?? 1) <= 0) return true
  return false
}

export function coPilotFailureAction(
  error: unknown,
  _options?: { isProUser?: boolean }
): "connect" | "retry" | undefined {
  if (isGuestTrialExhaustedError(error)) return "connect"
  const status = (error as { status?: number } | null)?.status
  const code = coPilotErrorCode(error)
  if (
    (status === 401 || code === "unauthorized" || code === "invalid_token") &&
    !isGuestChatSession()
  ) {
    return "connect"
  }
  // Out-of-credit / period limit: paywall only — retrying will not help (Plus included).
  if (isCreditExhaustedError(error)) {
    return undefined
  }
  return "retry"
}

export function getRetryUserMessage(
  message:
    { id: string; action?: string; retryUserMessage?: string } | undefined
): string | null {
  if (!message || message.action !== "retry") return null
  const text = message.retryUserMessage?.trim()
  return text || null
}
