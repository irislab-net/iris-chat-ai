import * as Sentry from "@sentry/nextjs"
import { getSentryDsn, getSentryRelease } from "@/config/env"
import { isExpectedDomMutationSentryNoise } from "@/lib/browserExtensionDomMutationNoise"
import { wasErrorReportedToStakingSentry } from "@/lib/networkErrors/sentryReportMarker"
import { isExpectedProviderLifecycleCancellationError } from "@/lib/providerLifecycleErrors"
import { applyDeployCorrelationScopeTags } from "@/lib/runtimeDeployCorrelation"
import { isStakingWalletUserRejectedError } from "@/lib/stakingTransactionMessages"

let sentryInitialized = false

type SentryGlobalBridge = {
  Sentry?: typeof Sentry
}

const SUPPRESSED_MESSAGE_PATTERNS: readonly RegExp[] = [
  /\buser rejected\b/i,
  /\buser denied\b/i,
  /\brejected the request\b/i,
  /\brequest rejected\b/i,
  /\baction_rejected\b/i,
  /\buser rejected request\b/i,
  /\buser cancelled\b/i,
  /\buser canceled\b/i,
  /\btransaction cancelled\b/i,
  /\btransaction canceled\b/i,
  /\bcancelled by user\b/i,
  /\bcanceled by user\b/i,
  /\bwrong network\b/i,
  /\bnetwork mismatch\b/i,
  /\bchain mismatch\b/i,
  /\bunsupported chain\b/i,
  /\bwallet disconnected\b/i,
  /\bdisconnected from\b/i,
  /\bconnection request reset\b/i,
  /\bmodal closed\b/i,
  /\bprovider disconnected\b/i,
]

function collectErrorText(error: unknown): string {
  const parts: string[] = []
  if (error instanceof Error) {
    parts.push(error.message, error.name)
    if (error.cause != null) {
      parts.push(collectErrorText(error.cause))
    }
  } else if (typeof error === "string") {
    parts.push(error)
  } else if (error && typeof error === "object") {
    const maybe = error as { message?: unknown; code?: unknown; reason?: unknown }
    if (typeof maybe.message === "string") parts.push(maybe.message)
    if (typeof maybe.reason === "string") parts.push(maybe.reason)
    if (maybe.code != null) parts.push(String(maybe.code))
  }
  return parts.join(" ")
}

function messageMatchesSuppressedPattern(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return SUPPRESSED_MESSAGE_PATTERNS.some(re => re.test(t))
}

/** Drop expected wallet / network UX flows from Sentry (also used by staking capture helpers). */
export function shouldSuppressStakingSentryError(error: unknown): boolean {
  if (isStakingWalletUserRejectedError(error)) return true

  const text = collectErrorText(error)
  if (messageMatchesSuppressedPattern(text)) return true

  if (error instanceof Error && error.cause != null) {
    return shouldSuppressStakingSentryError(error.cause)
  }

  return false
}

function enrichStructuredStakingSentryEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const stakingEvent = event.tags?.staking_event
  if (typeof stakingEvent !== "string" || stakingEvent.length === 0) {
    return event
  }

  const msg =
    typeof event.message === "string" && event.message.trim().length > 0
      ? event.message.trim()
      : stakingEvent

  return {
    ...event,
    message: msg,
    transaction: stakingEvent,
  }
}

function shouldSuppressSentryEvent(
  error: unknown,
  event: Sentry.ErrorEvent
): boolean {
  if (shouldSuppressStakingSentryError(error)) return true
  if (wasErrorReportedToStakingSentry(error)) return true
  if (isExpectedDomMutationSentryNoise(error, event)) return true
  if (isExpectedProviderLifecycleCancellationError(error)) return true

  const message = [event.message, event.exception?.values?.map(v => v.value).join(" ")]
    .filter(Boolean)
    .join(" ")
  if (messageMatchesSuppressedPattern(message)) return true
  if (isExpectedProviderLifecycleCancellationError(message)) return true
  if (isExpectedDomMutationSentryNoise(message, event)) return true

  return false
}

export function isSentryEnabled(): boolean {
  return sentryInitialized
}

/** Initialize once at app boot. No-op when `VITE_SENTRY_DSN` is unset. */
export function initSentry(): void {
  const dsn = getSentryDsn()
  if (!dsn || sentryInitialized) return

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: getSentryRelease() ?? undefined,
    tracesSampleRate: 0,
    attachStacktrace: true,
    sendDefaultPii: false,
    beforeSend(event, hint) {
      if (shouldSuppressSentryEvent(hint.originalException, event)) {
        return null
      }
      return enrichStructuredStakingSentryEvent(event)
    },
  })

  ;(globalThis as SentryGlobalBridge).Sentry = Sentry
  sentryInitialized = true
  applyDeployCorrelationScopeTags()

  if ((process.env.NODE_ENV !== 'production')) {
    installStakingSentryDevTestHook()
  }
}

function installStakingSentryDevTestHook(): void {
  const w = globalThis as typeof globalThis & {
    __stakingSentryTestError?: () => void
  }
  w.__stakingSentryTestError = () => {
    throw new Error("Staking Sentry test error (dev only)")
  }
}

declare global {
  interface Window {
    __stakingSentryTestError?: () => void
  }
}
