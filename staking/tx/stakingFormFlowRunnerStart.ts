import {
  stakingTxIntegrityDev,
  traceTxMobilePipeline,
} from "@/staking/diagnostics"

export type StakingFormFlowRunnerStartInput = {
  form: "deposit" | "withdraw"
  launch: "direct_sync" | "preview_preparing_layout"
  flowRunnerStarted: { current: boolean }
  flowRunner: { current: (() => void) | null }
  setIsFlowArmed: (armed: boolean) => void
  /** When false, never start the armed runner (hydrated/rejected submissions). */
  canAutoDispatch?: () => boolean
  /** User-initiated preview confirm / retry direct — bypasses auto-dispatch guard. */
  manualDispatch?: boolean
}

/**
 * Starts the armed flow runner synchronously (direct/retry) without waiting for an effect.
 * Returns false if already started or no runner is queued.
 */
export function startStakingFormFlowRunnerDirect(
  input: StakingFormFlowRunnerStartInput,
): boolean {
  if (!input.manualDispatch && input.canAutoDispatch && !input.canAutoDispatch()) {
    traceTxMobilePipeline("flow_runner_blocked", {
      form: input.form,
      launch: input.launch,
      reason: "canAutoDispatch_false",
    })
    input.setIsFlowArmed(false)
    return false
  }
  if (input.flowRunnerStarted.current) {
    stakingTxIntegrityDev("duplicate_flow_runner_activation", {
      form: input.form,
      launch: input.launch,
    })
    return false
  }
  const run = input.flowRunner.current
  if (!run) {
    stakingTxIntegrityDev("preparing_without_execution_owner", {
      form: input.form,
      launch: input.launch,
    })
    return false
  }

  traceTxMobilePipeline("flow_runner_armed", {
    form: input.form,
    launch: input.launch,
  })
  input.flowRunner.current = null
  input.setIsFlowArmed(false)
  input.flowRunnerStarted.current = true
  traceTxMobilePipeline("flow_runner_start", {
    form: input.form,
    launch: input.launch,
  })
  run()
  return true
}

export type StakingFormFlowRunnerLayoutInput = StakingFormFlowRunnerStartInput & {
  isFlowArmed: boolean
  uiPhase: string | null
  preparingTransaction: boolean
}

/** Preview confirm path — same start rules, gated on snapshot preparing flag. */
export function tryStartStakingFormFlowRunnerFromLayout(
  input: StakingFormFlowRunnerLayoutInput,
): boolean {
  if (!input.isFlowArmed || input.uiPhase !== "preview" || !input.preparingTransaction) {
    return false
  }
  if (!input.flowRunner.current && !input.flowRunnerStarted.current) {
    stakingTxIntegrityDev("preview_without_runner_ownership", {
      form: input.form,
      uiPhase: input.uiPhase,
      preparingTransaction: input.preparingTransaction,
    })
  }
  return startStakingFormFlowRunnerDirect({
    form: input.form,
    launch: "preview_preparing_layout",
    flowRunnerStarted: input.flowRunnerStarted,
    flowRunner: input.flowRunner,
    setIsFlowArmed: input.setIsFlowArmed,
    canAutoDispatch: input.canAutoDispatch,
    manualDispatch: true,
  })
}
