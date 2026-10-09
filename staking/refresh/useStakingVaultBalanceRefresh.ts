import { STAKING_TRON_CHAIN_FAMILY, STAKING_TRON_TOKEN_ADDRESS } from "@/staking/config"
import {
  notifyStakingRefresh,
  startStakingRefreshOrchestrator,
  stopStakingRefreshOrchestrator,
} from "@/staking/refresh"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import { canRuntimeOperationCommitWithDevTrace } from "@/staking/orchestration"
import { fetchTronPassiveBalances } from "@/staking/reads"
import { normalizeStakingVaultChainId } from "@/staking/runtime/stakingVaultChainId"
import type {
  StakingVaultBalanceRefreshCallbacks,
  StakingVaultBalanceRefreshCallbacksInput,
  StakingVaultBalanceRefreshOrchestratorInput,
  StakingVaultBalanceRefreshResetAndContinuityInput,
  StakingVaultBalanceRefreshTronPollingInput,
  StakingVaultBalanceRefreshTronRefetchWiringInput,
} from "@/staking/refresh/types"
import { MaxUint256 } from "ethers"
import { devAssertSingleRefreshOrchestratorOwner } from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { useCallback, useEffect, useMemo } from "react"

export type {
  StakingVaultBalanceRefBag,
  StakingVaultBalanceRefreshCallbacks,
  StakingVaultBalanceRefreshCallbacksInput,
  StakingVaultBalanceRefreshOrchestratorInput,
  StakingVaultBalanceRefreshResetAndContinuityInput,
  StakingVaultBalanceRefreshSetters,
  StakingVaultBalanceRefreshTronPollingInput,
  StakingVaultBalanceRefreshTronRefetchWiringInput,
} from "@/staking/refresh/types"

export function useStakingVaultBalanceRefreshCallbacks(
  input: StakingVaultBalanceRefreshCallbacksInput
): StakingVaultBalanceRefreshCallbacks {
  const {
    isMountedRef,
    transition,
    stakingRuntime,
    tronAddressCodec,
    isTronPassiveRuntime,
    refs,
    setters,
    runtimeWalletAddress,
  } = input
  const {
    balanceSnapshotRef,
    lastDisplayBalancesRef,
    observedBalanceRef,
    tronPassiveRefetchRef,
    tronPassiveFetchGenRef,
    tronPassiveReadFailStreakRef,
  } = refs
  const {
    setWalletBalance,
    setAllowance,
    setVaultShares,
    setStakedAssets,
    setVaultMaxDepositWei,
    setVaultMaxWithdrawWei,
    setMinWithdrawalFeeWei,
    setBalancesFetched,
    setObservedBalanceAnchorMs,
  } = setters

  const refreshBalances = useCallback(() => {
    notifyStakingRefresh("wallet-state-change")
    tronPassiveRefetchRef.current?.()
  }, [])

  const refetchTronPassiveBalances = useCallback(async () => {
    if (!isTronPassiveRuntime) return
    const wallet = runtimeWalletAddress?.trim()
    if (!wallet || !tronAddressCodec.isValid(wallet)) return
    const tok = STAKING_TRON_TOKEN_ADDRESS?.trim()
    if (!tok || !tronAddressCodec.isValid(tok)) return
    const gen = ++tronPassiveFetchGenRef.current
    const coordinatorAtStart = transition.coordinatorSnapshot
    const latestCoordinatorSnapshotRefLocal = transition.latestCoordinatorSnapshotRef
    try {
      const c = await fetchTronPassiveBalances({
        deployment: stakingRuntime.deployment,
        tokenContractBase58: tok,
        walletBase58: wallet,
      })
      if (gen !== tronPassiveFetchGenRef.current || !isMountedRef.current) return
      if (
        !canRuntimeOperationCommitWithDevTrace(
          "useStakingVault:tronPassiveBalancesCommit",
          coordinatorAtStart,
          latestCoordinatorSnapshotRefLocal.current
        )
      ) {
        return
      }
      const prevShares = balanceSnapshotRef.current.vaultShares
      const sharesChanged = prevShares !== c.vaultShares
      balanceSnapshotRef.current = {
        walletBalance: c.walletBalance,
        allowance: c.allowance,
        vaultShares: c.vaultShares,
        stakedAssets: c.stakedAssets,
        vaultMaxDepositWei: c.vaultMaxDepositWei,
        vaultMaxWithdrawWei: c.vaultMaxWithdrawWei,
        minWithdrawalFeeWei: c.minWithdrawalFeeWei,
      }
      lastDisplayBalancesRef.current = { ...balanceSnapshotRef.current }
      setWalletBalance(c.walletBalance)
      setAllowance(c.allowance)
      setVaultShares(c.vaultShares)
      setStakedAssets(c.stakedAssets)
      setVaultMaxDepositWei(c.vaultMaxDepositWei)
      setVaultMaxWithdrawWei(c.vaultMaxWithdrawWei)
      setMinWithdrawalFeeWei(c.minWithdrawalFeeWei)
      if (sharesChanged) {
        const anchorMs = Date.now()
        observedBalanceRef.current = { balance: c.vaultShares, anchorMs }
        setObservedBalanceAnchorMs(anchorMs)
      }
      setBalancesFetched(true)
      tronPassiveReadFailStreakRef.current = 0
    } catch {
      tronPassiveReadFailStreakRef.current += 1
      if (
        isRuntimeTelemetryEmitEnabled() &&
        tronPassiveReadFailStreakRef.current >= 3
      ) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent(
            "tron_passive_read_repeated_failure",
            "warning",
            {
              runtimeKey: stakingRuntime.runtimeKey,
              deploymentId: stakingRuntime.deployment.id.trim(),
              chainFamily: STAKING_TRON_CHAIN_FAMILY,
              reasonToken: "tron_passive_balance_fetch_catch",
            },
            tronPassiveReadFailStreakRef.current
          )
        )
        tronPassiveReadFailStreakRef.current = 0
      }
    }
  }, [
    isTronPassiveRuntime,
    runtimeWalletAddress,
    stakingRuntime.deployment,
    stakingRuntime.runtimeKey,
    transition,
    tronAddressCodec,
  ])

  return { refreshBalances, refetchTronPassiveBalances }
}

/** Register after `refreshBalances` / `refetchTronPassiveBalances` callbacks exist. */
export function useStakingVaultBalanceRefreshTronRefetchWiring(
  input: StakingVaultBalanceRefreshTronRefetchWiringInput
): void {
  const { isTronPassiveRuntime, refs, refetchTronPassiveBalances } = input
  const { tronPassiveRefetchRef } = refs

  useEffect(() => {
    if (!isTronPassiveRuntime) {
      tronPassiveRefetchRef.current = null
      return
    }
    tronPassiveRefetchRef.current = () => {
      void refetchTronPassiveBalances()
    }
    return () => {
      tronPassiveRefetchRef.current = null
    }
  }, [isTronPassiveRuntime, refetchTronPassiveBalances])
}

export function useStakingVaultBalanceRefreshResetAndContinuity(
  input: StakingVaultBalanceRefreshResetAndContinuityInput
): void {
  const {
    isTronPassiveRuntime,
    stakingRuntime,
    runtimeWallet,
    runtimeWalletAddress,
    address,
    numericChainId,
    isConnected,
    isEthereumNetwork,
    isWrongNetwork,
    tokenAddress,
    tronAddressCodec,
    refs,
    setters,
  } = input
  const { balanceSnapshotRef, lastDisplayBalancesRef } = refs
  const { setTokenMetaFetched, setBalancesFetched, setTokenDecimals, setTokenMetaError } =
    setters

  const vaultBalanceResetKey = useMemo(() => {
    if (isTronPassiveRuntime) {
      return `${stakingRuntime.runtimeKey}|${stakingRuntime.deployment.id}|${runtimeWalletAddress ?? ""}|${runtimeWallet.identityOrigin ?? ""}`
    }
    return `${stakingRuntime.runtimeKey}|${address ?? ""}|${numericChainId ?? ""}|${isConnected}|${isEthereumNetwork}`
  }, [
    isTronPassiveRuntime,
    stakingRuntime.runtimeKey,
    stakingRuntime.deployment.id,
    runtimeWalletAddress,
    runtimeWallet.identityOrigin,
    address,
    numericChainId,
    isConnected,
    isEthereumNetwork,
  ])

  useEffect(() => {
    setTokenMetaFetched(false)
    setBalancesFetched(false)
    setTokenDecimals(null)
    setTokenMetaError(null)
    const z = {
      walletBalance: 0n,
      allowance: 0n,
      vaultShares: 0n,
      stakedAssets: 0n,
      vaultMaxDepositWei: MaxUint256,
      vaultMaxWithdrawWei: MaxUint256,
      minWithdrawalFeeWei: 0n,
    }
    balanceSnapshotRef.current = z
    lastDisplayBalancesRef.current = z
  }, [vaultBalanceResetKey])

  /** Phase 48 — pool token change: keep meta + balance flags warm; seed snapshot from last commit. */
  /** Phase 53.3 — pool snapshot continuity: Tron uses passive TronLink identity, not AppKit `address`. */
  const poolSnapshotContinuityKey = useMemo(() => {
    if (!tokenAddress) return ""
    if (isTronPassiveRuntime) {
      return `${tokenAddress}|${runtimeWalletAddress ?? ""}`
    }
    return `${tokenAddress}|${address ?? ""}|${isConnected}|${isEthereumNetwork}|${isWrongNetwork}`
  }, [
    isTronPassiveRuntime,
    tokenAddress,
    runtimeWalletAddress,
    address,
    isConnected,
    isEthereumNetwork,
    isWrongNetwork,
  ])

  useEffect(() => {
    if (!tokenAddress) return
    if (isTronPassiveRuntime) {
      const tronAddr = runtimeWalletAddress?.trim()
      if (tronAddr && tronAddressCodec.isValid(tronAddr)) {
        balanceSnapshotRef.current = { ...lastDisplayBalancesRef.current }
      }
      return
    }
    if (!isConnected || !address) return
    if (!isEthereumNetwork || isWrongNetwork) return
    balanceSnapshotRef.current = { ...lastDisplayBalancesRef.current }
  }, [
    poolSnapshotContinuityKey,
    tokenAddress,
    isTronPassiveRuntime,
    runtimeWalletAddress,
    tronAddressCodec,
    isConnected,
    address,
    isEthereumNetwork,
    isWrongNetwork,
  ])
}

export function useStakingVaultBalanceRefreshTxNotify(refreshKey: number): void {
  useEffect(() => {
    if (refreshKey > 0) {
      notifyStakingRefresh("tx-state-change")
    }
  }, [refreshKey])
}

export function useStakingVaultBalanceRefreshOrchestrator(
  input: StakingVaultBalanceRefreshOrchestratorInput
): void {
  const {
    isMountedRef,
    transition,
    runtimeHydrationEnabled,
    isTronPassiveRuntime,
    isConnected,
    address,
    tokenAddress,
    isEthereumNetwork,
    isWrongNetwork,
    assetResolved,
    chainId,
    expectedChainId,
    refs,
    setters,
  } = input
  const { balanceSnapshotRef, lastDisplayBalancesRef, observedBalanceRef } = refs
  const {
    setWalletBalance,
    setAllowance,
    setVaultShares,
    setStakedAssets,
    setVaultMaxDepositWei,
    setVaultMaxWithdrawWei,
    setMinWithdrawalFeeWei,
    setBalancesFetched,
    setObservedBalanceAnchorMs,
  } = setters

  useEffect(() => {
    if (!runtimeHydrationEnabled) {
      stopStakingRefreshOrchestrator()
      return
    }
    if (isTronPassiveRuntime) {
      stopStakingRefreshOrchestrator()
      return
    }
    const normChain = normalizeStakingVaultChainId(chainId)
    if (
      !isConnected ||
      !address ||
      !tokenAddress ||
      !isEthereumNetwork ||
      isWrongNetwork ||
      !assetResolved
    ) {
      stopStakingRefreshOrchestrator()
      setBalancesFetched(true)
      return
    }
    if (normChain !== expectedChainId) {
      stopStakingRefreshOrchestrator()
      setBalancesFetched(true)
      return
    }

    const orchestratorCoordinatorAtStart = transition.coordinatorSnapshot
    const latestCoordinatorSnapshotRefLocal = transition.latestCoordinatorSnapshotRef

    const dispose = startStakingRefreshOrchestrator({
      executionIdentity: transition.executionIdentity,
      coordinatorSnapshot: orchestratorCoordinatorAtStart,
      getLatestCoordinatorSnapshot: () => latestCoordinatorSnapshotRefLocal.current,
      walletAddress: address,
      tokenAddress,
      isVisible: () =>
        typeof document !== "undefined" && document.visibilityState === "visible",
      isChainOk: () =>
        isMountedRef.current &&
        normalizeStakingVaultChainId(chainId) === expectedChainId &&
        Boolean(address) &&
        Boolean(tokenAddress),
      getPrevious: () => balanceSnapshotRef.current,
      onCommit: c => {
        if (!isMountedRef.current) return
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useStakingVault:orchestratorOnCommit",
            orchestratorCoordinatorAtStart,
            latestCoordinatorSnapshotRefLocal.current
          )
        ) {
          return
        }
        balanceSnapshotRef.current = {
          walletBalance: c.walletBalance,
          allowance: c.allowance,
          vaultShares: c.vaultShares,
          stakedAssets: c.stakedAssets,
          vaultMaxDepositWei: c.vaultMaxDepositWei,
          vaultMaxWithdrawWei: c.vaultMaxWithdrawWei,
          minWithdrawalFeeWei: c.minWithdrawalFeeWei,
        }
        lastDisplayBalancesRef.current = {
          walletBalance: c.walletBalance,
          allowance: c.allowance,
          vaultShares: c.vaultShares,
          stakedAssets: c.stakedAssets,
          vaultMaxDepositWei: c.vaultMaxDepositWei,
          vaultMaxWithdrawWei: c.vaultMaxWithdrawWei,
          minWithdrawalFeeWei: c.minWithdrawalFeeWei,
        }
        setWalletBalance(c.walletBalance)
        setAllowance(c.allowance)
        setVaultShares(c.vaultShares)
        setStakedAssets(c.stakedAssets)
        setVaultMaxDepositWei(c.vaultMaxDepositWei)
        setVaultMaxWithdrawWei(c.vaultMaxWithdrawWei)
        setMinWithdrawalFeeWei(c.minWithdrawalFeeWei)
        if (c.sharesChanged) {
          const anchorMs = Date.now()
          observedBalanceRef.current = { balance: c.vaultShares, anchorMs }
          setObservedBalanceAnchorMs(anchorMs)
        }
        setBalancesFetched(true)
      },
    })
    devAssertSingleRefreshOrchestratorOwner("useStakingVaultBalanceRefreshOrchestrator")
    return () => {
      dispose()
    }
  }, [
    isConnected,
    address,
    tokenAddress,
    isEthereumNetwork,
    isWrongNetwork,
    assetResolved,
    chainId,
    expectedChainId,
    transition,
    isTronPassiveRuntime,
    runtimeHydrationEnabled,
  ])
}

export function useStakingVaultBalanceRefreshTronPolling(
  input: StakingVaultBalanceRefreshTronPollingInput
): void {
  const {
    runtimeHydrationEnabled,
    isTronPassiveRuntime,
    tokenAddress,
    runtimeWalletAddress,
    stakingRuntime,
    tronAddressCodec,
    refs,
    setters,
    refetchTronPassiveBalances,
  } = input
  const {
    balanceSnapshotRef,
    lastDisplayBalancesRef,
    tronPassiveFetchGenRef,
    tronPassiveReadFailStreakRef,
  } = refs
  const {
    setWalletBalance,
    setAllowance,
    setVaultShares,
    setStakedAssets,
    setVaultMaxDepositWei,
    setVaultMaxWithdrawWei,
    setMinWithdrawalFeeWei,
    setBalancesFetched,
  } = setters

  useEffect(() => {
    if (!runtimeHydrationEnabled) return
    if (!isTronPassiveRuntime) return
    stopStakingRefreshOrchestrator()
    if (!tokenAddress) {
      setBalancesFetched(true)
      return
    }
    const owner = runtimeWalletAddress?.trim() ?? ""
    if (!owner || !tronAddressCodec.isValid(owner)) {
      const z = {
        walletBalance: 0n,
        allowance: 0n,
        vaultShares: 0n,
        stakedAssets: 0n,
        vaultMaxDepositWei: MaxUint256,
        vaultMaxWithdrawWei: MaxUint256,
        minWithdrawalFeeWei: 0n,
      }
      balanceSnapshotRef.current = z
      lastDisplayBalancesRef.current = z
      setWalletBalance(0n)
      setAllowance(0n)
      setVaultShares(0n)
      setStakedAssets(0n)
      setVaultMaxDepositWei(MaxUint256)
      setVaultMaxWithdrawWei(MaxUint256)
      setMinWithdrawalFeeWei(0n)
      setBalancesFetched(true)
      return
    }
    void refetchTronPassiveBalances()
    const id = window.setInterval(() => {
      void refetchTronPassiveBalances()
    }, 45_000)
    const onVis = () => {
      if (document.visibilityState === "visible") void refetchTronPassiveBalances()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void refetchTronPassiveBalances()
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("pageshow", onPageShow)
      tronPassiveFetchGenRef.current += 1
      tronPassiveReadFailStreakRef.current = 0
    }
  }, [
    runtimeHydrationEnabled,
    isTronPassiveRuntime,
    tokenAddress,
    runtimeWalletAddress,
    refetchTronPassiveBalances,
    stakingRuntime.runtimeKey,
    tronAddressCodec,
  ])
}
