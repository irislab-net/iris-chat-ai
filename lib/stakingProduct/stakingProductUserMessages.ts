import type { RuntimeSwapFailureReason } from "@/staking/orchestration"
import {
  RUNTIME_SWAP_POLICY_DENIAL_MESSAGES,
  type RuntimeSwapPolicyDenialReason,
} from "@/staking/orchestration"

function isPolicyDenial(r: RuntimeSwapFailureReason): r is RuntimeSwapPolicyDenialReason {
  return r.startsWith("policy_")
}

const GENERIC_SWITCH_UNAVAILABLE =
  "Staking can’t switch networks right now. Try again in a moment."

/**
 * Phase 45 — end-user copy when an internal runtime switch is denied.
 * Never surfaces coordinator / sequence / refresh jargon.
 */
export function stakingProductRuntimeSwitchBlockedMessage(
  reason: RuntimeSwapFailureReason
): string {
  if (isPolicyDenial(reason)) {
    return RUNTIME_SWAP_POLICY_DENIAL_MESSAGES[reason] ?? GENERIC_SWITCH_UNAVAILABLE
  }
  switch (reason) {
    case "runtime_switch_rollout_disabled":
      return "That option isn’t available in this app version."
    case "swap_disabled_outside_dev":
      return "That option is only available in a preview environment."
    case "swap_protocol_entry_denied":
      return "Please wait for staking to finish updating, then try again."
    case "begin_rejected":
    case "refresh_paused_rejected":
    case "mutation_phase_invalid":
    case "swapped_rejected":
    case "resume_rejected":
    case "first_settle_rejected":
    case "second_settle_rejected":
    case "final_invariant_failed":
      return "Something interrupted the network switch. Refresh the page and try again."
    default:
      return GENERIC_SWITCH_UNAVAILABLE
  }
}
