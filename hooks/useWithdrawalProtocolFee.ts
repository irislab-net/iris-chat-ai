import { STAKING_VAULT_ABI } from "@/abis/stakingVault"
import {
  STAKING_CHAIN_ID,
  STAKING_STABLECOIN_LABEL,
  STAKING_VAULT_ADDRESS,
} from "@/constants/stakingVaultConfig"
import { getStakingVaultRead } from "@/staking/execution"
import { assertSupportsEthersContracts, getJsonRpcProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { canRuntimeOperationCommitWithDevTrace } from "@/staking/orchestration"
import { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import { removeTrailingZeros } from "@/lib/utils"
import { Contract, formatUnits, getAddress, isAddress, type JsonRpcProvider } from "ethers"
import { useEffect, useMemo, useRef, useState } from "react"

const READ_TIMEOUT_MS = 12_000

function withTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      reject(Object.assign(new Error("read-timeout"), { code: "TIMEOUT" }))
    }, ms)
    const onAbort = () => {
      window.clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (signal) signal.addEventListener("abort", onAbort, { once: true })
    p.then(
      v => {
        window.clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        resolve(v)
      },
      e => {
        window.clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        reject(e)
      }
    )
  })
}

export type UseWithdrawalProtocolFeeOptions = Readonly<{
  vaultAddress: string | null
  /**
   * Withdraw `assets` wei — must follow the form’s debounced + slider-stable pipeline
   * (e.g. `gasStableWei`) so RPC is not called per keystroke or during slider drag.
   */
  amountWei: bigint | null
  tokenDecimals: number | null
  tokenSymbol: string
  enabled: boolean
  chainId: number | null
  /** When omitted, uses JSON-RPC for `useRuntimeTransitionSnapshot().operationContext.deployment`. */
  provider?: JsonRpcProvider | null
}>

export type UseWithdrawalProtocolFeeResult = Readonly<{
  feeWei: bigint | null
  /** Token-native display, e.g. `~1.25 MUSDC` (no ETH / no Chainlink). */
  formattedFee: string
  loading: boolean
  error: string | null
  /** True while a fetch is in flight but a prior `feeWei` is still shown. */
  stale: boolean
}>

/**
 * Read-only `vault.withdrawalFee(assets)` for withdraw UX.
 * Isolated from gas / Chainlink / `useStakingGasEstimate`.
 *
 * ## Phase 22 — capability boundary
 *
 * This hook performs **EVM vault ABI reads** (`STAKING_VAULT_ABI` + `withdrawalFee`) via ethers
 * `Contract` — **not** generic passive HTTP. **Phase 28:** uses **`useRuntimeTransitionSnapshot()`** for the
 * default JSON-RPC surface, shared execution identity ref, and **`assertSupportsEthersContracts(operationContext.deployment)`**
 * guards against accidental use if the active deployment stops being ethers-capable.
 *
 * **Phase 32–36:** commits use **`canRuntimeOperationCommitWithDevTrace`** vs **`latestCoordinatorSnapshotRef`**
 * (coordinator lifecycle, **`sequenceStage`**, **`transitionGeneration`**); selection **`generation`** bumps only through **`executeRuntimeSwap`** after policy (Phase 35).
 */
export function useWithdrawalProtocolFee(
  options: UseWithdrawalProtocolFeeOptions
): UseWithdrawalProtocolFeeResult {
  const transition = useRuntimeTransitionSnapshot()
  const stakingRuntime = transition.operationContext
  const latestCoordinatorSnapshotRef = transition.latestCoordinatorSnapshotRef
  const {
    vaultAddress,
    amountWei,
    tokenDecimals,
    tokenSymbol,
    enabled,
    chainId,
    provider: providerOverride,
  } = options

  const [feeWei, setFeeWei] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)

  const requestIdRef = useRef(0)
  const lastCommittedFeeRef = useRef<bigint | null>(null)
  const lastQueriedAmountRef = useRef<bigint | null>(null)

  const sym = (tokenSymbol || STAKING_STABLECOIN_LABEL).trim() || STAKING_STABLECOIN_LABEL

  const formattedFee = useMemo(() => {
    if (feeWei === null || tokenDecimals === null) return ""
    try {
      const n = removeTrailingZeros(formatUnits(feeWei, tokenDecimals))
      return `~${n} ${sym}`
    } catch {
      return ""
    }
  }, [feeWei, tokenDecimals, sym])

  useEffect(() => {
    const id = ++requestIdRef.current
    const ac = new AbortController()

    const vaultOk =
      Boolean(vaultAddress) &&
      isAddress(vaultAddress) &&
      getAddress(vaultAddress) === getAddress(STAKING_VAULT_ADDRESS)

    const chainOk = chainId !== null && chainId === STAKING_CHAIN_ID

    const amountOk = amountWei !== null && amountWei > 0n

    const metaOk = tokenDecimals !== null && tokenDecimals >= 0 && tokenDecimals <= 36

    const shouldRead = enabled && vaultOk && chainOk && amountOk && metaOk

    if (!shouldRead) {
      if (id === requestIdRef.current) {
        setLoading(false)
        setStale(false)
        setError(null)
        setFeeWei(null)
        lastCommittedFeeRef.current = null
        lastQueriedAmountRef.current = null
      }
      return () => {
        ac.abort()
      }
    }

    const sameAmount = lastQueriedAmountRef.current === amountWei
    if (!sameAmount) {
      setFeeWei(null)
      lastCommittedFeeRef.current = null
    }
    lastQueriedAmountRef.current = amountWei

    setLoading(true)
    setError(null)
    setStale(sameAmount && lastCommittedFeeRef.current !== null)

    const run = async () => {
      const coordinatorAtStart = transition.coordinatorSnapshot
      try {
        assertSupportsEthersContracts(stakingRuntime.deployment)
        const p =
          providerOverride ?? getJsonRpcProviderForDeployment(stakingRuntime.deployment)
        const v = getAddress(vaultAddress!)
        const readOpts = { runtime: stakingRuntime }
        const vault =
          v === getAddress(STAKING_VAULT_ADDRESS)
            ? getStakingVaultRead(p, readOpts)
            : new Contract(v, STAKING_VAULT_ABI, p)

        const call = vault.withdrawalFee(amountWei!) as Promise<bigint>
        const wei = await withTimeout(call, READ_TIMEOUT_MS, ac.signal)

        if (id !== requestIdRef.current || ac.signal.aborted) return
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useWithdrawalProtocolFee:after_read",
            coordinatorAtStart,
            latestCoordinatorSnapshotRef.current
          )
        )
          return

        lastCommittedFeeRef.current = wei
        setFeeWei(wei)
        setError(null)
        setStale(false)
      } catch (e) {
        if (id !== requestIdRef.current) return
        if (e instanceof DOMException && e.name === "AbortError") return
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useWithdrawalProtocolFee:catch",
            coordinatorAtStart,
            latestCoordinatorSnapshotRef.current
          )
        )
          return
        lastCommittedFeeRef.current = null
        setFeeWei(null)
        setError(e instanceof Error ? e.message : String(e))
        setStale(false)
      } finally {
        if (
          id === requestIdRef.current &&
          canRuntimeOperationCommitWithDevTrace(
            "useWithdrawalProtocolFee:finally_clearLoading",
            coordinatorAtStart,
            latestCoordinatorSnapshotRef.current
          )
        ) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      ac.abort()
    }
  }, [enabled, vaultAddress, amountWei, tokenDecimals, chainId, providerOverride, transition])

  return useMemo(
    () => ({
      feeWei,
      formattedFee,
      loading,
      error,
      stale,
    }),
    [feeWei, formattedFee, loading, error, stale]
  )
}
