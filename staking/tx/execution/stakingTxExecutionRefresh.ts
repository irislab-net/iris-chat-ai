import type { TransactionReceipt } from "ethers"

export function stakingTxAfterDepositWithdrawConfirmed(input: {
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
  refreshStakingHistory: () => void | Promise<unknown>
  refetchAffiliateStats: () => void | Promise<unknown>
}): void {
  input.setRefreshKey(k => k + 1)
  void input.refreshStakingHistory()
  void input.refetchAffiliateStats()
}

export function stakingTxWrapReceiptWaitWithDepositWithdrawRefresh(
  receiptWait: Promise<TransactionReceipt>,
  onConfirmed: () => void
): Promise<TransactionReceipt> {
  return receiptWait.then((receipt: TransactionReceipt) => {
    onConfirmed()
    return receipt
  })
}
