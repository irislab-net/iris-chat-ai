import { stakingTxIntegrityDev, traceTxMobilePipeline } from "@/staking/diagnostics"
import { abandonStakingVaultTxExecutionLoading } from "@/staking/tx/execution/stakingVaultTxExecutionOwnershipBridge"

export type RetryFormExecutionRefs = {
  submitInFlight: { current: boolean }
  flowRunnerStarted: { current: boolean }
  flowRunner: { current: (() => void) | null }
  walletFlowStarted: { current: boolean }
}

export type RetryFormExecutionArmCallbacks = {
  setIsFlowArmed: (armed: boolean) => void
  setSubmitUiLocked: (locked: boolean) => void
  setSubmitIntentActive: (active: boolean) => void
  endSubmitPhase?: () => void
}

/**
 * Clears stale form-owned execution refs before retry arms.
 * Provider must only bump `retryRequest` until this runs + direct launch succeeds.
 */
export function releaseFormExecutionOwnershipForRetry(
  form: "deposit" | "withdraw",
  refs: RetryFormExecutionRefs,
  callbacks: RetryFormExecutionArmCallbacks,
): void {
  const staleRefs = {
    submitInFlight: refs.submitInFlight.current,
    flowRunnerStarted: refs.flowRunnerStarted.current,
    hasFlowRunner: refs.flowRunner.current !== null,
    walletFlowStarted: refs.walletFlowStarted.current,
  }
  if (
    staleRefs.submitInFlight ||
    staleRefs.flowRunnerStarted ||
    staleRefs.hasFlowRunner ||
    staleRefs.walletFlowStarted
  ) {
    stakingTxIntegrityDev("retry_stale_submission_refs_released", {
      form,
      ...staleRefs,
    })
  }
  abandonStakingVaultTxExecutionLoading(`retry_release_${form}`)
  refs.submitInFlight.current = false
  refs.flowRunnerStarted.current = false
  refs.flowRunner.current = null
  refs.walletFlowStarted.current = false
  callbacks.setIsFlowArmed(false)
  callbacks.setSubmitUiLocked(false)
  callbacks.setSubmitIntentActive(false)
  callbacks.endSubmitPhase?.()
  traceTxMobilePipeline("retry_execution_ownership_released", { form })
}
