import type { StakingApprovalMode } from "@/lib/stakingDepositApprovalExecution"
import type { RuntimeExecutionTarget } from "@/staking/core/runtimeExecutionTarget"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type {
  StakingVaultTxExecutionLease,
  StakingVaultTxExecutionOp,
} from "@/staking/tx/execution/stakingVaultTxExecutionOwnership"
import type { Signer, TransactionReceipt } from "ethers"

export type StakingTxOptions = {
  /**
   * Called when each approval tx is broadcast. USDT-style tokens may require two txs
   * (`approve(0)` then `approve(target)`); this runs for both, in order.
   */
  /**
   * Fired at broadcast. When `waitForReceipt` is false, `receiptWait` is the background
   * confirmation promise (register in `TransactionStatusProvider` at hash time).
   */
  onSubmitted?: (txHash: string, receiptWait?: Promise<TransactionReceipt>) => void
  /** ERC20 approval sizing when executing limited vs unlimited allowance paths */
  approvalMode?: StakingApprovalMode
  /**
   * When `false`, resolves after broadcast with `receiptWait` for background confirmation.
   * @default true
   */
  waitForReceipt?: boolean
  /**
   * When set, refuse execution if passive staking runtime no longer matches this frozen target (Phase 30).
   */
  expectedExecutionTarget?: RuntimeExecutionTarget
}

export type { StakingApprovalMode }

export type StakingTxResult = {
  txHash: string
  /** Populated when `waitForReceipt: false` and a transaction was broadcast */
  receiptWait?: Promise<TransactionReceipt>
}

export type StakingTxExecutionTargetGuard = (options?: StakingTxOptions) => void

export type UseStakingVaultTxExecutionInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  canTransact: boolean
  signer: Signer | null | undefined
  executionAddress: string | undefined
  tokenAddress: string | null
  tokenDecimals: number | null
  acquireVaultTxExecutionLoading: (
    op: StakingVaultTxExecutionOp
  ) => StakingVaultTxExecutionLease
  releaseVaultTxExecutionLoading: (lease: StakingVaultTxExecutionLease) => void
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
  refreshBalances: () => void
  refreshStakingHistory: (
    opts?: { shallow?: boolean; skipIfInFlight?: boolean }
  ) => Promise<unknown>
  refetchAffiliateStats: () => void | Promise<unknown>
}>

export type StakingVaultTxExecution = Readonly<{
  guardStakingTxExecutionTarget: StakingTxExecutionTargetGuard
  ensureAllowance: (
    amount: bigint,
    s: Signer,
    options?: StakingTxOptions
  ) => Promise<StakingTxResult | null>
  deposit: (
    amountHuman: string,
    options?: StakingTxOptions
  ) => Promise<StakingTxResult | null>
  approveStakeAmount: (
    amountHuman: string,
    options?: StakingTxOptions
  ) => Promise<StakingTxResult | null>
  withdraw: (
    amountHuman: string,
    options?: StakingTxOptions
  ) => Promise<StakingTxResult | null>
}>
