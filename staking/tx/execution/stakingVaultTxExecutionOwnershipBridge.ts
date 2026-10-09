/**
 * Bridge so `TransactionStatusProvider` and forms can abandon vault tx loading without
 * expanding the public vault topology or creating a circular provider dependency.
 */

export type AbandonStakingVaultTxExecutionLoading = (reason: string) => void

let abandonHandler: AbandonStakingVaultTxExecutionLoading | null = null

export function registerStakingVaultTxExecutionAbandon(
  fn: AbandonStakingVaultTxExecutionLoading | null
): void {
  abandonHandler = fn
}

export function abandonStakingVaultTxExecutionLoading(reason: string): void {
  abandonHandler?.(reason)
}
