/**
 * Centralized read-only contract access + bounded batched reads.
 * Contract instances are cached; callers must not `new Contract` for staking reads.
 *
 * ## Phase 12 — provider / cache identity audit
 *
 * - **Implicit provider**: cached `Contract` instances use **`getReadProviderForDeployment`**
 *   for the **active default staking runtime** (`getDefaultStakingRuntimeDeployment` / Phase 24) — same
 *   before (Phase 19 names ownership explicitly). **Phase 25:** prefer **`options.runtime`** snapshot from
 *   React; omitted options still default via **`getDefaultStakingRuntimeDeployment`**.
 *   **Phase 26:** React async effects should depend on **`runtime.runtimeKey` + `runtime.generation`**;
 *   contract **cache keys** here remain **`runtimeKey`**-scoped until explicit cache busting ships.
 *   **Phase 27:** React hooks guard **setState** with **`deriveRuntimeExecutionIdentity`** — do not fold
 *   **`RuntimeGeneration`** into these cache strings in this phase.
 * - **Phase 22:** `assertSupportsEthersContracts` gates every **ethers `Contract`** read path — passive
 *   Tron / non-executable EVM rows throw explicitly (no silent EVM fallback).
 * - **Registry rows (Phase 15):** `getStakingDeploymentRegistry()` returns **normalized** deployments
 *   before any provider map lookup — cache keys stay stable for the current single-runtime app.
 * - **Cache keys (Phase 20):** **`deriveDeploymentRuntimeCacheKey`** (`runtimeCacheKey.ts`) —
 *   `runtimeKey` + contract address (unit-sep delimited). Same `Contract` reuse per runtime surface;
 *   distinct `runtimeKey`s never share entries. One-time cold miss vs old `deploymentId`-only keys.
 */
import { ERC20_ABI, STAKING_VAULT_ABI } from "@/abis/stakingVault"
import { STAKING_VAULT_ADDRESS } from "@/constants/stakingVaultConfig"
import { getDefaultStakingRuntimeDeployment } from "@/staking/core/runtimeSelectionDefaults"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { RuntimeReadContext } from "@/staking/core/runtimeReadContext"
import { deriveDeploymentRuntimeCacheKey } from "@/staking/core/runtimeCacheKey"
import { assertSupportsEthersContracts, getReadProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import type { JsonRpcProvider } from "ethers"
import { Contract, MaxUint256 } from "ethers"
import {
  attachNetworkErrorMetadata,
  diagnosticsKey,
  hostnameFromUrl,
  normalizeNetworkError,
  recordEndpointFailure,
  recordEndpointSuccess,
  setLastRpcFailureForRuntimeKey,
} from "@/lib/networkErrors"
import { getProviderRuntimeKeyForDeployment } from "@/staking/core/providerRegistry"
import { stakingMetricsEthCall, stakingMetricsTimeout } from "@/staking/refresh/stakingRefreshMetrics"

const READ_TIMEOUT_MS = 12_000

export const stakingLastHealthyRpcAtRef = { current: 0 }

const erc20Cache = new Map<string, Contract>()
const vaultCache = new Map<string, Contract>()

/**
 * Phase 19: optional deployment + pre-derived runtime read identity. When omitted, behavior matches
 * pre-Phase-19 legacy reads. **Invariant:** if `provider` is passed, it must match the deployment’s
 * RPC surface (callers are responsible); otherwise HTTP comes from `getReadProviderForDeployment`.
 * **Phase 25:** optional **`runtime`** snapshot from React (preferred when no explicit **`deployment`**).
 * **`deployment`** still overrides **`runtime.deployment`** for multi-row / test tooling.
 */
export type StakingContractReadOptions = {
  deployment?: StakingDeploymentConfig
  runtimeRead?: RuntimeReadContext
  /** Phase 25: explicit runtime snapshot (preferred over bare `deployment` for app reads). */
  runtime?: RuntimeOperationContext
}

function resolveReadDeployment(
  options?: StakingContractReadOptions
): StakingDeploymentConfig {
  return (
    options?.deployment ??
    options?.runtime?.deployment ??
    getDefaultStakingRuntimeDeployment()
  )
}

function resolveReadProvider(
  options: StakingContractReadOptions | undefined,
  explicitProvider: JsonRpcProvider | undefined
): JsonRpcProvider {
  const dep = resolveReadDeployment(options)
  assertSupportsEthersContracts(dep)
  if (explicitProvider) return explicitProvider
  const rt = getReadProviderForDeployment(dep)
  if (rt.chainFamily !== "evm") {
    throw new Error(
      "[staking] stakingReadFactory: ethers Contract reads are EVM-only; Tron uses a separate passive HTTP runtime (Phase 21)."
    )
  }
  return rt.jsonRpc
}

function stakingErc20ContractCacheKey(
  tokenAddress: string,
  options?: StakingContractReadOptions
): string {
  const dep = resolveReadDeployment(options)
  return deriveDeploymentRuntimeCacheKey(dep, tokenAddress.toLowerCase())
}

function stakingVaultContractCacheKey(
  vaultAddress: string,
  options?: StakingContractReadOptions
): string {
  const dep = resolveReadDeployment(options)
  return deriveDeploymentRuntimeCacheKey(dep, vaultAddress.toLowerCase())
}

function withTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(Object.assign(new Error("read-timeout"), { code: "TIMEOUT" }))
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (signal) signal.addEventListener("abort", onAbort, { once: true })
    p.then(
      v => {
        clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        resolve(v)
      },
      e => {
        clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        reject(e)
      }
    )
  })
}

function markRpcHealthy() {
  stakingLastHealthyRpcAtRef.current = performance.now()
}

async function wrapField<T>(
  _label: string,
  fn: () => Promise<T>,
  signal?: AbortSignal
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    const v = await withTimeout(fn(), READ_TIMEOUT_MS, signal)
    markRpcHealthy()
    const dep = resolveReadDeployment(undefined)
    recordEndpointSuccess(
      diagnosticsKey({
        endpointType: "rpc",
        transport: "http",
        hostname: hostnameFromUrl(dep.rpc.http),
      })
    )
    return { ok: true, value: v }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (
      msg.includes("timeout") ||
      msg.includes("read-timeout") ||
      (e as { code?: string }).code === "TIMEOUT"
    ) {
      stakingMetricsTimeout()
    }
    const dep = resolveReadDeployment(undefined)
    const normalized = normalizeNetworkError(e, {
      endpointType: "rpc",
      transport: "http",
      url: dep.rpc.http,
      chainId: dep.caip2,
      deploymentId: dep.id,
      requestMethod: _label,
      severity: "silent",
    })
    attachNetworkErrorMetadata(e, normalized)
    const key = diagnosticsKey({
      endpointType: "rpc",
      transport: "http",
      hostname: normalized.hostname,
    })
    recordEndpointFailure(key, normalized)
    setLastRpcFailureForRuntimeKey(getProviderRuntimeKeyForDeployment(dep), normalized)
    return { ok: false, error: msg }
  }
}

export function getStakingErc20Read(
  tokenAddress: string,
  provider?: JsonRpcProvider,
  options?: StakingContractReadOptions
): Contract {
  const p = resolveReadProvider(options, provider)
  const key = stakingErc20ContractCacheKey(tokenAddress, options)
  let c = erc20Cache.get(key)
  if (!c) {
    c = new Contract(tokenAddress, ERC20_ABI, p)
    erc20Cache.set(key, c)
  }
  return c
}

export function getStakingVaultRead(
  provider?: JsonRpcProvider,
  options?: StakingContractReadOptions
): Contract {
  const p = resolveReadProvider(options, provider)
  const key = stakingVaultContractCacheKey(STAKING_VAULT_ADDRESS, options)
  let c = vaultCache.get(key)
  if (!c) {
    c = new Contract(STAKING_VAULT_ADDRESS, STAKING_VAULT_ABI, p)
    vaultCache.set(key, c)
  }
  return c
}

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export type StakingFastReadResult = {
  walletBalance: FieldResult<bigint>
  vaultShares: FieldResult<bigint>
}

export type StakingSlowReadResult = {
  allowance: FieldResult<bigint>
  maxDeposit: FieldResult<bigint>
  maxWithdraw: FieldResult<bigint>
  minWithdrawalFee: FieldResult<bigint>
}

/** Single `balanceOf` with shared timeout + metrics (e.g. ICO dialog on staking chain). */
export async function executeStakingErc20BalanceOf(params: {
  tokenAddress: string
  walletAddress: string
  signal?: AbortSignal
  read?: StakingContractReadOptions
}): Promise<FieldResult<bigint>> {
  const { tokenAddress, walletAddress, signal, read } = params
  const token = getStakingErc20Read(tokenAddress, undefined, read)
  const r = await wrapField("balanceOf", () => token.balanceOf(walletAddress), signal)
  stakingMetricsEthCall(1)
  return r
}

export async function executeStakingFastRead(params: {
  tokenAddress: string
  walletAddress: string
  signal?: AbortSignal
  read?: StakingContractReadOptions
}): Promise<StakingFastReadResult> {
  const { tokenAddress, walletAddress, signal, read } = params
  const token = getStakingErc20Read(tokenAddress, undefined, read)
  const vault = getStakingVaultRead(undefined, read)

  const [walletBalance, vaultShares] = await Promise.all([
    wrapField("balanceOf", () => token.balanceOf(walletAddress), signal),
    wrapField("vaultShares", () => vault.balanceOf(walletAddress), signal),
  ])
  stakingMetricsEthCall(2)
  return { walletBalance, vaultShares }
}

export async function executeStakingSlowRead(params: {
  tokenAddress: string
  walletAddress: string
  signal?: AbortSignal
  read?: StakingContractReadOptions
}): Promise<StakingSlowReadResult> {
  const { tokenAddress, walletAddress, signal, read } = params
  const token = getStakingErc20Read(tokenAddress, undefined, read)
  const vault = getStakingVaultRead(undefined, read)

  const [allowance, maxDeposit, maxWithdraw, minWithdrawalFee] = await Promise.all([
    wrapField("allowance", () => token.allowance(walletAddress, STAKING_VAULT_ADDRESS), signal),
    (async (): Promise<FieldResult<bigint>> => {
      const r = await wrapField("maxDeposit", () => vault.maxDeposit(walletAddress), signal)
      if (r.ok) return r
      return { ok: true, value: MaxUint256 }
    })(),
    (async (): Promise<FieldResult<bigint>> => {
      const r = await wrapField("maxWithdraw", () => vault.maxWithdraw(walletAddress), signal)
      if (r.ok) return r
      return { ok: true, value: MaxUint256 }
    })(),
    (async (): Promise<FieldResult<bigint>> => {
      const r = await wrapField("minFee", () => vault.minWithdrawalFee(), signal)
      if (r.ok) return r
      return { ok: true, value: 0n }
    })(),
  ])
  stakingMetricsEthCall(4)
  return { allowance, maxDeposit, maxWithdraw, minWithdrawalFee }
}
