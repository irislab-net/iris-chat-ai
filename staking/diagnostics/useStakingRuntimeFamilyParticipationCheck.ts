import { useEffect } from "react"
import { reportStakingInvariantViolation } from "@/lib/stakingSentry"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import type { ChainFamily } from "@/staking/core/types"

/** Production guard: disabled runtime family must never participate in active vault plane. */
export function useStakingRuntimeFamilyParticipationCheck(input: Readonly<{
  deploymentId: string
  runtimeKey: string
  chainFamily: ChainFamily
}>): void {
  useEffect(() => {
    if (isRuntimeFamilyEnabled(input.chainFamily)) return

    reportStakingInvariantViolation(
      "disabled_runtime_family_participating",
      {
        chain_family: input.chainFamily,
        family_enabled: false,
      },
      {
        deploymentId: input.deploymentId,
        runtimeKey: input.runtimeKey,
        chainFamily: input.chainFamily,
      }
    )
  }, [input.deploymentId, input.runtimeKey, input.chainFamily])
}
