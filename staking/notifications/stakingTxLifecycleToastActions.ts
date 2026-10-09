/** Presentation-only bridge — `TransactionStatusProvider` registers reopen + handoff handlers. */
export type StakingTxLifecycleToastActions = {
  reopenModal: () => void
  requestRecoveredWalletHandoff: (source: string) => void
}

let actions: StakingTxLifecycleToastActions | null = null

export function setStakingTxLifecycleToastActions(
  next: StakingTxLifecycleToastActions | null
): void {
  actions = next
}

export function getStakingTxLifecycleToastActions(): StakingTxLifecycleToastActions | null {
  return actions
}
