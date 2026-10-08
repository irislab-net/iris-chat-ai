import {
  assertExecutionTargetMatchesActive,
  deriveRuntimeExecutionTarget,
} from "@/staking/core/runtimeExecutionTarget"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type {
  StakingTxExecutionTargetGuard,
  StakingTxOptions,
} from "@/staking/tx/execution/stakingTxExecutionTypes"
import { useCallback } from "react"

export function createStakingTxExecutionTargetGuard(
  stakingRuntime: RuntimeOperationContext
): StakingTxExecutionTargetGuard {
  return (options?: StakingTxOptions) => {
    const expected = options?.expectedExecutionTarget
    if (expected == null) return
    assertExecutionTargetMatchesActive(
      expected,
      deriveRuntimeExecutionTarget(stakingRuntime)
    )
  }
}

export function useStakingTxExecutionTargetGuard(
  stakingRuntime: RuntimeOperationContext
): StakingTxExecutionTargetGuard {
  return useCallback(
    (options?: StakingTxOptions) => {
      const expected = options?.expectedExecutionTarget
      if (expected == null) return
      assertExecutionTargetMatchesActive(
        expected,
        deriveRuntimeExecutionTarget(stakingRuntime)
      )
    },
    [stakingRuntime]
  )
}
