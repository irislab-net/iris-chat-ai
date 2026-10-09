import { ERC20_ABI } from "@/abis/stakingVault"
import { STAKING_VAULT_ADDRESS } from "@/constants/stakingVaultConfig"
import type { StakingApprovalMode } from "@/lib/stakingDepositApprovalExecution"
import { StakingTransactionError } from "@/lib/stakingTransactionMessages"
import type {
  StakingTxExecutionTargetGuard,
  StakingTxOptions,
  StakingTxResult,
} from "@/staking/tx/execution/stakingTxExecutionTypes"
import { traceTxMobilePipeline } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import {
  beginMobileStakingWalletOp,
  endMobileStakingWalletOp,
  traceMobileStakingFlow,
  updateMobileStakingLanContext,
} from "@/staking/diagnostics/mobileStakingLanLog"
import {
  notifyStakingTxWalletDispatchEnded,
  notifyStakingTxWalletDispatchStarted,
} from "@/staking/tx/stakingTxWalletDispatchBridge"
import {
  handleWalletConnectStaleSessionError,
} from "@/lib/wallet/walletConnectSessionRecovery"
import { Contract, MaxUint256, type Signer, type TransactionReceipt, type ContractTransactionResponse } from "ethers"

/** USDT-style ERC20: cannot change allowance from one non-zero value to another without reset. */
export function needsUsdtStyleAllowanceReset(current: bigint, target: bigint): boolean {
  return current > 0n && target > 0n && current !== target
}

async function sendApprovalWalletTransaction<T extends ContractTransactionResponse>(
  mode: "limited" | "unlimited",
  step: string,
  send: () => Promise<T>
): Promise<T> {
  traceTxMobilePipeline("wallet_sendTransaction_start", {
    op: "approve",
    mode,
    step,
  })
  traceMobileStakingFlow("approval_wallet_send_start", { mode, step })
  beginMobileStakingWalletOp("approve")
  notifyStakingTxWalletDispatchStarted(`approve:${step}`)
  try {
    const tx = await send()
    traceTxMobilePipeline("wallet_sendTransaction_end", {
      op: "approve",
      hashPresent: Boolean(tx.hash),
      step,
    })
    traceMobileStakingFlow("approval_wallet_send_resolved", {
      mode,
      step,
      hashPresent: Boolean(tx.hash),
    })
    return tx
  } catch (sendErr) {
    void handleWalletConnectStaleSessionError(`vault_tx:approve_${mode}_${step}`, sendErr)
    traceTxMobilePipeline("wallet_sendTransaction_rejected", { op: "approve", step })
    traceMobileStakingFlow("approval_wallet_send_rejected", { mode, step }, sendErr)
    throw sendErr
  } finally {
    endMobileStakingWalletOp("approve")
    notifyStakingTxWalletDispatchEnded()
  }
}

export function stakingAllowanceDevLog(
  message: string,
  data: Record<string, string | boolean | undefined | null>
): void {
  if ((process.env.NODE_ENV !== 'production')) {
    console.log(`[staking-allowance] ${message}`, data)
  }
}

export type EnsureStakingVaultAllowanceInput = Readonly<{
  amount: bigint
  signer: Signer
  options?: StakingTxOptions
  tokenAddress: string
  tokenDecimals: number
  guardStakingTxExecutionTarget: StakingTxExecutionTargetGuard
}>

export async function ensureStakingVaultAllowance(
  input: EnsureStakingVaultAllowanceInput
): Promise<StakingTxResult | null> {
  const {
    amount,
    signer: s,
    options,
    tokenAddress,
    tokenDecimals,
    guardStakingTxExecutionTarget,
  } = input

  if (!tokenAddress) throw new StakingTransactionError("wallet")
  if (tokenDecimals === null) {
    throw new StakingTransactionError("wallet", new Error("Token decimals unavailable"))
  }
  try {
    traceTxMobilePipeline("signer_resolved", { op: "approve_allowance" })
    guardStakingTxExecutionTarget(options)
    const token = new Contract(tokenAddress, ERC20_ABI, s)
    const owner = await s.getAddress()
    const readAllowance = () => token.allowance(owner, STAKING_VAULT_ADDRESS)
    const current = await readAllowance()
    updateMobileStakingLanContext({ allowanceBefore: current.toString() })
    const mode: StakingApprovalMode = options?.approvalMode ?? "limited"
    const waitForReceipt = options?.waitForReceipt !== false

    const verifyLimitedAfterConfirm = async (
      targetAllowanceWei: bigint,
      usedResetToZero: boolean
    ) => {
      try {
        const finalAllowance = await readAllowance()
        stakingAllowanceDevLog("limited_post_confirm", {
          approvalMode: "limited",
          requestedApprovalAmountWei: targetAllowanceWei.toString(),
          approveCalldataAmountWei: targetAllowanceWei.toString(),
          currentAllowanceBefore: current.toString(),
          targetAllowanceWei: targetAllowanceWei.toString(),
          finalOnChainAllowanceWei: finalAllowance.toString(),
          usedResetToZero: String(usedResetToZero),
          exactMatch: String(finalAllowance === targetAllowanceWei),
        })
        if (finalAllowance !== targetAllowanceWei) {
          if ((process.env.NODE_ENV !== 'production')) {
            console.warn("[staking-allowance] limited: on-chain allowance after confirm != target", {
              finalOnChainAllowanceWei: finalAllowance.toString(),
              targetAllowanceWei: targetAllowanceWei.toString(),
            })
          }
        }
      } catch (verifyErr) {
        if ((process.env.NODE_ENV !== 'production')) {
          console.warn("[staking-allowance] limited_post_confirm verify failed (non-fatal)", {
            error:
              verifyErr instanceof Error
                ? verifyErr.message
                : String(verifyErr ?? "unknown"),
          })
        }
      }
    }

    const verifyUnlimitedAfterConfirm = async (usedResetToZero: boolean) => {
      try {
        const finalAllowance = await readAllowance()
        stakingAllowanceDevLog("unlimited_post_confirm", {
          approvalMode: "unlimited",
          requestedApprovalAmountWei: MaxUint256.toString(),
          approveCalldataAmountWei: MaxUint256.toString(),
          currentAllowanceBefore: current.toString(),
          targetAllowanceWei: MaxUint256.toString(),
          finalOnChainAllowanceWei: finalAllowance.toString(),
          usedResetToZero: String(usedResetToZero),
          isMaxUint256: String(finalAllowance === MaxUint256),
        })
        if (finalAllowance !== MaxUint256) {
          if ((process.env.NODE_ENV !== 'production')) {
            console.warn("[staking-allowance] unlimited: on-chain allowance after confirm != MaxUint256", {
              finalOnChainAllowanceWei: finalAllowance.toString(),
            })
          }
        }
      } catch (verifyErr) {
        if ((process.env.NODE_ENV !== 'production')) {
          console.warn("[staking-allowance] unlimited_post_confirm verify failed (non-fatal)", {
            error:
              verifyErr instanceof Error
                ? verifyErr.message
                : String(verifyErr ?? "unknown"),
          })
        }
      }
    }

    if (mode === "unlimited") {
      stakingAllowanceDevLog("ensure_entry", {
        approvalMode: "unlimited",
        depositAmountWei: amount.toString(),
        currentAllowanceWei: current.toString(),
        targetAllowanceWei: MaxUint256.toString(),
      })
      if (current === MaxUint256) {
        stakingAllowanceDevLog("unlimited_skip", {
          reason: "already_max_uint256",
          currentAllowanceWei: current.toString(),
        })
        return null
      }

      if (needsUsdtStyleAllowanceReset(current, MaxUint256)) {
        stakingAllowanceDevLog("usdt_reset_flow", {
          approvalMode: "unlimited",
          firstApproveWei: "0",
          secondApproveWei: MaxUint256.toString(),
        })
        const tx0 = await sendApprovalWalletTransaction("unlimited", "usdt_reset_zero", () =>
          token.approve(STAKING_VAULT_ADDRESS, 0n)
        )
        const h0 = typeof tx0.hash === "string" ? tx0.hash : ""
        if (h0 && options?.onSubmitted) options.onSubmitted(h0)
        await tx0.wait()
        const tx = await sendApprovalWalletTransaction("unlimited", "usdt_reset_target", () =>
          token.approve(STAKING_VAULT_ADDRESS, MaxUint256)
        )
        const txHash = typeof tx.hash === "string" ? tx.hash : ""
        if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
        stakingAllowanceDevLog("approve_broadcast", {
          approvalMode: "unlimited",
          approveCalldataAmountWei: MaxUint256.toString(),
          txHash,
        })
        if (!waitForReceipt) {
          return {
            txHash,
            receiptWait: tx.wait().then(async (r: TransactionReceipt) => {
              await verifyUnlimitedAfterConfirm(true)
              return r
            }),
          }
        }
        await tx.wait()
        await verifyUnlimitedAfterConfirm(true)
        return { txHash }
      }

      const tx = await sendApprovalWalletTransaction("unlimited", "direct", () =>
        token.approve(STAKING_VAULT_ADDRESS, MaxUint256)
      )
      const txHash = typeof tx.hash === "string" ? tx.hash : ""
      if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
      stakingAllowanceDevLog("approve_broadcast", {
        approvalMode: "unlimited",
        approveCalldataAmountWei: MaxUint256.toString(),
        txHash,
      })
      if (!waitForReceipt) {
        return {
          txHash,
          receiptWait: tx.wait().then(async (r: TransactionReceipt) => {
            await verifyUnlimitedAfterConfirm(false)
            return r
          }),
        }
      }
      await tx.wait()
      await verifyUnlimitedAfterConfirm(false)
      return { txHash }
    }

    // Limited: approve exactly the parsed deposit amount (wei). No buffer, no cap expansion.
    const targetAllowanceWei = amount
    stakingAllowanceDevLog("ensure_entry", {
      approvalMode: "limited",
      depositAmountWei: amount.toString(),
      currentAllowanceWei: current.toString(),
      targetAllowanceWei: targetAllowanceWei.toString(),
    })
    if (current === targetAllowanceWei) {
      stakingAllowanceDevLog("limited_skip", {
        reason: "allowance_already_equals_target",
        currentAllowanceWei: current.toString(),
        targetAllowanceWei: targetAllowanceWei.toString(),
      })
      return null
    }

    if (needsUsdtStyleAllowanceReset(current, targetAllowanceWei)) {
      stakingAllowanceDevLog("usdt_reset_flow", {
        approvalMode: "limited",
        firstApproveWei: "0",
        secondApproveWei: targetAllowanceWei.toString(),
      })
      const tx0 = await sendApprovalWalletTransaction("limited", "usdt_reset_zero", () =>
        token.approve(STAKING_VAULT_ADDRESS, 0n)
      )
      const h0 = typeof tx0.hash === "string" ? tx0.hash : ""
      if (h0 && options?.onSubmitted) options.onSubmitted(h0)
      await tx0.wait()
      const tx = await sendApprovalWalletTransaction("limited", "usdt_reset_target", () =>
        token.approve(STAKING_VAULT_ADDRESS, targetAllowanceWei)
      )
      const txHash = typeof tx.hash === "string" ? tx.hash : ""
      if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
      stakingAllowanceDevLog("approve_broadcast", {
        approvalMode: "limited",
        approveCalldataAmountWei: targetAllowanceWei.toString(),
        txHash,
      })
      if (!waitForReceipt) {
        return {
          txHash,
          receiptWait: tx.wait().then(async (r: TransactionReceipt) => {
            await verifyLimitedAfterConfirm(targetAllowanceWei, true)
            return r
          }),
        }
      }
      await tx.wait()
      await verifyLimitedAfterConfirm(targetAllowanceWei, true)
      return { txHash }
    }

    const tx = await sendApprovalWalletTransaction("limited", "direct", () =>
      token.approve(STAKING_VAULT_ADDRESS, targetAllowanceWei)
    )
    const txHash = typeof tx.hash === "string" ? tx.hash : ""
    if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
    stakingAllowanceDevLog("approve_broadcast", {
      approvalMode: "limited",
      approveCalldataAmountWei: targetAllowanceWei.toString(),
      txHash,
    })
    if (!waitForReceipt) {
      return {
        txHash,
        receiptWait: tx.wait().then(async (r: TransactionReceipt) => {
          await verifyLimitedAfterConfirm(targetAllowanceWei, false)
          return r
        }),
      }
    }
    await tx.wait()
    await verifyLimitedAfterConfirm(targetAllowanceWei, false)
    return { txHash }
  } catch (error) {
    void handleWalletConnectStaleSessionError("vault_tx:approve", error)
    throw new StakingTransactionError("approval", error)
  }
}
