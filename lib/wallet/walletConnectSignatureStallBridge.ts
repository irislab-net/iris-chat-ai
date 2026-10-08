/**
 * Bridge: signature stall watchdog → TransactionStatusProvider recoverable failure.
 * Avoids circular imports between diagnostics and the tx modal provider.
 */

export type WalletConnectSignatureStallDetail = Readonly<{
  scenario: string
  durationMs: number
  walletLeftPage: boolean
}>

let stallHandler: ((detail: WalletConnectSignatureStallDetail) => void) | null = null

export function registerWalletConnectSignatureStallHandler(
  fn: ((detail: WalletConnectSignatureStallDetail) => void) | null
): void {
  stallHandler = fn
}

export function notifyWalletConnectSignatureStall(
  detail: WalletConnectSignatureStallDetail
): void {
  stallHandler?.(detail)
}
