import * as Sentry from "@sentry/nextjs"
import { isSentryEnabled, shouldSuppressStakingSentryError } from "@/lib/sentry"
import { shouldEmitStakingSentryEvent } from "@/lib/stakingSentry/dedupe"
import { applyStakingCanonicalTags, legacyTagsToCanonical } from "@/lib/stakingSentry/tags"
import type {
  StakingCanonicalTags,
  StakingSentryTagContext,
  StakingStructuredContexts,
} from "@/lib/stakingSentry/types"
import type { StakingSentryEventName } from "@/lib/stakingSentry/taxonomy"

export type StakingSentryLevel = "info" | "warning" | "error" | "fatal"

function applyStakingContexts(
  scope: Sentry.Scope,
  contexts: StakingStructuredContexts | undefined
): void {
  if (!contexts) return
  if (contexts.staking_runtime) scope.setContext("staking_runtime", contexts.staking_runtime)
  if (contexts.staking_wallet) scope.setContext("staking_wallet", contexts.staking_wallet)
  if (contexts.staking_tx) scope.setContext("staking_tx", contexts.staking_tx)
  if (contexts.staking_hydration) {
    scope.setContext("staking_hydration", contexts.staking_hydration)
  }
  if (contexts.staking_visibility) {
    scope.setContext("staking_visibility", contexts.staking_visibility)
  }
  if (contexts.staking_network) scope.setContext("staking_network", contexts.staking_network)
  if (contexts.staking_provider) scope.setContext("staking_provider", contexts.staking_provider)
  if (contexts.staking_async) scope.setContext("staking_async", contexts.staking_async)
  if (contexts.staking_mobile) scope.setContext("staking_mobile", contexts.staking_mobile)
}

function levelToSentry(level: StakingSentryLevel): Sentry.SeverityLevel {
  return level
}

/** Structured message event — canonical taxonomy, tags, contexts, dedupe. */
export function captureStakingStructuredEvent(input: Readonly<{
  event: StakingSentryEventName
  level: StakingSentryLevel
  message?: string
  tags?: Partial<StakingCanonicalTags>
  contexts?: StakingStructuredContexts
  fingerprint?: readonly string[]
  dedupeKey?: string
  cooldownMs?: number
  oncePerSession?: boolean
}>): void {
  if (!isSentryEnabled()) return

  const dedupeKey = input.dedupeKey ?? input.event
  if (
    !shouldEmitStakingSentryEvent({
      dedupeKey,
      eventName: input.event,
      cooldownMs: input.cooldownMs,
      oncePerSession: input.oncePerSession,
    })
  ) {
    return
  }

  const msg = input.message ?? input.event

  const fingerprint = input.fingerprint?.length
    ? [...input.fingerprint]
    : [input.event, dedupeKey]
  const level = levelToSentry(input.level)

  Sentry.withScope(scope => {
    scope.setLevel(level)
    scope.setTag("staking_event", input.event)
    applyStakingCanonicalTags(scope, input.tags ?? {})
    applyStakingContexts(scope, input.contexts)
    scope.setFingerprint(fingerprint)
    Sentry.captureEvent({
      message: msg,
      level,
      fingerprint,
    })
  })
}

/** Capture real staking/wallet failures with minimal tags (skips expected UX flows). */
export function captureStakingException(
  error: unknown,
  context: StakingSentryTagContext & {
    fingerprint?: readonly string[]
    extra?: Readonly<Record<string, string | boolean | number | null>>
    event?: StakingSentryEventName
    contexts?: StakingStructuredContexts
    tags?: Partial<StakingCanonicalTags>
  } = {}
): void {
  if (!isSentryEnabled()) return
  if (shouldSuppressStakingSentryError(error)) return

  const { fingerprint, extra, event, contexts, tags, ...legacy } = context
  const canonical = { ...legacyTagsToCanonical(legacy), ...tags }

  Sentry.withScope(scope => {
    applyStakingCanonicalTags(scope, canonical)
    if (event) scope.setTag("staking_event", event)
    applyStakingContexts(scope, contexts)
    if (extra) scope.setContext("staking", extra)
    if (fingerprint?.length) scope.setFingerprint([...fingerprint])
    Sentry.captureException(error)
  })
}

export function stakingSentryTagsFromDeployment(input: Readonly<{
  deploymentId: string
  chainFamily: string
  networkMismatch?: boolean
  runtimeKey?: string
}>): StakingSentryTagContext & Partial<StakingCanonicalTags> {
  return {
    deploymentId: input.deploymentId,
    runtimeFamily: input.chainFamily,
    deployment_id: input.deploymentId,
    chain_family: input.chainFamily,
    ...(input.runtimeKey != null ? { runtime_key: input.runtimeKey } : {}),
    ...(input.networkMismatch != null
      ? { networkMismatch: input.networkMismatch, wrong_network: input.networkMismatch ? "true" : "false" }
      : {}),
  }
}
