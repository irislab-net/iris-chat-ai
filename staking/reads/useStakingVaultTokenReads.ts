import { getExpectedChainId, STAKING_TRON_TOKEN_ADDRESS } from "@/staking/config"
import {
  stakingPassiveMinIntervalElapsed,
  stakingPassiveRpcMetaDedupeId,
  STAKING_PASSIVE_RPC_META_MIN_INTERVAL_MS,
} from "@/staking/notifications"
import { stakingToastError } from "@/staking/ui"
import type { StakingContractReadOptions } from "@/staking/execution"
import { canRuntimeOperationCommitWithDevTrace } from "@/staking/orchestration"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { AddressCodec } from "@/staking/core/address"
import { loadEvmPoolAsset, loadEvmTokenMeta, loadTronTokenMeta } from "@/staking/reads"
import type { StakingTokenMetaError } from "@/staking/reads/types"
import { stakingNetworkTopologyMarkLoadMetaRegistered } from "@/staking/runtime/network/stakingNetworkTopologyDev"
import { normalizeStakingVaultChainId } from "@/staking/runtime/stakingVaultChainId"
import type { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import { getAddress, isAddress, type JsonRpcProvider } from "ethers"
import { useCallback, useEffect, useRef, useState } from "react"

export type UseStakingVaultTokenReadsInput = Readonly<{
  isMountedRef: React.MutableRefObject<boolean>
  transition: ReturnType<typeof useRuntimeTransitionSnapshot>
  stakingRuntime: RuntimeOperationContext
  stakingReadOptions: StakingContractReadOptions
  stakingReadJsonRpc: JsonRpcProvider | null
  tronAddressCodec: AddressCodec
  isTronPassiveRuntime: boolean
  isEthereumNetwork: boolean
  chainId: number | null
  expectedChainId: number
  runtimeWalletAddress: string | null
}>

export type StakingVaultTokenReads = Readonly<{
  tokenAddress: string | null
  setTokenAddress: React.Dispatch<React.SetStateAction<string | null>>
  tokenDecimals: number | null
  setTokenDecimals: React.Dispatch<React.SetStateAction<number | null>>
  tokenSymbol: string
  setTokenSymbol: React.Dispatch<React.SetStateAction<string>>
  tokenName: string
  setTokenName: React.Dispatch<React.SetStateAction<string>>
  tokenMetaError: StakingTokenMetaError | null
  setTokenMetaError: React.Dispatch<React.SetStateAction<StakingTokenMetaError | null>>
  assetResolved: boolean
  setAssetResolved: React.Dispatch<React.SetStateAction<boolean>>
  tokenMetaFetched: boolean
  setTokenMetaFetched: React.Dispatch<React.SetStateAction<boolean>>
  loadMeta: () => Promise<void>
}>

export function useStakingVaultTokenReads(
  input: UseStakingVaultTokenReadsInput
): StakingVaultTokenReads {
  const {
    isMountedRef,
    transition,
    stakingRuntime,
    stakingReadOptions,
    stakingReadJsonRpc,
    tronAddressCodec,
    isEthereumNetwork,
    chainId,
    runtimeWalletAddress,
  } = input

  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [tokenMetaError, setTokenMetaError] = useState<StakingTokenMetaError | null>(null)

  const [assetResolved, setAssetResolved] = useState(false)
  const [tokenMetaFetched, setTokenMetaFetched] = useState(false)

  /** Latest `loadMeta` invocation; stale async completions must not clobber state. */
  const loadMetaRunIdRef = useRef(0)
  /** Last passive RPC-meta error toast (ms); null = none — cooldown for reconnect storms. */
  const lastRpcMetaErrToastAtRef = useRef<number | null>(null)

  const loadMeta = useCallback(async () => {
    const coordinatorAtStart = transition.coordinatorSnapshot
    const latestCoordinatorSnapshotRefLocal = transition.latestCoordinatorSnapshotRef
    const runId = ++loadMetaRunIdRef.current
    const stillCurrent = () =>
      runId === loadMetaRunIdRef.current && isMountedRef.current

    if (stakingRuntime.deployment.chainFamily === "tron") {
      try {
        const tokenRaw = STAKING_TRON_TOKEN_ADDRESS?.trim() ?? ""
        const caller =
          runtimeWalletAddress?.trim() &&
          tronAddressCodec.isValid(runtimeWalletAddress.trim())
            ? runtimeWalletAddress.trim()
            : stakingRuntime.deployment.vault.address.trim()
        if (!tokenRaw || !tronAddressCodec.isValid(tokenRaw)) {
          if (!stillCurrent()) return
          setTokenDecimals(null)
          setTokenSymbol("")
          setTokenName("")
          setTokenMetaError("RPC_ERROR")
          const now = Date.now()
          if (
            stakingPassiveMinIntervalElapsed(
              now,
              lastRpcMetaErrToastAtRef.current,
              STAKING_PASSIVE_RPC_META_MIN_INTERVAL_MS
            )
          ) {
            lastRpcMetaErrToastAtRef.current = now
            stakingToastError("Token data unavailable", {
              description: "Check your connection, then retry.",
              dedupeId: stakingPassiveRpcMetaDedupeId(),
            })
          }
          return
        }
        const meta = await loadTronTokenMeta({
          deployment: stakingRuntime.deployment,
          tokenContractBase58: tokenRaw,
          callerBase58: caller,
        })
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useStakingVault:loadMeta_tron_after_reads",
            coordinatorAtStart,
            latestCoordinatorSnapshotRefLocal.current
          )
        )
          return
        if (!stillCurrent()) return
        setTokenDecimals(meta.decimals)
        setTokenMetaError(null)
        setTokenSymbol(meta.symbol)
        setTokenName(meta.name)
        lastRpcMetaErrToastAtRef.current = null
      } catch {
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useStakingVault:loadMeta_tron_catch",
            coordinatorAtStart,
            latestCoordinatorSnapshotRefLocal.current
          )
        )
          return
        if (!stillCurrent()) return
        setTokenDecimals(null)
        setTokenSymbol("")
        setTokenName("")
        setTokenMetaError("RPC_ERROR")
        const nowCatch = Date.now()
        if (
          stakingPassiveMinIntervalElapsed(
            nowCatch,
            lastRpcMetaErrToastAtRef.current,
            STAKING_PASSIVE_RPC_META_MIN_INTERVAL_MS
          )
        ) {
          lastRpcMetaErrToastAtRef.current = nowCatch
          stakingToastError("Token data unavailable", {
            description: "Check your connection, then retry.",
            dedupeId: stakingPassiveRpcMetaDedupeId(),
          })
        }
      } finally {
        if (
          stillCurrent() &&
          canRuntimeOperationCommitWithDevTrace(
            "useStakingVault:loadMeta_tron_finally",
            coordinatorAtStart,
            latestCoordinatorSnapshotRefLocal.current
          )
        ) {
          setTokenMetaFetched(true)
        }
      }
      return
    }

    const exp = getExpectedChainId()
    const cid = normalizeStakingVaultChainId(chainId)

    if (cid !== null && cid !== exp && isEthereumNetwork) {
      if (!stillCurrent()) return
      setTokenDecimals(null)
      setTokenSymbol("")
      setTokenName("")
      setTokenMetaError("WRONG_NETWORK")
      setTokenMetaFetched(true)
      return
    }

    if (!tokenAddress || !isEthereumNetwork || cid !== exp) {
      return
    }

    try {
      const read = stakingReadJsonRpc
      if (!read) return
      const meta = await loadEvmTokenMeta({
        tokenAddress,
        read,
        stakingReadOptions,
      })
      if (
        !canRuntimeOperationCommitWithDevTrace(
          "useStakingVault:loadMeta_after_reads",
          coordinatorAtStart,
          latestCoordinatorSnapshotRefLocal.current
        )
      )
        return
      if (!stillCurrent()) return
      setTokenDecimals(meta.decimals)
      setTokenMetaError(null)
      setTokenSymbol(meta.symbol)
      setTokenName(meta.name)
      lastRpcMetaErrToastAtRef.current = null
    } catch {
      if (
        !canRuntimeOperationCommitWithDevTrace(
          "useStakingVault:loadMeta_catch",
          coordinatorAtStart,
          latestCoordinatorSnapshotRefLocal.current
        )
      )
        return
      if (!stillCurrent()) return
      setTokenDecimals(null)
      setTokenSymbol("")
      setTokenName("")
      setTokenMetaError("RPC_ERROR")
      const nowEvmCatch = Date.now()
      if (
        stakingPassiveMinIntervalElapsed(
          nowEvmCatch,
          lastRpcMetaErrToastAtRef.current,
          STAKING_PASSIVE_RPC_META_MIN_INTERVAL_MS
        )
      ) {
        lastRpcMetaErrToastAtRef.current = nowEvmCatch
        stakingToastError("Token data unavailable", {
          description: "Check your connection, then retry.",
          dedupeId: stakingPassiveRpcMetaDedupeId(),
        })
      }
    } finally {
      if (
        stillCurrent() &&
        canRuntimeOperationCommitWithDevTrace(
          "useStakingVault:loadMeta_finally",
          coordinatorAtStart,
          latestCoordinatorSnapshotRefLocal.current
        )
      ) {
        setTokenMetaFetched(true)
      }
    }
  }, [
    chainId,
    tokenAddress,
    isEthereumNetwork,
    transition,
    stakingReadJsonRpc,
    stakingReadOptions,
    stakingRuntime.deployment,
    runtimeWalletAddress,
    tronAddressCodec,
    isMountedRef,
  ])

  return {
    tokenAddress,
    setTokenAddress,
    tokenDecimals,
    setTokenDecimals,
    tokenSymbol,
    setTokenSymbol,
    tokenName,
    setTokenName,
    tokenMetaError,
    setTokenMetaError,
    assetResolved,
    setAssetResolved,
    tokenMetaFetched,
    setTokenMetaFetched,
    loadMeta,
  }
}

export type UseStakingVaultTokenReadsAssetLifecycleInput = UseStakingVaultTokenReadsInput &
  Readonly<{
    setTokenAddress: React.Dispatch<React.SetStateAction<string | null>>
    setAssetResolved: React.Dispatch<React.SetStateAction<boolean>>
  }>

/**
 * Asset-resolution effects — register from composer **after** `tokenMetaErrorRef` sync and
 * `refreshBalances` (same slot as pre-D3b2 `loadAsset` effect).
 */
export function useStakingVaultTokenReadsAssetLifecycle(
  input: UseStakingVaultTokenReadsAssetLifecycleInput
): void {
  const {
    transition,
    stakingRuntime,
    stakingReadOptions,
    stakingReadJsonRpc,
    tronAddressCodec,
    isTronPassiveRuntime,
    isEthereumNetwork,
    chainId,
    expectedChainId,
    setTokenAddress,
    setAssetResolved,
  } = input

  useEffect(() => {
    if (isTronPassiveRuntime) return
    setAssetResolved(false)
  }, [chainId, isEthereumNetwork, isTronPassiveRuntime, setAssetResolved])

  useEffect(() => {
    let cancelled = false
    const coordinatorAtStart = transition.coordinatorSnapshot
    const latestCoordinatorSnapshotRefLocal = transition.latestCoordinatorSnapshotRef
    async function loadAsset() {
      if (stakingRuntime.deployment.chainFamily === "tron") {
        const raw = STAKING_TRON_TOKEN_ADDRESS?.trim() ?? ""
        if (!cancelled) {
          if (raw && tronAddressCodec.isValid(raw)) {
            setTokenAddress(raw)
          } else {
            setTokenAddress(null)
          }
        }
        if (!cancelled) setAssetResolved(true)
        return
      }
      if (
        !isEthereumNetwork ||
        normalizeStakingVaultChainId(chainId) !== expectedChainId
      ) {
        if (!cancelled) setAssetResolved(true)
        return
      }
      try {
        const read = stakingReadJsonRpc
        if (!read) {
          if (!cancelled) setAssetResolved(true)
          return
        }
        const asset = await loadEvmPoolAsset({
          read,
          stakingReadOptions,
        })
        if (
          !cancelled &&
          canRuntimeOperationCommitWithDevTrace(
            "useStakingVault:loadAsset",
            coordinatorAtStart,
            latestCoordinatorSnapshotRefLocal.current
          ) &&
          isAddress(asset)
        )
          setTokenAddress(getAddress(asset))
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setAssetResolved(true)
      }
    }
    void loadAsset()
    return () => {
      cancelled = true
    }
  }, [
    isTronPassiveRuntime,
    isEthereumNetwork,
    chainId,
    expectedChainId,
    transition,
    stakingReadJsonRpc,
    stakingReadOptions,
    stakingRuntime.deployment.chainFamily,
    stakingRuntime.deployment.id,
    tronAddressCodec,
    setTokenAddress,
    setAssetResolved,
  ])
}

/**
 * Registers `void loadMeta()` after vault chain-reconciliation effect (ordering contract).
 * Call from composer **after** EVM chain reconciliation `useEffect`, not inside `useStakingVaultTokenReads`.
 */
export function useStakingVaultTokenReadsMountLoadMeta(loadMeta: () => Promise<void>): void {
  stakingNetworkTopologyMarkLoadMetaRegistered()
  useEffect(() => {
    void loadMeta()
  }, [loadMeta])
}
