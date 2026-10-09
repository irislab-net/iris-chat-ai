import { captureStakingStructuredEvent } from "@/lib/stakingSentry/capture"
import { STAKING_SENTRY_EVENT } from "@/lib/stakingSentry/taxonomy"
import type { StakingStructuredContexts } from "@/lib/stakingSentry/types"

/** Production invariant signal — high priority, deduped per code + runtime. */
export function reportStakingInvariantViolation(
  code: string,
  details: Readonly<Record<string, string | boolean | number | null>>,
  options?: Readonly<{
    fatal?: boolean
    deploymentId?: string
    runtimeKey?: string
    chainFamily?: string
  }>
): void {
  const dedupeKey = `invariant:${code}:${options?.runtimeKey ?? "na"}:${options?.deploymentId ?? "na"}`

  const contexts: StakingStructuredContexts = {
    staking_runtime: {
      invariant_code: code,
      runtime_key: options?.runtimeKey ?? null,
      deployment_id: options?.deploymentId ?? null,
      chain_family: options?.chainFamily ?? null,
      ...details,
    },
  }

  const level = options?.fatal ? "fatal" : "error"

  let event: (typeof STAKING_SENTRY_EVENT.invariant)[keyof typeof STAKING_SENTRY_EVENT.invariant] =
    STAKING_SENTRY_EVENT.invariant.impossible_execution_state
  if (code.includes("family") || code.includes("disabled_runtime")) {
    event = STAKING_SENTRY_EVENT.invariant.disabled_family_participating
  } else if (code.includes("sequence") || code.includes("ordering")) {
    event = STAKING_SENTRY_EVENT.invariant.sequence_ordering
  } else if (code.includes("swap") || code.includes("final_invariant")) {
    event = STAKING_SENTRY_EVENT.invariant.runtime_swap_final_failed
  } else if (code.includes("provider") || code.includes("hierarchy")) {
    event = STAKING_SENTRY_EVENT.invariant.provider_tree_corruption
  } else if (code.includes("generation") || code.includes("stale")) {
    event = STAKING_SENTRY_EVENT.invariant.stale_generation_collision
  }

  captureStakingStructuredEvent({
    event,
    level,
    message: `${event}:${code}`,
    dedupeKey,
    tags: {
      deployment_id: options?.deploymentId ?? null,
      runtime_key: options?.runtimeKey ?? null,
      chain_family: options?.chainFamily ?? null,
    },
    contexts,
    fingerprint: [event, code],
  })
}
