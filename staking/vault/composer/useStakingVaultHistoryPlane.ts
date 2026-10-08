import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { AddressCodec } from "@/staking/core/address"
import {
  useStakingVaultHistoryCore,
  useStakingVaultHistoryEffects,
} from "@/staking/history"
import type { StakingVaultHistoryCore } from "@/staking/history/stakingHistoryTypes"
import {
  selectMerchantTokenName,
  selectMerchantTokenSymbol,
} from "@/staking/selectors"
import type { StakingVaultComposerHistoryGlueRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
import type { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import type { StakingVaultTokenReads } from "@/staking/reads/useStakingVaultTokenReads"
import { devAssertHistoryRuntimeFamilyMatch } from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { useEffect, useMemo, useRef } from "react"

export type UseStakingVaultHistoryPlaneInput = Readonly<{
  runtimeCtx: Readonly<{
    stakingRuntime: RuntimeOperationContext
    isTronPassiveRuntime: boolean
    tronAddressCodec: AddressCodec
  }>
  planes: ReturnType<typeof useStakingVaultRuntimePlanes>
  tokenReads: Pick<
    StakingVaultTokenReads,
    "tokenAddress" | "tokenDecimals" | "tokenSymbol" | "tokenName" | "setTokenMetaFetched"
  >
  balance: Pick<StakingVaultComposerBalanceState, "setBalancesFetched">
  historyGlueRefs: StakingVaultComposerHistoryGlueRefs
  isWrongNetwork: boolean
  vaultDataReady: boolean
  refetchTronPassiveBalances: () => Promise<void>
}>

export type StakingVaultHistoryPlane = Readonly<{
  history: StakingVaultHistoryCore
  stakingHistoryRows: StakingVaultHistoryCore["stakingHistoryRows"]
  stakingHistoryTotals: StakingVaultHistoryCore["stakingHistoryTotals"]
  stakingHistoryLoading: StakingVaultHistoryCore["stakingHistoryLoading"]
  stakingHistoryFetched: StakingVaultHistoryCore["stakingHistoryFetched"]
  stakingHistoryIndexerError: StakingVaultHistoryCore["stakingHistoryIndexerError"]
  stakingHistoryIndexerPartialWarning: StakingVaultHistoryCore["stakingHistoryIndexerPartialWarning"]
  stakingPnlHistoryIncomplete: StakingVaultHistoryCore["stakingPnlHistoryIncomplete"]
  stakingPnlHistoryReady: StakingVaultHistoryCore["stakingPnlHistoryReady"]
  refreshStakingHistory: StakingVaultHistoryCore["refreshStakingHistory"]
  merchantTokenSymbol: string
  merchantTokenName: string
}>

/**
 * History plane — core → Tron rehydrate glue → effects (fixed order).
 */
export function useStakingVaultHistoryPlane(
  input: UseStakingVaultHistoryPlaneInput
): StakingVaultHistoryPlane {
  const {
    runtimeCtx,
    planes,
    tokenReads,
    balance,
    historyGlueRefs,
    isWrongNetwork,
    vaultDataReady,
    refetchTronPassiveBalances,
  } = input

  const { stakingRuntime, isTronPassiveRuntime, tronAddressCodec } = runtimeCtx
  const {
    appKitTronIdentityEnabled,
    stakingOwnerAddress,
    executionAddress,
    isEthereumNetwork,
    runtimeWallet,
    runtimeWalletAddress,
    passiveTronChainId,
  } = planes
  const { tokenAddress, tokenDecimals, tokenSymbol, tokenName, setTokenMetaFetched } = tokenReads
  const { clearStakingHistoryOnWrongNetworkRef } = historyGlueRefs

  const history = useStakingVaultHistoryCore({
    stakingRuntime,
    stakingOwnerAddress,
    address: executionAddress,
    tokenAddress,
    tokenDecimals,
    tokenSymbol,
    tokenName,
    isTronPassiveRuntime,
    isEthereumNetwork,
    isWrongNetwork,
    tronAddressCodec,
    registerClearOnWrongNetwork: fn => {
      clearStakingHistoryOnWrongNetworkRef.current = fn
    },
  })

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    devAssertHistoryRuntimeFamilyMatch({
      historyDeploymentId: stakingRuntime.deployment.id,
      activeDeploymentId: stakingRuntime.deployment.id,
      activeChainFamily: stakingRuntime.deployment.chainFamily,
      context: "useStakingVaultHistoryPlane",
    })
  }, [
    stakingRuntime.deployment.id,
    stakingRuntime.deployment.chainFamily,
  ])

  const merchantTokenSymbol = useMemo(
    () => selectMerchantTokenSymbol(tokenSymbol),
    [tokenSymbol]
  )
  const merchantTokenName = useMemo(
    () => selectMerchantTokenName(tokenName),
    [tokenName]
  )

  const prevTronNetworkRehydrateKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isTronPassiveRuntime) {
      prevTronNetworkRehydrateKeyRef.current = null
      return
    }
    const rehydrateChainId =
      appKitTronIdentityEnabled && runtimeWallet.tronChainId != null
        ? runtimeWallet.tronChainId
        : passiveTronChainId
    const rehydrateNetworkOk = runtimeWallet.networkOk
    const rehydrateAddress = runtimeWalletAddress?.trim() ?? ""
    const key = `${rehydrateChainId ?? ""}|${rehydrateNetworkOk ? "1" : "0"}|${rehydrateAddress}`
    const prev = prevTronNetworkRehydrateKeyRef.current
    prevTronNetworkRehydrateKeyRef.current = key
    if (prev === null || prev === key) return

    setTokenMetaFetched(false)
    balance.setBalancesFetched(false)
    void refetchTronPassiveBalances()
    if (rehydrateNetworkOk && rehydrateAddress) {
      void history.refreshStakingHistoryRef.current({
        shallow: true,
        skipIfInFlight: true,
      })
    }
  }, [
    isTronPassiveRuntime,
    appKitTronIdentityEnabled,
    runtimeWallet.tronChainId,
    runtimeWallet.networkOk,
    runtimeWalletAddress,
    passiveTronChainId,
    refetchTronPassiveBalances,
  ])

  useStakingVaultHistoryEffects({
    ...history,
    stakingRuntime,
    vaultDataReady,
    stakingOwnerAddress,
    address: executionAddress,
    tokenAddress,
    isTronPassiveRuntime,
    isEthereumNetwork,
    isWrongNetwork,
    tronAddressCodec,
  })

  return {
    history,
    stakingHistoryRows: history.stakingHistoryRows,
    stakingHistoryTotals: history.stakingHistoryTotals,
    stakingHistoryLoading: history.stakingHistoryLoading,
    stakingHistoryFetched: history.stakingHistoryFetched,
    stakingHistoryIndexerError: history.stakingHistoryIndexerError,
    stakingHistoryIndexerPartialWarning: history.stakingHistoryIndexerPartialWarning,
    stakingPnlHistoryIncomplete: history.stakingPnlHistoryIncomplete,
    stakingPnlHistoryReady: history.stakingPnlHistoryReady,
    refreshStakingHistory: history.refreshStakingHistory,
    merchantTokenSymbol,
    merchantTokenName,
  }
}
