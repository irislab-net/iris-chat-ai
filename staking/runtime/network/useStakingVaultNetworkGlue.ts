import { getExpectedChainId } from "@/staking/config"
import {
  STAKING_APPKIT_NETWORK,
  STAKING_CHAIN_ID,
  STAKING_NETWORK_LABEL,
} from "@/constants/stakingVaultConfig"
import { stakingPassiveWrongNetworkDedupeId } from "@/staking/notifications"
import { stakingToastWarning } from "@/staking/ui"
import type { StakingTokenMetaError } from "@/staking/reads/types"
import {
  STAKING_NETWORK_EVM_SWITCH_VERIFY_MAX_MS,
  STAKING_NETWORK_EVM_SWITCH_VERIFY_POLL_MS,
} from "@/staking/runtime/network/stakingNetworkContracts"
import type { UseStakingVaultNetworkGlueInput } from "@/staking/runtime/network/stakingNetworkDtos"
import { stakingNetworkTopologyMarkReconciliationRegistered } from "@/staking/runtime/network/stakingNetworkTopologyDev"
import type { StakingVaultComposerLifecycleRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import { normalizeStakingVaultChainId } from "@/staking/runtime/stakingVaultChainId"
import { useCallback, useEffect, useRef } from "react"

export type StakingNetworkGlueRefs = Readonly<{
  numericChainIdRef: React.MutableRefObject<number | null>
  wrongNetworkToastShown: React.MutableRefObject<boolean>
  switchVerifyIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  isSwitchingRef: React.MutableRefObject<boolean>
  tokenMetaErrorRef: React.MutableRefObject<StakingTokenMetaError | null>
}>

export function useStakingVaultNetworkRefs(): StakingNetworkGlueRefs {
  const numericChainIdRef = useRef<number | null>(null)
  const wrongNetworkToastShown = useRef(false)
  const switchVerifyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSwitchingRef = useRef(false)
  const tokenMetaErrorRef = useRef<StakingTokenMetaError | null>(null)
  return {
    numericChainIdRef,
    wrongNetworkToastShown,
    switchVerifyIntervalRef,
    isSwitchingRef,
    tokenMetaErrorRef,
  }
}

export type UseStakingVaultNetworkChainMirrorsInput = Readonly<{
  chainId: number | null
  tokenMetaError: StakingTokenMetaError | null
  lifecycleRefs: StakingVaultComposerLifecycleRefs
  networkRefs: StakingNetworkGlueRefs
}>

/**
 * Execution/runtime chain ref mirrors — register before refresh plane.
 */
export function useStakingVaultNetworkChainMirrors(
  input: UseStakingVaultNetworkChainMirrorsInput
): void {
  const { chainId, tokenMetaError, networkRefs } = input
  const { numericChainIdRef, tokenMetaErrorRef } = networkRefs

  useEffect(() => {
    numericChainIdRef.current =
      chainId != null ? normalizeStakingVaultChainId(chainId) : null
  }, [chainId])

  useEffect(() => {
    tokenMetaErrorRef.current = tokenMetaError
  }, [tokenMetaError])
}

export type StakingVaultNetworkGlue = Readonly<{
  requestNetworkSwitch: () => Promise<void>
}>

/**
 * Network switch + EVM chain reconciliation.
 * Must register after balance reset/continuity and before `loadMeta` mount effect.
 */
export function useStakingVaultNetworkGlue(
  input: UseStakingVaultNetworkGlueInput
): StakingVaultNetworkGlue {
  stakingNetworkTopologyMarkReconciliationRegistered()

  const {
    stakingRuntime,
    isTronPassiveRuntime,
    isConnected,
    numericChainId,
    tokenMetaError,
    setTokenMetaError,
    setTokenMetaFetched,
    setBalancesFetched,
    loadMeta,
    refetchTronPassiveBalances,
    switchNetwork,
    walletOrchestration,
    lifecycleRefs,
    networkRefs,
    txState,
  } = input

  const { isMountedRef } = lifecycleRefs
  const {
    numericChainIdRef,
    wrongNetworkToastShown,
    switchVerifyIntervalRef,
    isSwitchingRef,
    tokenMetaErrorRef,
  } = networkRefs
  const {
    hasTriedSwitch,
    setHasTriedSwitch,
    setIsAttemptingNetworkSwitch,
  } = txState

  const toastWrongNetworkOnce = useCallback(() => {
    if (!wrongNetworkToastShown.current) {
      wrongNetworkToastShown.current = true
      const description = isTronPassiveRuntime
        ? `Switch TronLink to ${stakingRuntime.deployment.labels.network} (${stakingRuntime.deployment.caip2}).`
        : `Switch to ${STAKING_NETWORK_LABEL} (chain ${STAKING_CHAIN_ID}).`
      stakingToastWarning("Wrong network", {
        description,
        dedupeId: stakingPassiveWrongNetworkDedupeId(),
      })
    }
  }, [
    isTronPassiveRuntime,
    stakingRuntime.deployment.caip2,
    stakingRuntime.deployment.labels.network,
  ])

  const handleAutoSwitch = useCallback(async () => {
    if (isSwitchingRef.current) return

    isSwitchingRef.current = true
    if (isMountedRef.current) setIsAttemptingNetworkSwitch(true)

    try {
      const prevId = switchVerifyIntervalRef.current
      if (prevId != null) {
        clearInterval(prevId)
        switchVerifyIntervalRef.current = null
      }
      await switchNetwork(STAKING_APPKIT_NETWORK)

      if (!isMountedRef.current) return

      if (numericChainIdRef.current === getExpectedChainId()) {
        return
      }

      const start = Date.now()
      switchVerifyIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          const id = switchVerifyIntervalRef.current
          if (id != null) {
            clearInterval(id)
            switchVerifyIntervalRef.current = null
          }
          return
        }

        const current = numericChainIdRef.current
        if (current === getExpectedChainId()) {
          const id = switchVerifyIntervalRef.current
          if (id != null) {
            clearInterval(id)
            switchVerifyIntervalRef.current = null
          }
          return
        }
        if (Date.now() - start > STAKING_NETWORK_EVM_SWITCH_VERIFY_MAX_MS) {
          const id = switchVerifyIntervalRef.current
          if (id != null) {
            clearInterval(id)
            switchVerifyIntervalRef.current = null
          }
          if (!isMountedRef.current) return
          if (numericChainIdRef.current === getExpectedChainId()) return
          if (tokenMetaErrorRef.current === "WRONG_NETWORK") return
          setTokenMetaError("WRONG_NETWORK")
          toastWrongNetworkOnce()
        }
      }, STAKING_NETWORK_EVM_SWITCH_VERIFY_POLL_MS)
    } catch {
      if (!isMountedRef.current) return
      setTokenMetaError("WRONG_NETWORK")
      toastWrongNetworkOnce()
    } finally {
      isSwitchingRef.current = false
      if (isMountedRef.current) setIsAttemptingNetworkSwitch(false)
    }
  }, [switchNetwork, toastWrongNetworkOnce])

  const requestNetworkSwitch = useCallback(async (): Promise<void> => {
    if (isSwitchingRef.current) return
    setHasTriedSwitch(true)
    isSwitchingRef.current = true
    setIsAttemptingNetworkSwitch(true)
    try {
      const switched = await walletOrchestration.requestNetworkSwitch(
        stakingRuntime.deployment.caip2
      )
      if (isTronPassiveRuntime) {
        if (switched) {
          setTokenMetaFetched(false)
          setBalancesFetched(false)
          void refetchTronPassiveBalances()
        }
        return
      }
      if (!switched) {
        await handleAutoSwitch()
      }
    } finally {
      isSwitchingRef.current = false
      if (isMountedRef.current) setIsAttemptingNetworkSwitch(false)
    }
  }, [
    walletOrchestration,
    isTronPassiveRuntime,
    stakingRuntime.deployment.caip2,
    handleAutoSwitch,
    refetchTronPassiveBalances,
  ])

  useEffect(() => {
    return () => {
      if (switchVerifyIntervalRef.current) {
        clearInterval(switchVerifyIntervalRef.current)
      }
    }
  }, [])

  // Chain/orchestration before the `void loadMeta()` effect below so correct-chain handling runs first.
  // EVM-only: wallet AppKit chain reconciliation + auto-switch. Non-EVM runtimes (e.g. Tron) never run this path.
  useEffect(() => {
    if (stakingRuntime.deployment.chainFamily !== "evm") {
      const pollId = switchVerifyIntervalRef.current
      if (pollId != null) {
        clearInterval(pollId)
        switchVerifyIntervalRef.current = null
      }
      setHasTriedSwitch(false)
      wrongNetworkToastShown.current = false
      if (isMountedRef.current) setIsAttemptingNetworkSwitch(false)
      return
    }
    if (!isConnected) {
      setHasTriedSwitch(false)
      return
    }
    if (numericChainId === null) return
    if (numericChainId === getExpectedChainId()) {
      const pollId = switchVerifyIntervalRef.current
      if (pollId != null) {
        clearInterval(pollId)
        switchVerifyIntervalRef.current = null
      }

      setHasTriedSwitch(false)
      wrongNetworkToastShown.current = false

      if (tokenMetaError === "WRONG_NETWORK") {
        setTokenMetaError(null)
        void loadMeta()
      }
      return
    }
    if (
      numericChainId !== getExpectedChainId() &&
      !hasTriedSwitch &&
      tokenMetaError !== "WRONG_NETWORK"
    ) {
      setHasTriedSwitch(true)
      void handleAutoSwitch()
    }
  }, [
    isConnected,
    numericChainId,
    hasTriedSwitch,
    tokenMetaError,
    loadMeta,
    handleAutoSwitch,
    stakingRuntime.deployment.chainFamily,
  ])

  return { requestNetworkSwitch }
}
