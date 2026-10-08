import { STAKING_VAULT_ABI } from "@/abis/stakingVault"
import { STAKING_VAULT_ADDRESS } from "@/constants/stakingVaultConfig"
import { tryParseAmountWei } from "@/lib/stakingAmountInput"
import { readStoredReferral } from "@/lib/stakingReferralStorage"
import {
  classifyStakeWalletError,
  StakingTransactionError,
} from "@/lib/stakingTransactionMessages"
import { ensureStakingVaultAllowance, stakingAllowanceDevLog } from "@/staking/tx/execution/stakingTxAllowance"
import { useStakingTxExecutionTargetGuard } from "@/staking/tx/execution/stakingTxExecutionGuards"
import {
  stakingTxAfterDepositWithdrawConfirmed,
  stakingTxWrapReceiptWaitWithDepositWithdrawRefresh,
} from "@/staking/tx/execution/stakingTxExecutionRefresh"
import type {
  StakingTxOptions,
  StakingTxResult,
  StakingVaultTxExecution,
  UseStakingVaultTxExecutionInput,
} from "@/staking/tx/execution/stakingTxExecutionTypes"
import { stakingSentryBreadcrumb } from "@/lib/stakingSentry"
import {
  handleWalletConnectStaleSessionError,
  markWalletConnectTxDispatchTelemetry,
} from "@/lib/wallet/walletConnectSessionRecovery"
import { traceTxMobilePipeline } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import {
  beginMobileStakingWalletOp,
  endMobileStakingWalletOp,
  traceMobileStakingFlow,
} from "@/staking/diagnostics/mobileStakingLanLog"
import { stakingTxIntegrityDev } from "@/staking/diagnostics/stakingTxIntegrityDev"
import { notifyStakingTxWalletDispatchEnded, notifyStakingTxWalletDispatchStarted } from "@/staking/tx/stakingTxWalletDispatchBridge"
import { Contract, getAddress, type Signer } from "ethers"
import { useCallback } from "react"

export type {
  StakingApprovalMode,
  StakingTxOptions,
  StakingTxResult,
  StakingVaultTxExecution,
  UseStakingVaultTxExecutionInput,
} from "@/staking/tx/execution/stakingTxExecutionTypes"

export function useStakingVaultTxExecution(
  input: UseStakingVaultTxExecutionInput
): StakingVaultTxExecution {
  const {
    stakingRuntime,
    canTransact,
    signer,
    executionAddress,
    tokenAddress,
    tokenDecimals,
    acquireVaultTxExecutionLoading,
    releaseVaultTxExecutionLoading,
    setRefreshKey,
    refreshBalances,
    refreshStakingHistory,
    refetchAffiliateStats,
  } = input

  const guardStakingTxExecutionTarget = useStakingTxExecutionTargetGuard(stakingRuntime)

  const ensureAllowance = useCallback(
    async (
      amount: bigint,
      s: Signer,
      options?: StakingTxOptions
    ): Promise<StakingTxResult | null> => {
      if (!tokenAddress) throw new StakingTransactionError("wallet")
      if (tokenDecimals === null) {
        throw new StakingTransactionError("wallet", new Error("Token decimals unavailable"))
      }
      return ensureStakingVaultAllowance({
        amount,
        signer: s,
        options,
        tokenAddress,
        tokenDecimals,
        guardStakingTxExecutionTarget,
      })
    },
    [tokenAddress, tokenDecimals, guardStakingTxExecutionTarget]
  )

  const deposit = useCallback(
    async (
      amountHuman: string,
      options?: StakingTxOptions
    ): Promise<StakingTxResult | null> => {
      if (!canTransact || !signer || !executionAddress || !tokenAddress) {
        traceTxMobilePipeline("signer_request", {
          op: "deposit",
          blocked: true,
          hasSigner: Boolean(signer),
          canTransact,
        })
        throw new StakingTransactionError("wallet")
      }
      if (tokenDecimals === null) {
        throw new StakingTransactionError("wallet", new Error("Token decimals unavailable"))
      }
      const amount = tryParseAmountWei(amountHuman, tokenDecimals)
      if (amount === null || amount <= 0n) return null

      markWalletConnectTxDispatchTelemetry("vault_tx:deposit")
      const executionLease = acquireVaultTxExecutionLoading("deposit")
      stakingSentryBreadcrumb("tx_started", { op: "deposit" })
      try {
        traceTxMobilePipeline("signer_resolved", { op: "deposit" })
        guardStakingTxExecutionTarget(options)
        const vault = new Contract(STAKING_VAULT_ADDRESS, STAKING_VAULT_ABI, signer)
        const receiver = getAddress(executionAddress)
        const maxDep = await vault.maxDeposit(receiver)
        if (amount > maxDep) {
          throw new StakingTransactionError("deposit", new Error("Exceeds max deposit"))
        }
        const storedReferral = readStoredReferral()
        const referralIsOwnWallet =
          storedReferral !== null &&
          storedReferral.toLowerCase() === receiver.toLowerCase()
        const useAffiliateDeposit =
          storedReferral !== null && !referralIsOwnWallet

        if (useAffiliateDeposit) {
          try {
            await vault.depositWithAffiliate.staticCall(
              amount,
              receiver,
              storedReferral
            )
          } catch (error) {
            try {
              await vault.deposit.staticCall(amount, receiver)
            } catch {
              throw new StakingTransactionError("deposit", error)
            }
            throw new StakingTransactionError("affiliateDeposit", error)
          }
        }

        stakingSentryBreadcrumb("tx_signature_requested", { op: "deposit" })
        if ((process.env.NODE_ENV !== 'production') && (!canTransact || !signer || !executionAddress)) {
          stakingTxIntegrityDev("tx_execution_ready_drift_before_dispatch", {
            op: "deposit",
            canTransact,
            hasSigner: Boolean(signer),
            hasExecutionAddress: Boolean(executionAddress),
          })
        }
        traceTxMobilePipeline("wallet_sendTransaction_start", {
          op: "deposit",
          affiliate: useAffiliateDeposit,
        })
        traceMobileStakingFlow("stake_wallet_send_start", {
          affiliate: useAffiliateDeposit,
        })
        beginMobileStakingWalletOp("deposit")
        notifyStakingTxWalletDispatchStarted("deposit")
        let tx
        try {
          tx = useAffiliateDeposit
            ? await vault.depositWithAffiliate(amount, receiver, storedReferral)
            : await vault.deposit(amount, receiver)
          stakingSentryBreadcrumb("tx_hash_received", {
            op: "deposit",
            has_hash: Boolean(tx.hash),
          })
          traceTxMobilePipeline("wallet_sendTransaction_end", {
            op: "deposit",
            hashPresent: Boolean(tx.hash),
          })
          traceMobileStakingFlow("stake_wallet_send_resolved", {
            hashPresent: Boolean(tx.hash),
          })
        } catch (sendErr) {
          traceTxMobilePipeline("wallet_sendTransaction_rejected", {
            op: "deposit",
          })
          const classified = classifyStakeWalletError(sendErr)
          traceMobileStakingFlow("stake_wallet_send_rejected", classified, sendErr)
          throw sendErr
        } finally {
          endMobileStakingWalletOp("deposit")
        }

        const txHash = typeof tx.hash === "string" ? tx.hash : ""
        const waitForReceipt = options?.waitForReceipt !== false
        if (!waitForReceipt) {
          const receiptWait = stakingTxWrapReceiptWaitWithDepositWithdrawRefresh(
            tx.wait(),
            () =>
              stakingTxAfterDepositWithdrawConfirmed({
                setRefreshKey,
                refreshStakingHistory,
                refetchAffiliateStats,
              })
          )
          if (txHash && options?.onSubmitted) {
            options.onSubmitted(txHash, receiptWait)
          }
          return { txHash, receiptWait }
        }
        if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
        await tx.wait()
        stakingTxAfterDepositWithdrawConfirmed({
          setRefreshKey,
          refreshStakingHistory,
          refetchAffiliateStats,
        })
        return { txHash }
      } catch (error) {
        void handleWalletConnectStaleSessionError("vault_tx:deposit", error)
        if (error instanceof StakingTransactionError) throw error
        throw new StakingTransactionError("deposit", error)
      } finally {
        releaseVaultTxExecutionLoading(executionLease)
      }
    },
    [
      canTransact,
      signer,
      executionAddress,
      tokenAddress,
      tokenDecimals,
      refreshStakingHistory,
      refetchAffiliateStats,
      guardStakingTxExecutionTarget,
      acquireVaultTxExecutionLoading,
      releaseVaultTxExecutionLoading,
      setRefreshKey,
    ]
  )

  const approveStakeAmount = useCallback(
    async (
      amountHuman: string,
      options?: StakingTxOptions
    ): Promise<StakingTxResult | null> => {
      if (!canTransact || !signer || !executionAddress || !tokenAddress) {
        throw new StakingTransactionError("wallet")
      }
      if (tokenDecimals === null) {
        throw new StakingTransactionError(
          "wallet",
          new Error("Token decimals unavailable")
        )
      }
      const amount = tryParseAmountWei(amountHuman, tokenDecimals)
      if (amount === null || amount <= 0n) return null
      stakingAllowanceDevLog("approveStakeAmount_call", {
        parsedDepositWei: amount.toString(),
        approvalMode: options?.approvalMode ?? "limited",
      })
      try {
        const result = await ensureAllowance(amount, signer, options)
        if (result?.receiptWait) {
          void result.receiptWait.then(() => {
            refreshBalances()
          })
        } else {
          refreshBalances()
        }
        return result ?? { txHash: "" }
      } catch (error) {
        if (error instanceof StakingTransactionError) throw error
        throw new StakingTransactionError("approval", error)
      }
    },
    [
      canTransact,
      signer,
      executionAddress,
      tokenAddress,
      tokenDecimals,
      ensureAllowance,
      refreshBalances,
    ]
  )

  const withdraw = useCallback(
    async (
      amountHuman: string,
      options?: StakingTxOptions
    ): Promise<StakingTxResult | null> => {
      if (!canTransact || !signer || !executionAddress || !tokenAddress) {
        traceTxMobilePipeline("signer_request", {
          op: "withdraw",
          blocked: true,
          hasSigner: Boolean(signer),
          canTransact,
        })
        throw new StakingTransactionError("wallet")
      }
      if (tokenDecimals === null) {
        throw new StakingTransactionError("wallet", new Error("Token decimals unavailable"))
      }
      const assets = tryParseAmountWei(amountHuman, tokenDecimals)
      if (assets === null || assets <= 0n) return null

      markWalletConnectTxDispatchTelemetry("vault_tx:withdraw")
      const executionLease = acquireVaultTxExecutionLoading("withdraw")
      stakingSentryBreadcrumb("tx_started", { op: "withdraw" })
      try {
        traceTxMobilePipeline("signer_resolved", { op: "withdraw" })
        guardStakingTxExecutionTarget(options)
        const vault = new Contract(STAKING_VAULT_ADDRESS, STAKING_VAULT_ABI, signer)
        const self = getAddress(executionAddress)
        const maxW = await vault.maxWithdraw(self)
        if (assets > maxW) {
          throw new StakingTransactionError(
            "withdraw",
            new Error("Exceeds max withdraw")
          )
        }
        await vault.withdraw.staticCall(assets, self, self)
        stakingSentryBreadcrumb("tx_signature_requested", { op: "withdraw" })
        if ((process.env.NODE_ENV !== 'production') && (!canTransact || !signer || !executionAddress)) {
          stakingTxIntegrityDev("tx_execution_ready_drift_before_dispatch", {
            op: "withdraw",
            canTransact,
            hasSigner: Boolean(signer),
            hasExecutionAddress: Boolean(executionAddress),
          })
        }
        traceTxMobilePipeline("wallet_sendTransaction_start", { op: "withdraw" })
        traceMobileStakingFlow("withdraw_wallet_send_start")
        beginMobileStakingWalletOp("withdraw")
        notifyStakingTxWalletDispatchStarted("withdraw")
        let tx
        try {
          tx = await vault.withdraw(assets, self, self)
          stakingSentryBreadcrumb("tx_hash_received", {
            op: "withdraw",
            has_hash: Boolean(tx.hash),
          })
          traceTxMobilePipeline("wallet_sendTransaction_end", {
            op: "withdraw",
            hashPresent: Boolean(tx.hash),
          })
          traceMobileStakingFlow("withdraw_wallet_send_resolved", {
            hashPresent: Boolean(tx.hash),
          })
        } catch (sendErr) {
          traceTxMobilePipeline("wallet_sendTransaction_rejected", {
            op: "withdraw",
          })
          traceMobileStakingFlow("withdraw_wallet_send_rejected", {}, sendErr)
          throw sendErr
        } finally {
          endMobileStakingWalletOp("withdraw")
          notifyStakingTxWalletDispatchEnded()
        }
        const txHash = typeof tx.hash === "string" ? tx.hash : ""
        const waitForReceipt = options?.waitForReceipt !== false
        if (!waitForReceipt) {
          const receiptWait = stakingTxWrapReceiptWaitWithDepositWithdrawRefresh(
            tx.wait(),
            () =>
              stakingTxAfterDepositWithdrawConfirmed({
                setRefreshKey,
                refreshStakingHistory,
                refetchAffiliateStats,
              })
          )
          if (txHash && options?.onSubmitted) {
            options.onSubmitted(txHash, receiptWait)
          }
          return { txHash, receiptWait }
        }
        if (txHash && options?.onSubmitted) options.onSubmitted(txHash)
        await tx.wait()
        stakingTxAfterDepositWithdrawConfirmed({
          setRefreshKey,
          refreshStakingHistory,
          refetchAffiliateStats,
        })
        return { txHash }
      } catch (error) {
        void handleWalletConnectStaleSessionError("vault_tx:withdraw", error)
        if (error instanceof StakingTransactionError) throw error
        throw new StakingTransactionError("withdraw", error)
      } finally {
        releaseVaultTxExecutionLoading(executionLease)
      }
    },
    [
      canTransact,
      signer,
      executionAddress,
      tokenAddress,
      tokenDecimals,
      refreshStakingHistory,
      refetchAffiliateStats,
      guardStakingTxExecutionTarget,
      acquireVaultTxExecutionLoading,
      releaseVaultTxExecutionLoading,
      setRefreshKey,
    ]
  )

  return {
    guardStakingTxExecutionTarget,
    ensureAllowance,
    deposit,
    approveStakeAmount,
    withdraw,
  }
}
