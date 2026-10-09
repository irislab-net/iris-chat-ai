import { stakingTxHistoryUrl } from "@/constants/stakingVaultConfig"
import {
  extractTxHistoryArrayFromJson,
  extractTxHistoryTopLevelBaseBalance,
  normalizeTxHistoryTimestampSeconds,
} from "@/staking/execution"
import { fetchWithTimeout } from "@/lib/fetchWithTimeout"
import { logger } from "@/lib/logger"
import { reportIndexerNetworkFailure } from "@/lib/networkErrors"
import { STAKING_CHAIN_ID } from "@/constants/stakingVaultConfig"
import { formatPlainApiAmount } from "@/lib/plainDecimalAmount"

export type AffiliateHistoryRow = {
  hash: string
  typeLabel: string
  amount: string
  symbol: string
  timestamp: number
  from: string
  to: string
  status: "success" | "failed" | "pending"
}

export type AffiliateHistoryResult = {
  rows: AffiliateHistoryRow[]
  baseBalanceRaw: unknown
}

function mapStatus(raw: string): "success" | "failed" | "pending" {
  const s = raw.toLowerCase()
  if (s === "success") return "success"
  if (s === "failed" || s === "error") return "failed"
  return "pending"
}

function titleCaseType(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ")
    .trim() || "Affiliate"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readStringField(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return ""
}

function affiliateAmountDisplay(o: Record<string, unknown>): string {
  const raw = o.amount ?? o.shareAmount
  return formatPlainApiAmount(raw) ?? "—"
}

function affiliateTypeLabel(o: Record<string, unknown>): string {
  const method = readStringField(o, "method_name", "methodName", "method")
  if (method) return titleCaseType(method.replace(/_/g, " "))
  const typeRaw = readStringField(o, "type")
  if (typeRaw) return titleCaseType(typeRaw)
  return "Affiliate"
}

export function parseAffiliateHistoryResponse(
  json: unknown,
  symbol: string
): AffiliateHistoryRow[] {
  const items = Array.isArray(json) ? json : extractTxHistoryArrayFromJson(json)
  const rows: AffiliateHistoryRow[] = []
  for (const item of items) {
    if (!isRecord(item)) continue
    const o = item
    const txHash = readStringField(o, "tx_hash", "txHash", "hash")
    if (!txHash.startsWith("0x") || txHash.length < 66) continue

    const timestamp = normalizeTxHistoryTimestampSeconds(o.timestamp)
    const amountStr = affiliateAmountDisplay(o)
    const typeLabel = affiliateTypeLabel(o)
    const from = readStringField(o, "from_address", "fromAddress", "from")
    const to = readStringField(o, "to_address", "toAddress", "to")
    const statusRaw = readStringField(o, "status")

    rows.push({
      hash: txHash,
      typeLabel,
      amount: amountStr,
      symbol,
      timestamp,
      from,
      to,
      status: mapStatus(statusRaw),
    })
  }
  return rows
}

export async function fetchAffiliateTxHistory(
  walletAddress: string,
  symbol: string,
  signal?: AbortSignal,
  /** EVM pool vault for tx-history `token` param; invalid/absent → legacy env vault. */
  poolVaultAddress?: string | null
): Promise<AffiliateHistoryResult> {
  const url = stakingTxHistoryUrl(walletAddress, "affiliate", poolVaultAddress ?? null)
  if (!url) return { rows: [], baseBalanceRaw: undefined }
  const res = await fetchWithTimeout(url, {
    signal,
    timeoutMs: 25_000,
  })
  if (!res.ok) {
    const err = Object.assign(new Error(`Affiliate history request failed (${res.status})`), {
      status: res.status,
    })
    reportIndexerNetworkFailure({
      error: err,
      url,
      chainId: STAKING_CHAIN_ID,
      httpStatus: res.status,
      endpointType: "api",
    })
    throw err
  }
  const rawBody = await res.text()
  logger.log("[affiliate-tx-history]", rawBody)
  let json: unknown = null
  try {
    json = rawBody ? (JSON.parse(rawBody) as unknown) : null
  } catch (parseErr) {
    const err = new Error("Invalid affiliate history JSON")
    reportIndexerNetworkFailure({
      error: parseErr instanceof Error ? parseErr : err,
      url,
      chainId: STAKING_CHAIN_ID,
      endpointType: "api",
    })
    throw err
  }
  const historyPayload = extractTxHistoryArrayFromJson(json)
  const baseBalanceRaw = Array.isArray(json)
    ? undefined
    : extractTxHistoryTopLevelBaseBalance(json)
  logger.log("[affiliate-tx-history]", { rawBody, base_balance: baseBalanceRaw })
  return {
    rows: parseAffiliateHistoryResponse(historyPayload, symbol),
    baseBalanceRaw,
  }
}
