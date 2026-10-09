/**
 * Tron-only staking Activity history via TronGrid-compatible TRC-20 index HTTP.
 * EVM paths stay in `stakingEtherscanHistory.ts` — no shared generic chain layer.
 */

import { STAKING_TRON_TX_HISTORY_GRID_API_URL } from "@/staking/config"
import { fetchWithTimeout } from "@/lib/fetchWithTimeout"
import type {
  LoadStakingHistoryResult,
  StakingHistoryRow,
  StakingTxStatus,
  StakingTxType,
} from "@/staking/execution"
import {
  formatStakingTxAmountDisplay,
  isNegligibleStakingAmountWei,
  logStakingHistoryConsoleError,
  normalizeStakingHistoryTxHashWire,
  normalizeTxHistoryTimestampSeconds,
} from "@/staking/execution"
import type { StakingDeploymentConfig } from "@/staking/core/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function tronHistoryGridBase(): string {
  const raw = STAKING_TRON_TX_HISTORY_GRID_API_URL?.trim()
  if (raw) return raw.replace(/\/$/, "")
  return "https://api.trongrid.io"
}

async function tronResolveAddressHex41(
  fullNodeHttpBase: string,
  base58: string,
  signal?: AbortSignal
): Promise<string | null> {
  const base = fullNodeHttpBase.trim().replace(/\/$/, "")
  const res = await fetchWithTimeout(`${base}/wallet/getaccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: base58.trim(), visible: true }),
    signal,
    timeoutMs: 12_000,
  })
  if (!res.ok) return null
  let j: unknown
  try {
    j = await res.json()
  } catch {
    return null
  }
  if (!isRecord(j)) return null
  const raw = j.address
  if (typeof raw !== "string") return null
  const h = raw.trim().replace(/^0x/i, "")
  if (!/^41[0-9a-fA-F]{40}$/.test(h)) return null
  return h.toLowerCase()
}

function tronTransferStatus(o: Record<string, unknown>): StakingTxStatus {
  const ret = o.ret
  if (Array.isArray(ret) && ret.length > 0 && isRecord(ret[0])) {
    const cr = ret[0].contractRet
    if (typeof cr === "string" && cr.trim().toUpperCase() !== "SUCCESS") {
      return "failed"
    }
  }
  const r = typeof o.result === "string" ? o.result.toUpperCase() : ""
  if (r === "FAILED" || r === "REVERT") return "failed"
  if (o.revert === true) return "failed"
  return "success"
}

function rowSymbol(type: StakingTxType, tokenLabel: string, merchant?: string): string {
  const m = (merchant ?? "").trim()
  if ((type === "transfer" || type === "transfer_from") && m) return m
  return tokenLabel
}

function classifyTronTrc20(
  from: string,
  to: string,
  wallet: string,
  vault: string
): { type: StakingTxType; typeLabel: string; methodId: string } {
  const f = from.trim()
  const t = to.trim()
  const w = wallet.trim()
  const v = vault.trim()
  if (t === v && f === w) {
    return { type: "deposit", typeLabel: "Stake", methodId: "trc20_transfer" }
  }
  if (f === v && t === w) {
    return { type: "withdraw", typeLabel: "Unstake", methodId: "trc20_transfer" }
  }
  return { type: "transfer", typeLabel: "Transfer", methodId: "trc20_transfer" }
}

function mapTronGridItemToRow(
  o: Record<string, unknown>,
  ctx: {
    walletBase58: string
    vaultBase58: string
    tokenDecimals: number
    tokenLabel: string
    merchantTokenSymbol?: string
    deploymentId: string
  }
): StakingHistoryRow | null {
  const tidRaw = typeof o.transaction_id === "string" ? o.transaction_id : ""
  const hash = normalizeStakingHistoryTxHashWire(tidRaw)
  if (!/^0x[0-9a-f]{64}$/.test(hash)) return null

  const from = typeof o.from === "string" ? o.from.trim() : ""
  const to = typeof o.to === "string" ? o.to.trim() : ""
  if (!from || !to) return null

  const { type, typeLabel, methodId } = classifyTronTrc20(
    from,
    to,
    ctx.walletBase58,
    ctx.vaultBase58
  )

  const valueRaw = typeof o.value === "string" ? o.value.trim().replace(/,/g, "") : ""
  let amountWei: bigint | null = null
  let amount: string | null = null
  if (/^-?\d+$/.test(valueRaw)) {
    try {
      amountWei = BigInt(valueRaw)
    } catch {
      amountWei = null
    }
  }
  if (amountWei !== null) {
    if (isNegligibleStakingAmountWei(amountWei, ctx.tokenDecimals)) {
      amountWei = null
      amount = null
    } else {
      amount = formatStakingTxAmountDisplay(amountWei, ctx.tokenDecimals)
    }
  }

  return {
    hash,
    type,
    typeLabel,
    amount,
    amountWei,
    feeAmountWei: null,
    symbol: rowSymbol(type, ctx.tokenLabel, ctx.merchantTokenSymbol),
    timestamp: normalizeTxHistoryTimestampSeconds(o.block_timestamp),
    from,
    to,
    methodId,
    status: tronTransferStatus(o),
    deploymentId: ctx.deploymentId.trim(),
  }
}

export type LoadTronStakingHistoryParams = {
  deployment: StakingDeploymentConfig
  walletBase58: string
  tokenContractBase58: string
  vaultBase58: string
  tokenDecimals: number
  tokenLabel: string
  merchantTokenSymbol?: string
  deploymentId: string
  signal?: AbortSignal
  shallow?: boolean
}

export async function loadTronStakingTransactionHistoryRows(
  params: LoadTronStakingHistoryParams
): Promise<LoadStakingHistoryResult> {
  const {
    deployment,
    walletBase58,
    tokenContractBase58,
    vaultBase58,
    tokenDecimals,
    tokenLabel,
    merchantTokenSymbol,
    deploymentId,
    signal,
    shallow,
  } = params

  const pnlHistoryIncompleteBase = Boolean(shallow)
  const rpcBase = deployment.rpc?.http?.trim()
  if (!rpcBase) {
    logStakingHistoryConsoleError(
      "loadTronStakingTransactionHistoryRows",
      "Tron deployment has no HTTP RPC URL",
      undefined
    )
    return {
      rows: [],
      indexerError: "Tron deployment has no HTTP RPC URL.",
      indexerPartialWarning: null,
      pnlHistoryIncomplete: false,
      latestScannedToBlock: null,
    }
  }

  let tokenHex41: string | null = null
  try {
    tokenHex41 = await tronResolveAddressHex41(rpcBase, tokenContractBase58, signal)
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
    const msg = e instanceof Error ? e.message : "Could not resolve TRC20 contract id"
    logStakingHistoryConsoleError(
      "loadTronStakingTransactionHistoryRows.contractHex",
      msg,
      e
    )
    return {
      rows: [],
      indexerError: msg,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: pnlHistoryIncompleteBase,
      latestScannedToBlock: null,
    }
  }

  if (!tokenHex41) {
    return {
      rows: [],
      indexerError: "Could not resolve TRC20 contract id from full node.",
      indexerPartialWarning: null,
      pnlHistoryIncomplete: pnlHistoryIncompleteBase,
      latestScannedToBlock: null,
    }
  }

  const grid = tronHistoryGridBase()
  const url = `${grid}/v1/accounts/${encodeURIComponent(
    walletBase58.trim()
  )}/transactions/trc20?only_confirmed=true&limit=200&contract_address=${encodeURIComponent(
    tokenHex41
  )}`

  try {
    const res = await fetchWithTimeout(url, {
      signal,
      timeoutMs: 25_000,
    })
    if (!res.ok) {
      const err = `Tron transaction history request failed (${res.status}).`
      const httpErr = Object.assign(new Error(err), { status: res.status })
      logStakingHistoryConsoleError("loadTronStakingTransactionHistoryRows.http", err, httpErr, {
        status: res.status,
        url,
        deploymentId,
      })
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
      const err = "Invalid Tron transaction history JSON."
      logStakingHistoryConsoleError(
        "loadTronStakingTransactionHistoryRows.parse",
        err,
        new Error(err),
        { url, deploymentId }
      )
      return {
        rows: [],
        indexerError: err,
        indexerPartialWarning: null,
        pnlHistoryIncomplete: pnlHistoryIncompleteBase,
        latestScannedToBlock: null,
      }
    }

    const root = isRecord(json) ? json : {}
    const data = root.data
    const rawRows = Array.isArray(data) ? data : []
    const rows: StakingHistoryRow[] = []
    const ctx = {
      walletBase58,
      vaultBase58,
      tokenDecimals,
      tokenLabel,
      merchantTokenSymbol,
      deploymentId,
    }
    for (const item of rawRows) {
      if (!isRecord(item)) continue
      const row = mapTronGridItemToRow(item, ctx)
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
    const msg = e instanceof Error ? e.message : "Tron staking history load failed"
    logStakingHistoryConsoleError("loadTronStakingTransactionHistoryRows", msg, e, {
      url,
      deploymentId,
    })
    return {
      rows: [],
      indexerError: msg,
      indexerPartialWarning: null,
      pnlHistoryIncomplete: pnlHistoryIncompleteBase,
      latestScannedToBlock: null,
    }
  }
}
