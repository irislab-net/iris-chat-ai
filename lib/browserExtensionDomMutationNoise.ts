import type * as Sentry from "@sentry/nextjs"

const EXTENSION_URL_RE = /\b(?:chrome|moz|safari)-extension:\/\//i
const REMOVE_CHILD_RE = /\bremoveChild\b/i
const NOT_FOUND_ERROR_RE = /\bNotFoundError\b/i
const NODE_NOT_CHILD_RE = /node to be removed is not a child of this node/i

function pushText(parts: string[], value: unknown): void {
  if (typeof value !== "string") return
  const trimmed = value.trim()
  if (!trimmed) return
  parts.push(trimmed)
}

function collectUnknownText(
  error: unknown,
  parts: string[],
  seen: Set<object>,
  depth: number
): void {
  if (depth > 4 || error == null) return

  if (typeof error === "string") {
    pushText(parts, error)
    return
  }

  if (error instanceof Error) {
    pushText(parts, error.name)
    pushText(parts, error.message)
    pushText(parts, error.stack)
    if (error.cause != null) {
      collectUnknownText(error.cause, parts, seen, depth + 1)
    }
    return
  }

  if (typeof error !== "object") {
    pushText(parts, String(error))
    return
  }

  if (seen.has(error)) return
  seen.add(error)

  const row = error as {
    stack?: unknown
    message?: unknown
    name?: unknown
    reason?: unknown
    source?: unknown
    filename?: unknown
    url?: unknown
    code?: unknown
    error?: unknown
    cause?: unknown
  }

  pushText(parts, row.name)
  pushText(parts, row.message)
  pushText(parts, row.reason)
  pushText(parts, row.source)
  pushText(parts, row.filename)
  pushText(parts, row.url)
  pushText(parts, row.stack)
  if (row.code != null) pushText(parts, String(row.code))

  if (row.error != null) {
    collectUnknownText(row.error, parts, seen, depth + 1)
  }
  if (row.cause != null) {
    collectUnknownText(row.cause, parts, seen, depth + 1)
  }
}

function collectEventText(event: Sentry.ErrorEvent | undefined): string {
  if (!event) return ""
  const parts: string[] = []

  pushText(parts, event.message)

  for (const value of event.exception?.values ?? []) {
    pushText(parts, value.type)
    pushText(parts, value.value)
    for (const frame of value.stacktrace?.frames ?? []) {
      pushText(parts, frame.filename)
      pushText(parts, frame.function)
    }
  }

  pushText(parts, event.request?.url)
  return parts.join(" ")
}

function looksLikeDomDetachNoise(text: string): boolean {
  return (
    REMOVE_CHILD_RE.test(text) &&
    (NOT_FOUND_ERROR_RE.test(text) || NODE_NOT_CHILD_RE.test(text))
  )
}

/** GSAP / React animation teardown races (production culprit: useGSAP, gsap chunks). */
const GSAP_STACK_RE =
  /\b(?:gsap|useGSAP|MorphSVG|ScrollTrigger|DrawSVG|SplitText|@gsap\/react)\b/i

function isLocalDevPageUrl(event: Sentry.ErrorEvent | undefined): boolean {
  const url = event?.request?.url ?? ""
  if (!url) return false
  return /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i.test(url)
}

export function isExpectedGsapDomDetachNoise(
  error: unknown,
  event?: Sentry.ErrorEvent
): boolean {
  const errorParts: string[] = []
  collectUnknownText(error, errorParts, new Set<object>(), 0)
  const errorText = errorParts.join(" ")
  const eventText = collectEventText(event)
  const combinedText = [errorText, eventText].filter(Boolean).join(" ")

  if (!looksLikeDomDetachNoise(combinedText)) return false
  return GSAP_STACK_RE.test(combinedText)
}

/** Extension-injected DOM races or GSAP detach noise — not actionable app crashes. */
export function isExpectedDomMutationSentryNoise(
  error: unknown,
  event?: Sentry.ErrorEvent
): boolean {
  if (isExpectedBrowserExtensionDomMutationNoise(error, event)) return true
  if (isExpectedGsapDomDetachNoise(error, event)) return true
  if (event && isLocalDevPageUrl(event) && looksLikeDomDetachNoise(collectEventText(event))) {
    return true
  }
  const errorParts: string[] = []
  collectUnknownText(error, errorParts, new Set<object>(), 0)
  return (
    isLocalDevPageUrl(event) &&
    looksLikeDomDetachNoise(errorParts.join(" "))
  )
}

export function isExpectedBrowserExtensionDomMutationNoise(
  error: unknown,
  event?: Sentry.ErrorEvent
): boolean {
  const errorParts: string[] = []
  collectUnknownText(error, errorParts, new Set<object>(), 0)
  const errorText = errorParts.join(" ")
  const eventText = collectEventText(event)
  const combinedText = [errorText, eventText].filter(Boolean).join(" ")

  if (!combinedText) return false

  const hasExtensionOrigin =
    EXTENSION_URL_RE.test(errorText) || EXTENSION_URL_RE.test(eventText)

  if (!hasExtensionOrigin) return false
  return looksLikeDomDetachNoise(combinedText)
}
