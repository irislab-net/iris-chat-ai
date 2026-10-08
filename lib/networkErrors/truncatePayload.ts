const SENTRY_MESSAGE_MAX = 1_500
const SENTRY_CONTEXT_MAX = 2_000

/** Truncate user-facing / Sentry-safe text. */
export function truncateForSentry(text: string, maxLen = SENTRY_MESSAGE_MAX): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}…`
}

export function sanitizeMessageForTelemetry(raw: string): string {
  let t = raw.trim()
  if (t.length > 8_192) t = t.slice(0, 8_192)
  const head = t.length > 200 ? t.slice(0, 200).toLowerCase() : t.toLowerCase()
  if (head.includes("<!doctype") || head.includes("<html")) {
    return "[redacted HTML error body]"
  }
  if (t.includes("wc@") || (t.includes("walletconnect") && t.includes("{"))) {
    return "[redacted WalletConnect payload]"
  }
  return truncateForSentry(t, SENTRY_CONTEXT_MAX)
}
