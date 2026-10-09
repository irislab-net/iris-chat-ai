import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"

export type StaleProviderTerminalGuardInput = {
  expectedSubmissionId?: number | null
  expectedFlowRunId?: string | null
  liveSubmissionId: number | null
  liveFlowRunId: string | null
  source: string
  operation: "setFailed" | "markUserRejected" | string
}

export function isStaleProviderTerminalUpdate(
  input: Omit<StaleProviderTerminalGuardInput, "source" | "operation">
): boolean {
  const expectedId = input.expectedSubmissionId
  const liveId = input.liveSubmissionId
  if (expectedId != null && expectedId > 0 && liveId != null && liveId !== expectedId) {
    return true
  }
  const expectedRun = input.expectedFlowRunId?.trim() ?? ""
  const liveRun = input.liveFlowRunId?.trim() ?? ""
  if (expectedRun !== "" && liveRun !== "" && liveRun !== expectedRun) {
    return true
  }
  return false
}

export function blockStaleProviderTerminalUpdate(
  input: StaleProviderTerminalGuardInput
): boolean {
  if (
    !isStaleProviderTerminalUpdate({
      expectedSubmissionId: input.expectedSubmissionId,
      expectedFlowRunId: input.expectedFlowRunId,
      liveSubmissionId: input.liveSubmissionId,
      liveFlowRunId: input.liveFlowRunId,
    })
  ) {
    return false
  }
  traceMobileStakingFlow("stale_provider_update_blocked", {
    source: input.source,
    operation: input.operation,
    expectedSubmissionId: input.expectedSubmissionId ?? null,
    expectedFlowRunId: input.expectedFlowRunId ?? null,
    liveSubmissionId: input.liveSubmissionId,
    liveFlowRunId: input.liveFlowRunId,
  })
  return true
}
