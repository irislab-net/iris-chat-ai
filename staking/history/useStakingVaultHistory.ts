import { loadTronStakingTransactionHistoryRows } from "@/staking/history/tron/tronTransactionHistory"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import {
  loadStakingTransactionHistoryRows,
  logStakingHistoryConsoleError,
  stakingTransactionHistoryCache,
} from "@/staking/execution/stakingEtherscanHistory"
import {
  aggregateStakingHistoryRows,
  mergeStakingHistoryByHash,
} from "@/staking/history/stakingHistoryMerge"
import {
  buildStakingHistoryKey,
  normalizeHistoryLatestScannedBlock,
} from "@/staking/history/stakingHistoryKeys"
import type {
  StakingHistoryRow,
  StakingVaultHistoryCore,
  StakingVaultHistoryRefBag,
  UseStakingVaultHistoryCoreInput,
  UseStakingVaultHistoryEffectsInput,
} from "@/staking/history/stakingHistoryTypes"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import {
  EMPTY_STAKING_HISTORY_TOTALS,
} from "@/staking/history/stakingHistoryTypes"
import {
  selectMerchantTokenSymbol,
  selectMerchantTokenSymbolForTxHistory,
  selectTokenLabel,
} from "@/staking/selectors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type {
  StakingHistoryRefreshOptions,
  StakingHistoryRow,
  StakingHistoryTotals,
  StakingVaultHistoryCore,
  StakingVaultHistoryRefBag,
  UseStakingVaultHistoryCoreInput,
  UseStakingVaultHistoryEffectsInput,
} from "@/staking/history/stakingHistoryTypes"
export {
  buildStakingHistoryKey,
  chainSegmentForStakingHistoryCache,
  normalizeHistoryLatestScannedBlock,
} from "@/staking/history/stakingHistoryKeys"
export {
  aggregateStakingHistoryRows,
  mergeStakingHistoryByHash,
} from "@/staking/history/stakingHistoryMerge"

function useStakingVaultHistoryRefBag(): StakingVaultHistoryRefBag {
  const stakingHistoryAbortRef = useRef<AbortController | null>(null)
  const stakingHistoryFetchGenRef = useRef(0)
  const stakingHistoryInFlightRef = useRef(false)
  const historyLoadWallStartedMsRef = useRef<number | null>(null)
  return useMemo(
    () => ({
      stakingHistoryAbortRef,
      stakingHistoryFetchGenRef,
      stakingHistoryInFlightRef,
      historyLoadWallStartedMsRef,
    }),
    []
  )
}

export function useStakingVaultHistoryCore(
  input: UseStakingVaultHistoryCoreInput
): StakingVaultHistoryCore {
  const {
    stakingRuntime,
    stakingOwnerAddress,
    address,
    tokenAddress,
    tokenDecimals,
    tokenSymbol,
    tokenName,
    isTronPassiveRuntime,
    isEthereumNetwork,
    isWrongNetwork,
    tronAddressCodec,
    registerClearOnWrongNetwork,
  } = input

  const refs = useStakingVaultHistoryRefBag()
  const {
    stakingHistoryAbortRef,
    stakingHistoryFetchGenRef,
    stakingHistoryInFlightRef,
    historyLoadWallStartedMsRef,
  } = refs

  const [stakingHistoryRows, setStakingHistoryRows] = useState<StakingHistoryRow[]>([])
  const [stakingHistoryTotals, setStakingHistoryTotals] = useState(
    EMPTY_STAKING_HISTORY_TOTALS
  )
  const [stakingHistoryLoading, setStakingHistoryLoading] = useState(false)
  const [stakingHistoryFetched, setStakingHistoryFetched] = useState(false)
  const [stakingHistoryIndexerError, setStakingHistoryIndexerError] = useState<
    string | null
  >(null)
  const [stakingHistoryIndexerPartialWarning, setStakingHistoryIndexerPartialWarning] =
    useState<string | null>(null)
  const [stakingPnlHistoryIncomplete, setStakingPnlHistoryIncomplete] = useState(false)
  const [stakingPnlHistoryReady, setStakingPnlHistoryReady] = useState(false)

  const clearOnWrongNetwork = useCallback(() => {
    setStakingHistoryIndexerError(null)
    setStakingHistoryIndexerPartialWarning(null)
    stakingHistoryAbortRef.current?.abort()
  }, [])

  registerClearOnWrongNetwork?.(clearOnWrongNetwork)

  const stakingHistoryKey = useMemo(
    () =>
      buildStakingHistoryKey({
        stakingOwnerAddress,
        tokenAddress,
        deployment: stakingRuntime.deployment,
      }),
    [stakingOwnerAddress, tokenAddress, stakingRuntime.deployment]
  )

  const tokenLabel = selectTokenLabel(tokenSymbol, tokenName)

  const merchantTokenSymbol = useMemo(
    () => selectMerchantTokenSymbol(tokenSymbol),
    [tokenSymbol]
  )
  const merchantTokenSymbolForTxHistory = useMemo(
    () =>
      selectMerchantTokenSymbolForTxHistory({
        merchantTokenSymbol,
        tokenSymbol,
      }),
    [merchantTokenSymbol, tokenSymbol]
  )

  const refreshStakingHistory = useCallback(
    async (opts?: { shallow?: boolean; skipIfInFlight?: boolean }) => {
      if (!isStakingVaultRuntimeHydrationEnabled(stakingRuntime.deployment)) {
        return []
      }
      if (!stakingOwnerAddress || !stakingHistoryKey || !tokenAddress) {
        return []
      }

      if (!isTronPassiveRuntime) {
        if (!isEthereumNetwork || isWrongNetwork) {
          return []
        }
        if (!address?.trim()) {
          return []
        }
      } else {
        const w = stakingOwnerAddress.trim()
        const tok = tokenAddress.trim()
        if (!tronAddressCodec.isValid(w) || !tronAddressCodec.isValid(tok)) {
          return []
        }
      }

      if (opts?.skipIfInFlight && stakingHistoryInFlightRef.current) {
        return []
      }

      const shallow = Boolean(opts?.shallow)
      const runId = ++stakingHistoryFetchGenRef.current
      stakingHistoryAbortRef.current?.abort()
      const ac = new AbortController()
      stakingHistoryAbortRef.current = ac

      setStakingHistoryLoading(true)
      stakingHistoryInFlightRef.current = true
      historyLoadWallStartedMsRef.current = Date.now()

      try {
        if (tokenDecimals === null) {
          if (runId === stakingHistoryFetchGenRef.current) {
            setStakingHistoryIndexerError(null)
            setStakingHistoryIndexerPartialWarning(null)
          }
          return []
        }

        const prevEntry = stakingTransactionHistoryCache.get(stakingHistoryKey)
        const cachedRows = prevEntry?.rows ?? []
        const cachedLatestScannedBlock = normalizeHistoryLatestScannedBlock(
          prevEntry?.latestScannedBlock
        )

        const result = isTronPassiveRuntime
          ? await loadTronStakingTransactionHistoryRows({
              deployment: stakingRuntime.deployment,
              walletBase58: stakingOwnerAddress.trim(),
              tokenContractBase58: tokenAddress.trim(),
              vaultBase58: stakingRuntime.deployment.vault.address.trim(),
              tokenDecimals,
              tokenLabel,
              merchantTokenSymbol: merchantTokenSymbolForTxHistory,
              deploymentId: stakingRuntime.deployment.id.trim(),
              signal: ac.signal,
              shallow,
            })
          : await loadStakingTransactionHistoryRows({
              address: address!.trim(),
              tokenAddress,
              tokenDecimals,
              tokenLabel,
              merchantTokenSymbol: merchantTokenSymbolForTxHistory,
              deploymentId: stakingRuntime.deployment.id.trim(),
              historyVaultAddress: stakingRuntime.deployment.vault.address.trim(),
              signal: ac.signal,
              shallow,
              cachedLatestScannedBlock,
            })

        if (runId !== stakingHistoryFetchGenRef.current) {
          return []
        }

        const merged = mergeStakingHistoryByHash(cachedRows, result.rows)
        let latestScanned: number | null = result.latestScannedToBlock
        if (latestScanned === null) {
          latestScanned = normalizeHistoryLatestScannedBlock(prevEntry?.latestScannedBlock)
        }
        stakingTransactionHistoryCache.set(stakingHistoryKey, {
          rows: merged,
          latestScannedBlock: latestScanned,
        })

        setStakingHistoryRows(merged)
        setStakingHistoryTotals(aggregateStakingHistoryRows(merged))
        setStakingHistoryIndexerError(result.indexerError)
        setStakingHistoryIndexerPartialWarning(result.indexerPartialWarning)
        setStakingPnlHistoryIncomplete(prev =>
          result.pnlHistoryIncomplete ? true : shallow ? prev : false
        )
        return merged
      } catch (e) {
        if (runId !== stakingHistoryFetchGenRef.current) {
          return []
        }
        const aborted = e instanceof Error && e.name === "AbortError"
        if (!aborted) {
          const msg = e instanceof Error ? e.message : "Could not load transaction history"
          logStakingHistoryConsoleError("useStakingVault.refreshStakingHistory", msg, e)
          setStakingHistoryIndexerError(msg)
          setStakingHistoryIndexerPartialWarning(null)
        }
        return []
      } finally {
        if (runId === stakingHistoryFetchGenRef.current) {
          stakingHistoryInFlightRef.current = false
          historyLoadWallStartedMsRef.current = null
          setStakingHistoryLoading(false)
          setStakingHistoryFetched(true)
          if (!shallow && tokenDecimals !== null) {
            setStakingPnlHistoryReady(true)
          }
        }
      }
    },
    [
      stakingOwnerAddress,
      isEthereumNetwork,
      isWrongNetwork,
      isTronPassiveRuntime,
      tronAddressCodec,
      stakingHistoryKey,
      tokenAddress,
      tokenDecimals,
      tokenLabel,
      merchantTokenSymbolForTxHistory,
      stakingRuntime.deployment,
      address,
    ]
  )

  const refreshStakingHistoryRef = useRef(refreshStakingHistory)
  refreshStakingHistoryRef.current = refreshStakingHistory

  return {
    refs,
    stakingHistoryKey,
    stakingHistoryRows,
    stakingHistoryTotals,
    stakingHistoryLoading,
    stakingHistoryFetched,
    stakingHistoryIndexerError,
    stakingHistoryIndexerPartialWarning,
    stakingPnlHistoryIncomplete,
    stakingPnlHistoryReady,
    setStakingPnlHistoryIncomplete,
    setStakingPnlHistoryReady,
    setStakingHistoryRows,
    setStakingHistoryTotals,
    setStakingHistoryLoading,
    setStakingHistoryFetched,
    setStakingHistoryIndexerError,
    setStakingHistoryIndexerPartialWarning,
    refreshStakingHistory,
    refreshStakingHistoryRef,
  }
}

export function useStakingVaultHistoryStallWatchdog(
  input: Pick<
    UseStakingVaultHistoryEffectsInput,
    | "stakingHistoryLoading"
    | "stakingRuntime"
    | "refreshStakingHistoryRef"
    | "refs"
  > & {
    setStakingHistoryLoading: React.Dispatch<React.SetStateAction<boolean>>
  }
): void {
  const {
    stakingHistoryLoading,
    stakingRuntime,
    refreshStakingHistoryRef,
    refs,
    setStakingHistoryLoading,
  } = input
  const {
    stakingHistoryAbortRef,
    stakingHistoryFetchGenRef,
    stakingHistoryInFlightRef,
    historyLoadWallStartedMsRef,
  } = refs

  useEffect(() => {
    if (!stakingHistoryLoading) return
    const TICK_MS = 15_000
    const STALL_MS = 90_000
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      const started = historyLoadWallStartedMsRef.current
      if (started == null || Date.now() - started < STALL_MS) return

      historyLoadWallStartedMsRef.current = null
      stakingHistoryFetchGenRef.current += 1
      stakingHistoryAbortRef.current?.abort()
      stakingHistoryInFlightRef.current = false
      setStakingHistoryLoading(false)

      if (isRuntimeTelemetryEmitEnabled()) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent(
            "staking_history_refresh_starvation",
            "warning",
            {
              runtimeKey: stakingRuntime.runtimeKey,
              deploymentId: stakingRuntime.deployment.id.trim(),
              chainFamily: stakingRuntime.deployment.chainFamily,
              reasonToken: "history_load_wall_stall_90s",
            }
          )
        )
      }

      void refreshStakingHistoryRef.current({
        shallow: false,
        skipIfInFlight: false,
      })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [
    stakingHistoryLoading,
    stakingRuntime.runtimeKey,
    stakingRuntime.deployment.id,
    stakingRuntime.deployment.chainFamily,
  ])
}

export function useStakingVaultHistoryInvalidateOnKeyChange(
  input: Pick<
    UseStakingVaultHistoryEffectsInput,
    "stakingOwnerAddress" | "stakingHistoryKey" | "refs"
  >
): void {
  const { stakingOwnerAddress, stakingHistoryKey, refs } = input
  const {
    stakingHistoryAbortRef,
    stakingHistoryFetchGenRef,
    stakingHistoryInFlightRef,
    historyLoadWallStartedMsRef,
  } = refs

  useEffect(() => {
    stakingHistoryFetchGenRef.current += 1
    stakingHistoryInFlightRef.current = false
    historyLoadWallStartedMsRef.current = null
    stakingHistoryAbortRef.current?.abort()
    stakingHistoryAbortRef.current = null
  }, [stakingOwnerAddress, stakingHistoryKey])
}

export function useStakingVaultHistoryCacheHydrate(
  input: Pick<
    UseStakingVaultHistoryEffectsInput,
    | "stakingOwnerAddress"
    | "stakingHistoryKey"
    | "setStakingHistoryRows"
    | "setStakingHistoryTotals"
    | "setStakingHistoryFetched"
    | "setStakingHistoryIndexerError"
    | "setStakingHistoryIndexerPartialWarning"
    | "setStakingPnlHistoryIncomplete"
    | "setStakingPnlHistoryReady"
  >
): void {
  const {
    stakingOwnerAddress,
    stakingHistoryKey,
    setStakingHistoryRows,
    setStakingHistoryTotals,
    setStakingHistoryFetched,
    setStakingHistoryIndexerError,
    setStakingHistoryIndexerPartialWarning,
    setStakingPnlHistoryIncomplete,
    setStakingPnlHistoryReady,
  } = input

  useEffect(() => {
    if (!stakingHistoryKey || !stakingOwnerAddress) {
      setStakingHistoryRows([])
      setStakingHistoryTotals(EMPTY_STAKING_HISTORY_TOTALS)
      setStakingHistoryFetched(false)
      setStakingHistoryIndexerError(null)
      setStakingHistoryIndexerPartialWarning(null)
      setStakingPnlHistoryIncomplete(false)
      setStakingPnlHistoryReady(false)
      return
    }

    const entry = stakingTransactionHistoryCache.get(stakingHistoryKey)
    const cachedRows = entry?.rows ?? []
    if (cachedRows.length > 0) {
      setStakingHistoryRows(cachedRows)
      setStakingHistoryTotals(aggregateStakingHistoryRows(cachedRows))
      setStakingHistoryFetched(true)
      setStakingHistoryIndexerError(null)
      setStakingHistoryIndexerPartialWarning(null)
      setStakingPnlHistoryIncomplete(false)
      setStakingPnlHistoryReady(false)
    } else {
      setStakingHistoryRows([])
      setStakingHistoryTotals(EMPTY_STAKING_HISTORY_TOTALS)
      setStakingHistoryFetched(false)
      setStakingHistoryIndexerError(null)
      setStakingHistoryIndexerPartialWarning(null)
      setStakingPnlHistoryIncomplete(false)
      setStakingPnlHistoryReady(false)
    }
  }, [stakingOwnerAddress, stakingHistoryKey])
}

export function useStakingVaultHistoryVaultReadyLoad(
  input: Pick<
    UseStakingVaultHistoryEffectsInput,
    | "vaultDataReady"
    | "stakingHistoryKey"
    | "stakingOwnerAddress"
    | "isTronPassiveRuntime"
    | "tronAddressCodec"
    | "tokenAddress"
    | "isEthereumNetwork"
    | "isWrongNetwork"
    | "refreshStakingHistory"
  >
): void {
  const {
    vaultDataReady,
    stakingHistoryKey,
    stakingOwnerAddress,
    isTronPassiveRuntime,
    tronAddressCodec,
    tokenAddress,
    isEthereumNetwork,
    isWrongNetwork,
    refreshStakingHistory,
  } = input

  useEffect(() => {
    if (!vaultDataReady || !stakingHistoryKey) return
    if (isTronPassiveRuntime) {
      const w = stakingOwnerAddress?.trim() ?? ""
      const tok = tokenAddress?.trim() ?? ""
      if (!w || !tronAddressCodec.isValid(w) || !tok || !tronAddressCodec.isValid(tok)) return
    } else if (!isEthereumNetwork || isWrongNetwork) {
      return
    }
    void (async () => {
      try {
        await refreshStakingHistory()
      } catch {
        /* ignore */
      }
    })()
  }, [
    stakingOwnerAddress,
    isEthereumNetwork,
    isWrongNetwork,
    isTronPassiveRuntime,
    vaultDataReady,
    stakingHistoryKey,
    tokenAddress,
    tronAddressCodec,
    refreshStakingHistory,
  ])
}

/** Register stall / invalidate / hydrate / vault-ready effects after composer-only hooks (e.g. Tron rehydrate). */
export function useStakingVaultHistoryEffects(
  input: UseStakingVaultHistoryEffectsInput
): void {
  const {
    stakingHistoryLoading,
    stakingRuntime,
    refreshStakingHistoryRef,
    refs,
    setStakingHistoryLoading,
    ...rest
  } = input

  useStakingVaultHistoryStallWatchdog({
    stakingHistoryLoading,
    stakingRuntime,
    refreshStakingHistoryRef,
    refs,
    setStakingHistoryLoading,
  })

  useStakingVaultHistoryInvalidateOnKeyChange({
    stakingOwnerAddress: rest.stakingOwnerAddress,
    stakingHistoryKey: rest.stakingHistoryKey,
    refs,
  })

  useStakingVaultHistoryCacheHydrate(rest)

  useStakingVaultHistoryVaultReadyLoad(rest)
}

/** Full history bundle (core + effects). Composer should prefer core + effects split when Tron rehydrate must sit between them. */
export function useStakingVaultHistory(
  input: UseStakingVaultHistoryCoreInput &
    Pick<
      UseStakingVaultHistoryEffectsInput,
      | "vaultDataReady"
      | "stakingOwnerAddress"
      | "address"
      | "tokenAddress"
      | "isTronPassiveRuntime"
      | "isEthereumNetwork"
      | "isWrongNetwork"
      | "tronAddressCodec"
    >
): StakingVaultHistoryCore {
  const core = useStakingVaultHistoryCore(input)
  useStakingVaultHistoryEffects({
    ...input,
    ...core,
  })
  return core
}
