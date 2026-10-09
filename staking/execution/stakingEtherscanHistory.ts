/**
 * Staking transaction history via unified tx-history API (`type=transactions`).
 */

import { STAKING_CHAIN_ID, stakingTransactionExplorerUrl, stakingTxHistoryUrl } from "@/constants/stakingVaultConfig"
import { fetchWithTimeout } from "@/lib/fetchWithTimeout"
import { logger } from "@/lib/logger"
import {
  indexerLogFieldsFromError,
  reportIndexerNetworkFailure,
} from "@/lib/networkErrors"
import { formatPlainApiAmount, isPlainAmountNonZeroDisplay } from "@/lib/plainDecimalAmount"
import { formatUnits, getAddress, isAddress } from "ethers"
import { createDeploymentExplorerResolver } from "@/staking/core/createExplorerResolver"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"

export type StakingTxType =
  | "deposit"
  | "withdraw"
  | "referral_reward"
  | "approve"
  | "transfer"
  | "transfer_from"
  | "mint"
  | "yield_deposit"
  | "admin"
  | "other"

export type StakingTxStatus = "success" | "failed" | "pending"

export type StakingHistoryRow = {
  hash: string
  type: StakingTxType
  typeLabel: string
  amount: string | null
  amountWei: bigint | null
  feeAmountWei: bigint | null
  symbol: string
  timestamp: number
  from: string
  to: string
  methodId: string
  status: StakingTxStatus
  /**
   * Phase 50 — deployment that produced this row (set on fetch). When absent (older cache rows),
   * explorer links fall back to the legacy env explorer.
   */
  deploymentId?: string
}

export type StakingHistoryTotals = {
  totalDepositsWei: bigint
  totalWithdrawalsWei: bigint
  totalFeesWei: bigint
  netDepositsWei: bigint
  lastBalanceChangeTimestamp: number | null
}

export type StakingHistoryCacheEntry = {
  rows: StakingHistoryRow[]
  /** Reserved for incremental indexers; unified API does not expose block height. */
  latestScannedBlock: number | null
}

export const stakingTransactionHistoryCache = new Map<
  string,
  StakingHistoryCacheEntry
>()

function logStakingHistoryFailure(
  context: string,
  reason: string,
  cause?: unknown,
  details?: Record<string, unknown>
): void {
  const causeFields =
    cause !== undefined
      ? cause instanceof Error
        ? { causeName: cause.name, causeMessage: cause.message }
        : { cause: String(cause) }
      : {}
  const networkFields =
    cause !== undefined ? indexerLogFieldsFromError(cause) : { network_error_type: null, rpc_host: null }
  logger.error("[staking-history]", {
    indexer: "tx-history-api",
    chainId: STAKING_CHAIN_ID,
    context,
    reason,
    ...networkFields,
    ...causeFields,
    ...(details && Object.keys(details).length > 0 ? { details } : {}),
  })
  if (cause !== undefined) {
    reportIndexerNetworkFailure({
      error: cause,
      chainId: STAKING_CHAIN_ID,
      deploymentId: typeof details?.deploymentId === "string" ? details.deploymentId : undefined,
      httpStatus: typeof details?.status === "number" ? details.status : undefined,
      url: typeof details?.url === "string" ? details.url : undefined,
    })
  }
}

export function logStakingHistoryConsoleError(
  context: string,
  reason: string,
  cause?: unknown,
  details?: Record<string, unknown>
): void {
  logStakingHistoryFailure(context, reason, cause, details)
}

function stakingHistoryCacheAddressPart(addr: string): string {
  const t = addr.trim()
  if (/^0x[0-9a-fA-F]+$/.test(t)) return t.toLowerCase()
  return t
}

/** Namespaced cache key (multi-pool / multi-deployment aware; Phase 48). */
export function stakingHistoryCacheKey(input: {
  deploymentId: string
  /** EVM numeric chain id, or CAIP-2 string for non-EVM namespaces. */
  chainSegment: string
  walletAddress: string
  tokenAddress: string
  vaultAddress: string
}): string {
  return [
    input.deploymentId.trim(),
    input.chainSegment.trim(),
    stakingHistoryCacheAddressPart(input.walletAddress),
    stakingHistoryCacheAddressPart(input.tokenAddress),
    stakingHistoryCacheAddressPart(input.vaultAddress),
  ].join(":")
}

export function mergeStakingHistoryByHash(
  previous: StakingHistoryRow[],
  incoming: StakingHistoryRow[]
): StakingHistoryRow[] {
  const byHash = new Map<string, StakingHistoryRow>()
  for (const row of previous) {
    byHash.set(row.hash.toLowerCase(), row)
  }
  for (const row of incoming) {
    byHash.set(row.hash.toLowerCase(), row)
  }
  return Array.from(byHash.values()).sort((a, b) => b.timestamp - a.timestamp)
}

export const STAKING_TX_TAGS: Array<{ key: StakingTxType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "deposit", label: "Stake" },
  { key: "withdraw", label: "Unstake" },
  { key: "referral_reward", label: "Referral Reward" },
]

export function isNegligibleStakingAmountWei(
  wei: bigint,
  tokenDecimals: number
): boolean {
  if (wei === 0n) return true
  const absWei = wei < 0n ? -wei : wei
  const oneToken = 10n ** BigInt(tokenDecimals)
  let minWei = oneToken / 1_000_000n
  if (minWei < 1n) minWei = 1n
  return absWei < minWei
}

export function formatStakingTxAmountDisplay(
  amountWei: bigint,
  tokenDecimals: number
): string {
  let s = formatUnits(amountWei, tokenDecimals)
  const neg = s.startsWith("-")
  if (neg) s = s.slice(1)

  const [intPart, fracPart = ""] = s.includes(".")
    ? s.split(".")
    : [s, ""]

  let frac = fracPart.replace(/0+$/, "")
  if (frac.length < 2) {
    frac = frac.padEnd(2, "0")
  }

  const body = `${intPart}.${frac}`
  return neg ? `-${body}` : body
}

export function shouldDisplayStakingHistoryAmount(
  amount: string | null,
  amountWei: bigint | null,
  tokenDecimals: number | null
): boolean {
  if (amountWei !== null) {
    if (amountWei === 0n) return false
    if (tokenDecimals === null) return true
    return !isNegligibleStakingAmountWei(amountWei, tokenDecimals)
  }
  if (!amount || amount === "—") return false
  return isPlainAmountNonZeroDisplay(amount)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Accepts top-level JSON array or `{ rows | data | items | history }`. */
export function extractTxHistoryArrayFromJson(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  if (isRecord(json)) {
    const inner = json.rows ?? json.data ?? json.items ?? json.history
    if (Array.isArray(inner)) return inner
  }
  return []
}

export function extractTxHistoryTopLevelBaseBalance(json: unknown): unknown {
  if (isRecord(json)) {
    return json.base_balance ?? json.baseBalance ?? json.base_balance_wei
  }
  return undefined
}

/** Seconds since epoch; supports ISO strings and sec/ms numbers. */
export function normalizeTxHistoryTimestampSeconds(raw: unknown): number {
  if (typeof raw === "string") {
    const ms = Date.parse(raw)
    if (Number.isFinite(ms)) return Math.floor(ms / 1000)
    const n = Number(raw)
    if (Number.isFinite(n)) {
      return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n)
    }
    return 0
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 1e12 ? Math.floor(raw / 1000) : Math.floor(raw)
  }
  return 0
}

function mapTxStatusFromApi(raw: unknown): StakingTxStatus {
  const s = typeof raw === "string" ? raw.toLowerCase() : ""
  if (s === "success") return "success"
  if (s === "failed" || s === "error") return "failed"
  return "pending"
}

function normalizeMethodLookupKey(name: string): string {
  const underscored = name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
  return underscored
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
}

function prettyMethodLabel(methodRaw: string): string {
  const t = methodRaw.trim()
  if (!t) return "Other"
  return t
    .replace(/[_]+/g, " ")
    .split(/\s+/)
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ")
    .trim()
}

const METHOD_NAME_TO_STAKING: Record<string, { type: StakingTxType; label?: string }> = {
  stake: { type: "deposit", label: "Stake" },
  deposit: { type: "deposit", label: "Stake" },
  stake_affiliate: { type: "deposit", label: "Stake (affiliate)" },
  deposit_with_affiliate: { type: "deposit", label: "Stake (affiliate)" },
  /** Indexer / API sometimes sends a single smashed token (no camelCase boundaries). */
  depositwithaffiliate: { type: "deposit", label: "Stake (affiliate)" },
  unstake: { type: "withdraw", label: "Unstake" },
  withdraw: { type: "withdraw", label: "Unstake" },
  referral: { type: "referral_reward", label: "Referral Reward" },
  referral_reward: { type: "referral_reward", label: "Referral Reward" },
  reward: { type: "referral_reward", label: "Referral Reward" },
  approve: { type: "approve", label: "Approve" },
  transfer: { type: "transfer", label: "Transfer" },
  transfer_from: { type: "transfer_from", label: "Transfer From" },
  transferfrom: { type: "transfer_from", label: "Transfer From" },
  mint: { type: "mint", label: "Mint" },
  yield: { type: "yield_deposit", label: "Yield reinvest" },
  yield_deposit: { type: "yield_deposit", label: "Yield reinvest" },
  yield_reinvest: { type: "yield_deposit", label: "Yield reinvest" },
  admin: { type: "admin", label: "Admin" },
}

function stakingTypeFromMethodName(methodRaw: string): {
  type: StakingTxType
  typeLabel: string
  methodId: string
} {
  const key = normalizeMethodLookupKey(methodRaw)
  const meta = METHOD_NAME_TO_STAKING[key]
  const methodId = key || "unknown"
  if (meta) {
    return {
      type: meta.type,
      typeLabel: meta.label ?? prettyMethodLabel(methodRaw),
      methodId,
    }
  }
  return {
    type: "other",
    typeLabel: prettyMethodLabel(methodRaw),
    methodId,
  }
}

/** On-chain / indexer amounts only — never infer wei from generic `amount` / `value`. */
const EXPLICIT_AMOUNT_WEI_KEYS = [
  "amount_wei",
  "amountWei",
  "value_wei",
  "valueWei",
] as const

const EXPLICIT_FEE_WEI_KEYS = [
  "fee_amount_wei",
  "feeAmountWei",
  "fee_wei",
  "feeWei",
] as const

function coerceExplicitWeiField(raw: unknown): bigint | null {
  if (typeof raw === "bigint") return raw
  if (
    typeof raw === "number" &&
    Number.isFinite(raw) &&
    Number.isInteger(raw) &&
    Number.isSafeInteger(raw)
  ) {
    return BigInt(raw)
  }
  if (typeof raw === "string") {
    const t = raw.trim().replace(/,/g, "")
    if (!/^-?\d+$/.test(t)) return null
    try {
      return BigInt(t)
    } catch {
      return null
    }
  }
  return null
}

function readFirstExplicitWei(
  o: Record<string, unknown>,
  keys: readonly string[],
): bigint | null {
  for (const k of keys) {
    const v = o[k]
    if (v === undefined) continue
    const w = coerceExplicitWeiField(v)
    if (w !== null) return w
  }
  return null
}

function readStringField(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return ""
}

export function normalizeStakingHistoryTxHashWire(raw: string): string {
  const t = raw.trim()
  if (/^[0-9a-fA-F]{64}$/.test(t)) return `0x${t.toLowerCase()}`
  if (/^0x[0-9a-fA-F]{64}$/i.test(t)) return `0x${t.slice(2).toLowerCase()}`
  return t
}

function isPlausibleTxHash(h: string): boolean {
  const t = h.trim()
  if (/^0x[0-9a-fA-F]{64}$/i.test(t)) return true
  if (/^[0-9a-fA-F]{64}$/.test(t)) return true
  return false
}

function safeChecksumAddress(raw: string): string {
  if (!raw || !isAddress(raw)) return ""
  try {
    return getAddress(raw)
  } catch {
    return ""
  }
}

/** Merchant receipt token (e.g. MUSDC) for ERC-20 transfer rows; vault asset label for stake/unstake. */
function stakingHistoryRowSymbol(
  type: StakingTxType,
  tokenLabel: string,
  merchantTokenSymbol: string | undefined
): string {
  const m = (merchantTokenSymbol ?? "").trim()
  if ((type === "transfer" || type === "transfer_from") && m) return m
  return tokenLabel
}

function mapApiObjectToStakingHistoryRow(
  o: Record<string, unknown>,
  tokenDecimals: number,
  tokenLabel: string,
  merchantTokenSymbol: string | undefined,
  deploymentId: string
): StakingHistoryRow | null {
  const hashRaw = readStringField(o, "tx_hash", "txHash", "hash")
  if (!isPlausibleTxHash(hashRaw)) return null
  const hash = normalizeStakingHistoryTxHashWire(hashRaw)

  const methodRaw = readStringField(
    o,
    "method_name",
    "methodName",
    "method",
    "transaction_type",
    "transactionType",
    "type"
  )
  const { type, typeLabel, methodId } = stakingTypeFromMethodName(methodRaw)

  const explicitAmountWei = readFirstExplicitWei(o, EXPLICIT_AMOUNT_WEI_KEYS)
  const plainAmount = formatPlainApiAmount(
    o.amount ?? o.value ?? o.shareAmount
  )
  let amount: string | null = null
  let amountWei: bigint | null = null
  if (explicitAmountWei !== null) {
    if (isNegligibleStakingAmountWei(explicitAmountWei, tokenDecimals)) {
      amountWei = null
      amount = null
    } else {
      amountWei = explicitAmountWei
      amount = formatStakingTxAmountDisplay(explicitAmountWei, tokenDecimals)
    }
  } else if (plainAmount !== null) {
    amount = plainAmount
    amountWei = null
  }

  const explicitFeeWei = readFirstExplicitWei(o, EXPLICIT_FEE_WEI_KEYS)
  let feeAmountWei: bigint | null = null
  if (
    explicitFeeWei !== null &&
    !isNegligibleStakingAmountWei(explicitFeeWei, tokenDecimals)
  ) {
    feeAmountWei = explicitFeeWei
  }

  return {
    hash,
    type,
    typeLabel,
    amount,
    amountWei,
    feeAmountWei,
    symbol: stakingHistoryRowSymbol(type, tokenLabel, merchantTokenSymbol),
    timestamp: normalizeTxHistoryTimestampSeconds(o.timestamp),
    from: safeChecksumAddress(readStringField(o, "from_address", "fromAddress", "from")),
    to: safeChecksumAddress(readStringField(o, "to_address", "toAddress", "to")),
    methodId,
    status: mapTxStatusFromApi(o.status),
    deploymentId: deploymentId.trim(),
  }
}

export function stakingHistoryRowsFingerprint(input: StakingHistoryRow[]) {
  return input
    .map(
      row =>
        `${row.hash}-${row.status}-${row.type}-${row.amountWei?.toString() ?? ""}-${row.feeAmountWei?.toString() ?? ""}-${row.deploymentId ?? ""}`
    )
    .join("|")
}

/**
 * Sums successful deposit/withdraw **only when `amountWei` is set** (explicit on-chain
 * `*_wei` fields from the indexer). Plain API `amount` strings never contribute here.
 */
export function aggregateStakingHistoryRows(
  rows: StakingHistoryRow[]
): StakingHistoryTotals {
  let totalDepositsWei = 0n
  let totalWithdrawalsWei = 0n
  let totalFeesWei = 0n
  let lastBalanceChangeTimestamp: number | null = null

  for (const row of rows) {
    if (
      row.status !== "success" ||
      (row.type !== "deposit" && row.type !== "withdraw")
    ) {
      continue
    }

    if (lastBalanceChangeTimestamp === null) {
      lastBalanceChangeTimestamp = row.timestamp
    } else {
      lastBalanceChangeTimestamp = Math.max(
        lastBalanceChangeTimestamp,
        row.timestamp
      )
    }

    if (row.amountWei === null) continue
    if (row.type === "deposit") totalDepositsWei += row.amountWei
    else totalWithdrawalsWei += row.amountWei
    if (row.feeAmountWei !== null) totalFeesWei += row.feeAmountWei
  }

  const netDepositsWei =
    totalDepositsWei > totalWithdrawalsWei
      ? totalDepositsWei - totalWithdrawalsWei
      : 0n

  return {
    totalDepositsWei,
    totalWithdrawalsWei,
    totalFeesWei,
    netDepositsWei,
    lastBalanceChangeTimestamp,
  }
}

export type LoadStakingHistoryParams = {
  address: string
  tokenAddress: string | null
  tokenDecimals: number
  tokenLabel: string
  /** e.g. MUSDC — used as `symbol` for `transfer` / `transfer_from` rows from the tx-history API. */
  merchantTokenSymbol?: string
  /** Phase 50 — staking deployment id for this fetch (row-scoped explorer URLs). */
  deploymentId: string
  /** Pool vault for tx-history API `token` query (explicit EVM deployments); omit → legacy env vault. */
  historyVaultAddress?: string
  signal?: AbortSignal
  shallow?: boolean
  cachedLatestScannedBlock: number | null
}

export type LoadStakingHistoryResult = {
  rows: StakingHistoryRow[]
  indexerError: string | null
  indexerPartialWarning: string | null
  pnlHistoryIncomplete: boolean
  latestScannedToBlock: number | null
}

const TX_HISTORY_ORIGIN_MISSING =
  "Staking transaction history API is not configured. Set VITE_STAKING_TX_HISTORY_ORIGIN in your environment."

export async function loadStakingTransactionHistoryRows(
  params: LoadStakingHistoryParams
): Promise<LoadStakingHistoryResult> {
  const {
    address,
    tokenAddress,
    tokenDecimals,
    tokenLabel,
    merchantTokenSymbol,
    deploymentId,
    historyVaultAddress,
    signal,
    shallow,
    cachedLatestScannedBlock: _cachedLatestScannedBlock,
  } = params

  void _cachedLatestScannedBlock

  const pnlHistoryIncompleteBase = Boolean(shallow)

  if (!tokenAddress) {
    return {
      rows: [],
      indexerError: null,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: false,
      latestScannedToBlock: null,
    }
  }

  const url = stakingTxHistoryUrl(address, "transactions", historyVaultAddress ?? null)
  if (!url) {
    logStakingHistoryFailure("preflight", TX_HISTORY_ORIGIN_MISSING)
    return {
      rows: [],
      indexerError: TX_HISTORY_ORIGIN_MISSING,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: false,
      latestScannedToBlock: null,
    }
  }

  try {
    const res = await fetchWithTimeout(url, {
      signal,
      timeoutMs: 25_000,
    })

    if (!res.ok) {
      const err = `Transaction history request failed (${res.status}).`
      const httpErr = Object.assign(new Error(err), { status: res.status })
      logStakingHistoryFailure("http", err, httpErr, { status: res.status, url, deploymentId })
      return {
        rows: [],
        indexerError: err,
        indexerPartialWarning: null,
        pnlHistoryIncomplete: pnlHistoryIncompleteBase,
        latestScannedToBlock: null,
      }
    }

    const rawBody = await res.text()
    let json: unknown = null
    try {
      json = rawBody ? (JSON.parse(rawBody) as unknown) : null
    } catch {
      const err = "Invalid transaction history JSON."
      logStakingHistoryFailure("parse", err, new Error(err), { url, deploymentId })
      return {
        rows: [],
        indexerError: err,
        indexerPartialWarning: null,
        pnlHistoryIncomplete: pnlHistoryIncompleteBase,
        latestScannedToBlock: null,
      }
    }

    const rawRows = extractTxHistoryArrayFromJson(json)
    const rows: StakingHistoryRow[] = []
    for (const item of rawRows) {
      if (!isRecord(item)) continue
      const row = mapApiObjectToStakingHistoryRow(
        item,
        tokenDecimals,
        tokenLabel,
        merchantTokenSymbol,
        deploymentId
      )
      if (row) rows.push(row)
    }
    rows.sort((a, b) => b.timestamp - a.timestamp)

    return {
      rows,
      indexerError: null,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: pnlHistoryIncompleteBase,
      latestScannedToBlock: null,
    }
  } catch (e) {
    const aborted =
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && e.name === "AbortError")
    if (aborted) {
      return {
        rows: [],
        indexerError: null,
        indexerPartialWarning: null,
        pnlHistoryIncomplete: pnlHistoryIncompleteBase,
        latestScannedToBlock: null,
      }
    }
    const msg = e instanceof Error ? e.message : "Staking history load failed"
    logStakingHistoryFailure("loadStakingTransactionHistoryRows", msg, e, { url, deploymentId })
    return {
      rows: [],
      indexerError: msg,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: pnlHistoryIncompleteBase,
      latestScannedToBlock: null,
    }
  }
}

/** Phase 50 — tx explorer for a history row; prefers deployment from `deploymentId`, else legacy env URL. */
export function stakingHistoryRowTransactionExplorerUrl(row: StakingHistoryRow): string {
  const depId = row.deploymentId?.trim()
  if (depId) {
    const registry = getStakingDeploymentRegistry()
    const deployment = resolveStakingDeploymentForReconcile(registry, depId)
    const url = createDeploymentExplorerResolver(deployment).transactionUrl(row.hash)
    if (url) return url
  }
  return stakingTransactionExplorerUrl(row.hash)
}
