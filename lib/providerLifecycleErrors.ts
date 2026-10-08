const PROVIDER_DESTROYED_RE = /\bprovider destroyed\b/i
const CANCELLED_REQUEST_RE = /\bcancelled request\b/i
const UNSUPPORTED_OPERATION_RE = /\bUNSUPPORTED_OPERATION\b/i
const ETH_SUBSCRIBE_RE = /\beth_subscribe\b/i
const ETH_UNSUBSCRIBE_RE = /\beth_unsubscribe\b/i

function appendText(parts: string[], value: unknown): void {
  if (typeof value !== "string") return
  const trimmed = value.trim()
  if (!trimmed) return
  parts.push(trimmed)
}

function collectErrorText(
  error: unknown,
  parts: string[],
  seen: Set<object>,
  depth: number
): void {
  if (depth > 3 || error == null) return

  if (typeof error === "string") {
    appendText(parts, error)
    return
  }

  if (error instanceof Error) {
    appendText(parts, error.name)
    appendText(parts, error.message)
    if (error.cause && typeof error.cause === "object") {
      if (!seen.has(error.cause)) {
        seen.add(error.cause)
        collectErrorText(error.cause, parts, seen, depth + 1)
      }
    } else if (error.cause != null) {
      appendText(parts, String(error.cause))
    }
    return
  }

  if (typeof error !== "object") {
    appendText(parts, String(error))
    return
  }

  if (seen.has(error)) return
  seen.add(error)

  const row = error as {
    code?: unknown
    message?: unknown
    method?: unknown
    name?: unknown
    operation?: unknown
    reason?: unknown
    shortMessage?: unknown
    event?: unknown
    info?: unknown
    error?: unknown
    cause?: unknown
  }

  appendText(parts, row.name)
  appendText(parts, row.message)
  appendText(parts, row.reason)
  appendText(parts, row.shortMessage)
  appendText(parts, row.operation)
  appendText(parts, row.method)
  if (row.code != null) appendText(parts, String(row.code))

  if (row.event != null) {
    collectErrorText(row.event, parts, seen, depth + 1)
  }
  if (row.info != null) {
    collectErrorText(row.info, parts, seen, depth + 1)
  }
  if (row.error != null) {
    collectErrorText(row.error, parts, seen, depth + 1)
  }
  if (row.cause != null) {
    collectErrorText(row.cause, parts, seen, depth + 1)
  }
}

export function isExpectedProviderLifecycleCancellationError(error: unknown): boolean {
  const parts: string[] = []
  collectErrorText(error, parts, new Set<object>(), 0)
  const text = parts.join(" ")
  if (!text) return false

  const hasProviderDestroyed = PROVIDER_DESTROYED_RE.test(text)
  const hasCancelledRequest = CANCELLED_REQUEST_RE.test(text)
  const hasUnsupportedOperation = UNSUPPORTED_OPERATION_RE.test(text)
  const hasSubscriptionOperation =
    ETH_SUBSCRIBE_RE.test(text) || ETH_UNSUBSCRIBE_RE.test(text)

  return (
    (hasProviderDestroyed && hasCancelledRequest) ||
    (hasProviderDestroyed && hasSubscriptionOperation) ||
    (hasCancelledRequest && hasSubscriptionOperation) ||
    (hasUnsupportedOperation &&
      hasSubscriptionOperation &&
      (hasProviderDestroyed || hasCancelledRequest))
  )
}
