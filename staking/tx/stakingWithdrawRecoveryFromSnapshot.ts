import { STAKING_VAULT_ADDRESS } from "@/constants/stakingVaultConfig"
import { tryParseAmountWei } from "@/lib/stakingAmountInput"
import { getJsonRpcProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { getAddress, id, zeroPadValue } from "ethers"

const WITHDRAW_EVENT_TOPIC = id("Withdraw(address,address,address,uint256,uint256)")
/** ~12h on Ethereum mainnet; sufficient for mobile wallet return / refresh recovery. */
const WITHDRAW_LOG_LOOKBACK_BLOCKS = 3_600

function parseWithdrawWeiFromSnapshot(
  snap: TransactionStatusSnapshot,
  tokenDecimals: number | null
): bigint | null {
  if (snap.scenario !== "withdraw" || tokenDecimals === null) return null
  const m = /^([0-9]+(?:[.,][0-9]+)?)/.exec(snap.amountLabel.trim())
  const human = m?.[1]?.replace(",", ".") ?? ""
  if (!human) return null
  return tryParseAmountWei(human, tokenDecimals)
}

export function snapshotNeedsWithdrawHashRecovery(
  snap: TransactionStatusSnapshot
): boolean {
  if (snap.scenario !== "withdraw") return false
  if (snap.withdrawTxHash?.trim()) return false
  if (snap.terminal) return false
  return (
    snap.uiPhase === "awaiting_signature" ||
    snap.uiPhase === "pending" ||
    snap.uiPhase === "submitted" ||
    snap.uiPhase === "confirming"
  )
}

export function applyRecoveredWithdrawHashToSnapshot(
  snap: TransactionStatusSnapshot,
  txHash: string
): TransactionStatusSnapshot {
  const hash = txHash.trim()
  return {
    ...snap,
    uiPhase: "submitted",
    submittedAt: snap.submittedAt ?? Date.now(),
    txHash: hash,
    withdrawTxHash: hash,
    withdrawWirePhase: "submitted",
    preparingTransaction: false,
  }
}

export async function tryRecoverWithdrawTxHashFromOnChain(input: Readonly<{
  snapshot: TransactionStatusSnapshot
  deployment: StakingDeploymentConfig
  tokenDecimals: number | null
  ownerAddress: string | null | undefined
  source: string
}>): Promise<string | null> {
  const { snapshot, deployment, tokenDecimals, ownerAddress, source } = input
  if (!snapshotNeedsWithdrawHashRecovery(snapshot)) return null
  if (!ownerAddress?.trim()) return null
  const requiredWei = parseWithdrawWeiFromSnapshot(snapshot, tokenDecimals)
  if (requiredWei === null || requiredWei <= 0n) return null

  traceMobileStakingFlow("withdraw_receipt_wait_started", {
    submissionId: snapshot.submissionId,
    flowRunId: snapshot.runId,
    source,
    reason: "on_chain_hash_recovery",
    requiredWei: requiredWei.toString(),
  })

  try {
    const provider = getJsonRpcProviderForDeployment(deployment)
    const owner = getAddress(ownerAddress)
    const ownerTopic = zeroPadValue(owner, 32)
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - WITHDRAW_LOG_LOOKBACK_BLOCKS)
    const logs = await provider.getLogs({
      address: STAKING_VAULT_ADDRESS,
      topics: [WITHDRAW_EVENT_TOPIC, null, null, ownerTopic],
      fromBlock,
      toBlock: currentBlock,
    })

    let bestHash: string | null = null
    let bestBlock = 0
    for (const log of logs) {
      const data = log.data.startsWith("0x") ? log.data.slice(2) : log.data
      if (data.length < 64) continue
      const assets = BigInt(`0x${data.slice(0, 64)}`)
      if (assets !== requiredWei) continue
      const blockNumber = log.blockNumber ?? 0
      if (blockNumber >= bestBlock) {
        bestBlock = blockNumber
        bestHash = log.transactionHash
      }
    }

    if (!bestHash?.trim()) {
      traceMobileStakingFlow("withdraw_receipt_wait_resolved", {
        submissionId: snapshot.submissionId,
        flowRunId: snapshot.runId,
        source,
        reason: "on_chain_hash_recovery_miss",
        requiredWei: requiredWei.toString(),
        logCount: logs.length,
      })
      return null
    }

    traceMobileStakingFlow("withdraw_tx_hash_received", {
      submissionId: snapshot.submissionId,
      flowRunId: snapshot.runId,
      source,
      reason: "on_chain_recovery",
      hashPrefix: bestHash.slice(0, 18),
      requiredWei: requiredWei.toString(),
    })
    return bestHash
  } catch (err) {
    traceMobileStakingFlow("withdraw_receipt_wait_resolved", {
      submissionId: snapshot.submissionId,
      flowRunId: snapshot.runId,
      source,
      reason: "on_chain_hash_recovery_error",
      readFailed: true,
      message: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
