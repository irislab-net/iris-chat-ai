import { ERC20_ABI, STAKING_VAULT_ABI } from "@/abis/stakingVault"
import { readViteStakingHighNetworkFeeWei } from "@/staking/config"
import { DEBUG_LOGS } from "@/staking/config"
import { logger } from "@/lib/logger"
import { readStoredReferral } from "@/lib/stakingReferralStorage"
import { STAKING_RPC_HTTP_URL } from "@/constants/stakingVaultConfig"
import { getDefaultStakingRuntimeDeployment, resolveRuntimeOperationContextOrDefault } from "@/staking/core/runtimeSelectionDefaults"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import { assertSupportsGasEstimation, getReadProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { deriveRuntimeReadContext } from "@/staking/core/runtimeReadContext"
import type { DeploymentProviderRuntimeKey, StakingDeploymentConfig } from "@/staking/core/types"
import { formatFeeEtherDisplay } from "@/lib/formatFeeEtherDisplay"
import {
  Contract,
  type FeeData,
  JsonRpcProvider,
  type Signer,
  formatEther,
  getAddress,
  isAddress,
} from "ethers"
import {
  isRetryableNormalizedError,
  normalizeNetworkError,
} from "@/lib/networkErrors"
import { markErrorReportedToStakingSentry } from "@/lib/networkErrors/sentryReportMarker"
import { captureStakingNetworkError } from "@/lib/stakingSentry/captureNetworkError"

/**
 * Staking gas / fee estimation (EVM semantics). **Phase 19–22:** primary JSON-RPC flows through
 * `getReadProviderForDeployment` (legacy default). **Phase 20:** gas + native TTL maps partition by
 * **`runtimeKey`**. **Phase 22:** `assertSupportsGasEstimation` rejects non–gas-capable runtimes (e.g.
 * passive Tron). **Phase 25:** callers should pass **`runtime`** (`RuntimeOperationContext`); omitted
 * params resolve via **`resolveRuntimeOperationContextOrDefault`** (compatibility only).
 * **Phase 26:** React/async ownership should treat **`runtime.runtimeKey` + `runtime.generation`** as the
 * execution identity; gas/native **module caches** are unchanged this phase (no extra invalidation).
 * **Phase 27:** React hooks compare **`deriveRuntimeExecutionIdentity(runtime)`** before **setState**;
 * cache keys here remain **`runtimeKey`**-partitioned only.
 */

export type RpcRoute = "rpc-primary" | "rpc-fallback-signer"

export type StakingGasMethod = "approve" | "deposit" | "depositWithAffiliate" | "withdraw"

const RPC_TIMEOUT_MS = 5000
const MAX_RETRIES = 2
const GAS_LIMIT_MIN = 21_000n
const GAS_LIMIT_MAX = 50_000_000n
const GAS_BUFFER_NUM = 110n
const GAS_BUFFER_DEN = 100n
const FALLBACK_COOLDOWN_MS = 2500
const NATIVE_TTL_MS = 9_000
const GAS_TTL_IDLE_MS = 5_000
const GAS_TTL_ACTIVE_MS = 2_500
const SWEEP_INTERVAL_MS = 60_000
const FEE_DESYNC_RATIO_BPS = 3_000
const BPS_DEN = 10_000n

const gasResultCache = new Map<
  string,
  { value: GasEstimateResult; expiresAt: number }
>()
const nativeBalanceCache = new Map<
  string,
  { value: bigint; expiresAt: number }
>()
const inflightGas = new Map<string, Promise<GasEstimateResult>>()
const inflightNative = new Map<string, Promise<bigint | null>>()

let lastFallbackAt = 0
let lastSweepAt = 0

function gasDebugLog(message: string, data?: Record<string, unknown>) {
  if (!DEBUG_LOGS) return
  logger.log(`[gas] ${message}`, data ?? "")
}

function sweepExpiredCaches(now: number) {
  for (const [k, e] of gasResultCache) {
    if (e.expiresAt <= now) gasResultCache.delete(k)
  }
  for (const [k, e] of nativeBalanceCache) {
    if (e.expiresAt <= now) nativeBalanceCache.delete(k)
  }
  lastSweepAt = now
}

function maybeSweep() {
  const now = Date.now()
  if (now - lastSweepAt > SWEEP_INTERVAL_MS) {
    sweepExpiredCaches(now)
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const t = setTimeout(() => {
      reject(Object.assign(new Error("RPC timeout"), { code: "TIMEOUT" }))
    }, ms)
    p.then(
      v => {
        clearTimeout(t)
        resolve(v)
      },
      e => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function gasNormalize(e: unknown, deployment?: StakingDeploymentConfig) {
  const dep = deployment ?? getDefaultStakingRuntimeDeployment()
  return normalizeNetworkError(e, {
    endpointType: "rpc",
    transport: "http",
    url: dep.rpc.http || STAKING_RPC_HTTP_URL,
    chainId: dep.caip2,
    deploymentId: dep.id,
    requestMethod: "estimateGas",
    severity: "silent",
  })
}

function isRetryableError(e: unknown, deployment?: StakingDeploymentConfig): boolean {
  return isRetryableNormalizedError(gasNormalize(e, deployment))
}

function reportStakingRpcAlertFailure(
  e: unknown,
  deployment: StakingDeploymentConfig | undefined,
  requestMethod: string
): void {
  const dep = deployment ?? getDefaultStakingRuntimeDeployment()
  const alertNorm = normalizeNetworkError(e, {
    endpointType: "rpc",
    transport: "http",
    url: dep.rpc.http || STAKING_RPC_HTTP_URL,
    chainId: dep.caip2,
    deploymentId: dep.id,
    requestMethod,
    severity: "alert",
  })
  if (alertNorm.reportToSentry) {
    captureStakingNetworkError(alertNorm, { cooldownMs: 90_000 })
    markErrorReportedToStakingSentry(e)
  }
}

function reportGasEstimateFailure(e: unknown, deployment?: StakingDeploymentConfig): void {
  reportStakingRpcAlertFailure(e, deployment, "estimateGas")
}

/** Terminal failure: structured Sentry only; suppress duplicate global capture on rethrow. */
function throwTerminalGasEstimateError(
  e: unknown,
  deployment?: StakingDeploymentConfig
): never {
  reportGasEstimateFailure(e, deployment)
  throw e
}

function applyGasBuffer(gasLimit: bigint): bigint {
  return (gasLimit * GAS_BUFFER_NUM + GAS_BUFFER_DEN - 1n) / GAS_BUFFER_DEN
}

function validateGasLimit(g: bigint): boolean {
  return g > 0n && g >= GAS_LIMIT_MIN && g <= GAS_LIMIT_MAX
}

export interface GasEstimateResult {
  maxFeeWei: bigint
  gasLimitEffective: bigint
  gasLimitRaw: bigint
  feeDisplayEthShort: string
  feeExactEther: string
  providerRoute: RpcRoute
  congestionWarning: boolean
  feeData: FeeData
}

function maxFeeFromGasAndFeeData(gasLimitEff: bigint, fee: FeeData): bigint {
  const gp = fee.gasPrice
  const m = fee.maxFeePerGas
  if (m != null && m > 0n) return gasLimitEff * m
  if (gp != null && gp > 0n) return gasLimitEff * gp
  return 0n
}

/** Effective deposit method for estimation (same rules as `useStakingVault.deposit`). */
export function stakingDepositMethodForGas(
  userAddress: string | null
): "deposit" | "depositWithAffiliate" {
  if (!userAddress) return "deposit"
  const storedReferral = readStoredReferral()
  const referralIsOwnWallet =
    storedReferral !== null &&
    storedReferral.toLowerCase() === userAddress.toLowerCase()
  const useAffiliateDeposit =
    storedReferral !== null && !referralIsOwnWallet
  return useAffiliateDeposit ? "depositWithAffiliate" : "deposit"
}

/**
 * Cache key material for gas/native TTL maps. **Phase 20:** includes **`runtimeKey`**
 * (`DeploymentProviderRuntimeKey`) as the authoritative partition — **`deploymentId` alone is not
 * sufficient** when multiple RPC surfaces or families exist. TTLs and inflight keys are unchanged.
 */
export function buildGasCacheKey(parts: {
  runtimeKey: DeploymentProviderRuntimeKey
  deploymentId: string
  chainId: number
  method: StakingGasMethod
  amountWei: bigint
  userAddress: string
  vaultAddress: string
  tokenAddress: string
  referralAddress: string
  rpcUrl: string
  /** When set, distinct cache entry for preview-only gas rows (no eth_estimateGas). */
  previewGasRawOverride?: string
  /** Current on-chain allowance (spender); invalidates cache when it changes (approve leg). */
  approveAllowanceWei?: string
}): string {
  const base: Record<string, unknown> = {
    runtimeKey: parts.runtimeKey,
    deploymentId: parts.deploymentId,
    chainId: parts.chainId,
    method: parts.method,
    amountWei: parts.amountWei.toString(),
    userAddress: parts.userAddress.toLowerCase(),
    vaultAddress: parts.vaultAddress.toLowerCase(),
    tokenAddress: parts.tokenAddress.toLowerCase(),
    referralAddress: parts.referralAddress.toLowerCase(),
    rpcUrl: parts.rpcUrl,
  }
  if (parts.previewGasRawOverride !== undefined) {
    base.previewGasRawOverride = parts.previewGasRawOverride
  }
  if (parts.approveAllowanceWei !== undefined) {
    base.approveAllowanceWei = parts.approveAllowanceWei
  }
  return JSON.stringify(base)
}

function resolveReadDeploymentForGas(params: {
  readDeployment?: StakingDeploymentConfig
  runtime?: RuntimeOperationContext
}): StakingDeploymentConfig {
  return (
    params.readDeployment ??
    resolveRuntimeOperationContextOrDefault(params.runtime).deployment
  )
}

function primaryReadProvider(readDeployment?: StakingDeploymentConfig): JsonRpcProvider {
  const rt = getReadProviderForDeployment(
    readDeployment ?? getDefaultStakingRuntimeDeployment()
  )
  if (rt.chainFamily !== "evm") {
    throw new Error("[staking] gasEstimator: EVM-only primary JSON-RPC (Phase 21).")
  }
  return rt.jsonRpc
}

export function clearGasCaches(): void {
  gasResultCache.clear()
  nativeBalanceCache.clear()
  inflightGas.clear()
  inflightNative.clear()
}

function canonicalRpcUrl(): string {
  return STAKING_RPC_HTTP_URL
}

async function getFeeDataWithProvider(
  provider: JsonRpcProvider,
  route: RpcRoute,
  signal?: AbortSignal
): Promise<FeeData> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
  const fd = await withTimeout(provider.getFeeData(), RPC_TIMEOUT_MS, signal)
  gasDebugLog("feeData", { route })
  return fd
}

function isCallRevert(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "CALL_EXCEPTION"
  )
}

async function estimateGasOperation(params: {
  provider: JsonRpcProvider
  userAddress: string
  vaultAddress: string
  tokenAddress: string
  method: StakingGasMethod
  amountWei: bigint
  signal?: AbortSignal
}): Promise<bigint> {
  const { provider, userAddress, vaultAddress, tokenAddress, method, amountWei, signal } =
    params
  const from = getAddress(userAddress)
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

  if (method === "approve") {
    const token = new Contract(tokenAddress, ERC20_ABI, provider)
    const spender = getAddress(vaultAddress)
    const allowance = await withTimeout(
      token.allowance(from, spender),
      RPC_TIMEOUT_MS,
      signal
    )
    if ((process.env.NODE_ENV !== 'production')) {
      console.log("[staking-allowance:estimate] approve probe", {
        currentAllowanceWei: allowance.toString(),
        targetApproveWei: amountWei.toString(),
      })
    }

    const estimateApproveGas = (value: bigint) =>
      withTimeout(token.approve.estimateGas(spender, value, { from }), RPC_TIMEOUT_MS, signal)

    try {
      return await estimateApproveGas(amountWei)
    } catch (e) {
      if (!isCallRevert(e)) throw e
      const likelyNonZeroTransitionIssue =
        allowance > 0n && amountWei > 0n && allowance !== amountWei
      gasDebugLog("approve_estimate_call_exception", {
        allowance: allowance.toString(),
        amountWei: amountWei.toString(),
        likelyNonZeroTransitionIssue,
      })
      if ((process.env.NODE_ENV !== 'production')) {
        console.log("[staking-allowance:estimate] approve single estimate reverted", {
          allowance: allowance.toString(),
          amountWei: amountWei.toString(),
          likelyNonZeroTransitionIssue,
        })
      }
      if (!likelyNonZeroTransitionIssue) throw e
      const g0 = await estimateApproveGas(0n)
      let g1: bigint
      try {
        g1 = await estimateApproveGas(amountWei)
      } catch (e2) {
        if (!isCallRevert(e2)) throw e2
        gasDebugLog("approve_second_leg_estimate_revert_use_reset_leg_proxy", {
          g0: g0.toString(),
        })
        if ((process.env.NODE_ENV !== 'production')) {
          console.log(
            "[staking-allowance:estimate] second approve estimate reverted on head; proxy 2nd leg gas",
            { g0: g0.toString() }
          )
        }
        g1 = g0
      }
      const total = g0 + g1
      gasDebugLog("approve_estimate_reset_then_target", {
        g0: g0.toString(),
        g1: g1.toString(),
        total: total.toString(),
      })
      if ((process.env.NODE_ENV !== 'production')) {
        console.log("[staking-allowance:estimate] using reset+approve gas sum", {
          g0: g0.toString(),
          g1: g1.toString(),
          total: total.toString(),
        })
      }
      return total
    }
  }

  const vault = new Contract(vaultAddress, STAKING_VAULT_ABI, provider)
  if (method === "deposit") {
    return withTimeout(
      vault.deposit.estimateGas(amountWei, from, { from }),
      RPC_TIMEOUT_MS,
      signal
    )
  }
  if (method === "depositWithAffiliate") {
    const ref = readStoredReferral()
    if (!ref || !isAddress(ref)) {
      throw new Error("depositWithAffiliate requires valid stored referral")
    }
    const aff = getAddress(ref)
    return withTimeout(
      vault.depositWithAffiliate.estimateGas(amountWei, from, aff, { from }),
      RPC_TIMEOUT_MS,
      signal
    )
  }
  if (method === "withdraw") {
    return withTimeout(
      vault.withdraw.estimateGas(amountWei, from, from, { from }),
      RPC_TIMEOUT_MS,
      signal
    )
  }
  throw new Error(`Unknown method ${method}`)
}

async function runEstimateWithRoute(params: {
  route: RpcRoute
  provider: JsonRpcProvider
  userAddress: string
  vaultAddress: string
  tokenAddress: string
  method: StakingGasMethod
  amountWei: bigint
  signal?: AbortSignal
}): Promise<{ gasLimit: bigint; feeData: FeeData; route: RpcRoute }> {
  const feeData = await getFeeDataWithProvider(params.provider, params.route, params.signal)
  const gasLimit = await estimateGasOperation({
    provider: params.provider,
    userAddress: params.userAddress,
    vaultAddress: params.vaultAddress,
    tokenAddress: params.tokenAddress,
    method: params.method,
    amountWei: params.amountWei,
    signal: params.signal,
  })
  return { gasLimit, feeData, route: params.route }
}

async function estimateOncePrimaryThenFallback(params: {
  userAddress: string
  vaultAddress: string
  tokenAddress: string
  method: StakingGasMethod
  amountWei: bigint
  signer: Signer | null
  signal?: AbortSignal
  traceId?: string
  readDeployment?: StakingDeploymentConfig
}): Promise<{ gasLimit: bigint; feeData: FeeData; route: RpcRoute }> {
  const primary = primaryReadProvider(params.readDeployment)
  let attempt = 0
  let lastErr: unknown

  while (attempt <= MAX_RETRIES) {
    try {
      return await runEstimateWithRoute({
        route: "rpc-primary",
        provider: primary,
        userAddress: params.userAddress,
        vaultAddress: params.vaultAddress,
        tokenAddress: params.tokenAddress,
        method: params.method,
        amountWei: params.amountWei,
        signal: params.signal,
      })
    } catch (e) {
      lastErr = e
      if (params.signal?.aborted) throw e
      if (isCallRevert(e)) throw e
      const timeoutLike = e instanceof Error && e.message === "RPC timeout"
      if (!isRetryableError(e, params.readDeployment) && !timeoutLike) {
        throwTerminalGasEstimateError(e, params.readDeployment)
      }
      attempt++
      if (attempt <= MAX_RETRIES) {
        gasDebugLog("retry", { traceId: params.traceId, attempt, err: String(e) })
        await new Promise(r => setTimeout(r, 150 * attempt))
      }
    }
  }

  const err = lastErr
  if (!params.signer || !err) {
    if (err) throwTerminalGasEstimateError(err, params.readDeployment)
    throw err
  }

  const fallbackProv = params.signer.provider
  if (!fallbackProv) throwTerminalGasEstimateError(err, params.readDeployment)

  const now = Date.now()
  if (now - lastFallbackAt < FALLBACK_COOLDOWN_MS) {
    await new Promise(r => setTimeout(r, FALLBACK_COOLDOWN_MS - (now - lastFallbackAt)))
  }

  lastFallbackAt = Date.now()
  gasDebugLog("fallback signer.provider", { traceId: params.traceId })

  return await runEstimateWithRoute({
    route: "rpc-fallback-signer",
    provider: fallbackProv as JsonRpcProvider,
    userAddress: params.userAddress,
    vaultAddress: params.vaultAddress,
    tokenAddress: params.tokenAddress,
    method: params.method,
    amountWei: params.amountWei,
    signal: params.signal,
  })
}

function buildResult(
  gasLimitRaw: bigint,
  feeData: FeeData,
  route: RpcRoute
): GasEstimateResult {
  if (!validateGasLimit(gasLimitRaw)) {
    throw new Error("Invalid gas limit from RPC")
  }
  const gasLimitEffective = applyGasBuffer(gasLimitRaw)
  const maxFeeWei = maxFeeFromGasAndFeeData(gasLimitEffective, feeData)
  const highWei = readViteStakingHighNetworkFeeWei()
  const congestionWarning = highWei !== null && maxFeeWei > highWei

  return {
    maxFeeWei,
    gasLimitEffective,
    gasLimitRaw,
    feeDisplayEthShort: `~${formatFeeEtherDisplay(maxFeeWei)} ETH`,
    feeExactEther: formatEther(maxFeeWei),
    providerRoute: route,
    congestionWarning,
    feeData,
  }
}

function feesRoughlyConsistent(a: bigint, b: bigint): boolean {
  if (a === 0n && b === 0n) return true
  const hi = a > b ? a : b
  const lo = a > b ? b : a
  if (hi === 0n) return true
  const diff = hi > lo ? hi - lo : lo - hi
  return (diff * BPS_DEN) / hi < BigInt(FEE_DESYNC_RATIO_BPS)
}

export interface EstimateGasParams {
  method: StakingGasMethod
  amountWei: bigint
  userAddress: string
  tokenAddress: string
  vaultAddress: string
  chainId: number
  signer: Signer | null
  signal?: AbortSignal
  forceRefresh: boolean
  activityTtl: "idle" | "active"
  isValidForCache: () => boolean
  traceId?: string
  /**
   * Phase 19–20: JSON-RPC row for primary reads (overrides `runtime.deployment` when both set).
   * Drives both provider selection and **`runtimeKey`** in gas/native cache keys.
   */
  readDeployment?: StakingDeploymentConfig
  /** Phase 25: explicit runtime snapshot when `readDeployment` is omitted. */
  runtime?: RuntimeOperationContext
  /**
   * Skip `eth_estimateGas`; build fee from this raw limit + current fee data.
   * Used when deposit/depositWithAffiliate simulation reverts pre-approval (preview only).
   */
  gasLimitRawOverride?: bigint
}

export async function estimateStakingGasFee(
  params: EstimateGasParams
): Promise<GasEstimateResult | null> {
  maybeSweep()
  const readDep = resolveReadDeploymentForGas(params)
  assertSupportsGasEstimation(readDep)
  const { runtimeKey, deploymentId } = deriveRuntimeReadContext(readDep)
  const rpcUrl = canonicalRpcUrl()
  const refRaw = readStoredReferral()
  const referralKey = refRaw && isAddress(refRaw) ? getAddress(refRaw).toLowerCase() : ""

  let approveAllowanceWei: string | undefined
  if (
    params.method === "approve" &&
    params.gasLimitRawOverride === undefined &&
    isAddress(params.tokenAddress)
  ) {
    try {
      const token = new Contract(params.tokenAddress, ERC20_ABI, primaryReadProvider(readDep))
      const al = await withTimeout(
        token.allowance(
          getAddress(params.userAddress),
          getAddress(params.vaultAddress)
        ),
        RPC_TIMEOUT_MS,
        params.signal
      )
      approveAllowanceWei = al.toString()
    } catch {
      approveAllowanceWei = "?"
    }
  }

  const cacheKey = buildGasCacheKey({
    runtimeKey,
    deploymentId,
    chainId: params.chainId,
    method: params.method,
    amountWei: params.amountWei,
    userAddress: params.userAddress,
    vaultAddress: params.vaultAddress,
    tokenAddress: params.tokenAddress,
    referralAddress: referralKey,
    rpcUrl,
    previewGasRawOverride:
      params.gasLimitRawOverride !== undefined
        ? params.gasLimitRawOverride.toString()
        : undefined,
    approveAllowanceWei,
  })

  const ttlMs =
    params.forceRefresh ? 0 : params.activityTtl === "idle" ? GAS_TTL_IDLE_MS : GAS_TTL_ACTIVE_MS

  if (!params.forceRefresh && ttlMs > 0) {
    const hit = gasResultCache.get(cacheKey)
    if (hit && hit.expiresAt > Date.now()) {
      gasDebugLog("cache hit", { key: cacheKey.slice(0, 80) })
      return hit.value
    }
  }

  const inflightKey = cacheKey
  const existing = inflightGas.get(inflightKey)
  if (existing && !params.forceRefresh) {
    return existing
  }
  if (params.forceRefresh) {
    inflightGas.delete(inflightKey)
  }

  const promise = (async (): Promise<GasEstimateResult | null> => {
    try {
      if (params.gasLimitRawOverride !== undefined) {
        const raw = params.gasLimitRawOverride
        if (params.signal?.aborted) return null
        if (!validateGasLimit(raw)) return null
        const feeData = await getFeeDataWithProvider(
          primaryReadProvider(readDep),
          "rpc-primary",
          params.signal
        )
        if (params.signal?.aborted) return null
        let result: GasEstimateResult
        try {
          result = buildResult(raw, feeData, "rpc-primary")
        } catch {
          return null
        }
        const fd2 = await getFeeDataWithProvider(
          primaryReadProvider(readDep),
          "rpc-primary",
          params.signal
        )
        if (params.signal?.aborted) return null
        const max2 = maxFeeFromGasAndFeeData(result.gasLimitEffective, fd2)
        if (!feesRoughlyConsistent(result.maxFeeWei, max2)) {
          const fd3 = await getFeeDataWithProvider(
            primaryReadProvider(readDep),
            "rpc-primary",
            params.signal
          )
          if (params.signal?.aborted) return null
          try {
            result = buildResult(raw, fd3, "rpc-primary")
          } catch {
            return null
          }
        }
        if (params.isValidForCache() && !params.signal?.aborted) {
          const ttlWrite =
            params.forceRefresh ? GAS_TTL_IDLE_MS : ttlMs > 0 ? ttlMs : GAS_TTL_IDLE_MS
          const expiresAt = Date.now() + ttlWrite
          gasResultCache.set(cacheKey, { value: result, expiresAt })
        }
        return result
      }

      const { gasLimit, feeData, route } = await estimateOncePrimaryThenFallback({
        userAddress: params.userAddress,
        vaultAddress: params.vaultAddress,
        tokenAddress: params.tokenAddress,
        method: params.method,
        amountWei: params.amountWei,
        signer: params.signer,
        signal: params.signal,
        traceId: params.traceId,
        readDeployment: readDep,
      })

      if (params.signal?.aborted) return null

      let result: GasEstimateResult
      try {
        result = buildResult(gasLimit, feeData, route)
      } catch {
        return null
      }

      const fd2 = await getFeeDataWithProvider(primaryReadProvider(readDep), "rpc-primary", params.signal)
      const max2 = maxFeeFromGasAndFeeData(result.gasLimitEffective, fd2)
      if (!feesRoughlyConsistent(result.maxFeeWei, max2)) {
        gasDebugLog("desync re-run", { traceId: params.traceId })
        const second = await estimateOncePrimaryThenFallback({
          userAddress: params.userAddress,
          vaultAddress: params.vaultAddress,
          tokenAddress: params.tokenAddress,
          method: params.method,
          amountWei: params.amountWei,
          signer: params.signer,
          signal: params.signal,
          traceId: params.traceId,
          readDeployment: readDep,
        })
        if (params.signal?.aborted) return null
        try {
          result = buildResult(second.gasLimit, second.feeData, second.route)
        } catch {
          return null
        }
      }

      if (params.isValidForCache() && !params.signal?.aborted) {
        const ttlWrite =
          params.forceRefresh ? GAS_TTL_IDLE_MS : ttlMs > 0 ? ttlMs : GAS_TTL_IDLE_MS
        const expiresAt = Date.now() + ttlWrite
        gasResultCache.set(cacheKey, { value: result, expiresAt })
      }
      return result
    } catch (e) {
      gasDebugLog("estimate failed", { err: String(e), traceId: params.traceId })
      return null
    } finally {
      inflightGas.delete(inflightKey)
    }
  })()

  inflightGas.set(inflightKey, promise as Promise<GasEstimateResult>)
  return promise
}

export interface NativeBalanceParams {
  userAddress: string
  chainId: number
  rpcUrl: string
  signal?: AbortSignal
  forceRefresh?: boolean
  isValidForCache: () => boolean
  /** Phase 19–20: primary read row (overrides `runtime.deployment` when both set). Cache partitions by `runtimeKey`. */
  readDeployment?: StakingDeploymentConfig
  /** Phase 25: explicit runtime snapshot when `readDeployment` is omitted. */
  runtime?: RuntimeOperationContext
}

export async function getCachedNativeBalanceWei(
  params: NativeBalanceParams
): Promise<bigint | null> {
  maybeSweep()
  const readDep = resolveReadDeploymentForGas(params)
  assertSupportsGasEstimation(readDep)
  const { runtimeKey, deploymentId } = deriveRuntimeReadContext(readDep)
  const key = JSON.stringify({
    t: "native",
    runtimeKey,
    deploymentId,
    chainId: params.chainId,
    user: params.userAddress.toLowerCase(),
    rpc: params.rpcUrl,
  })

  if (!params.forceRefresh) {
    const hit = nativeBalanceCache.get(key)
    if (hit && hit.expiresAt > Date.now()) return hit.value
  }

  const existing = inflightNative.get(key)
  if (existing && !params.forceRefresh) return existing

  const p = (async () => {
    try {
      const provider = primaryReadProvider(readDep)
      const bal = await withTimeout(
        provider.getBalance(getAddress(params.userAddress)),
        RPC_TIMEOUT_MS,
        params.signal
      )
      if (params.isValidForCache() && !params.signal?.aborted) {
        nativeBalanceCache.set(key, {
          value: bal,
          expiresAt: Date.now() + NATIVE_TTL_MS,
        })
      }
      return bal
    } catch (e) {
      if (!params.signal?.aborted) {
        reportStakingRpcAlertFailure(e, readDep, "getBalance")
      }
      return null
    } finally {
      inflightNative.delete(key)
    }
  })()

  inflightNative.set(key, p)
  return p
}

/** Near-zero: skip expensive estimate gating (matches plan G.1). */
export const NEAR_ZERO_ETH_WEI = 10_000_000_000_000n // 1e-5 ETH

export function isNearZeroNativeBalance(wei: bigint): boolean {
  return wei <= NEAR_ZERO_ETH_WEI
}
