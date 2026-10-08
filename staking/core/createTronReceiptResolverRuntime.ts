import type { ChainReceiptResolver, TxReceiptSummary } from "@/staking/core/persistenceTypes"
import type { TronHttpProvider } from "@/staking/core/tronProviderTypes"
import type { StakingDeploymentConfig } from "@/staking/core/types"

function normalizeTronTxId(raw: string): string {
  const t = raw.trim()
  const hex = t.startsWith("0x") || t.startsWith("0X") ? t.slice(2) : t
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("[staking] Tron gettransactioninfobyid expects a 64-char hex tx id (no EVM semantics)")
  }
  return hex
}

function mapTronTxInfoToSummary(info: unknown): TxReceiptSummary {
  if (info === null || typeof info !== "object") {
    return { status: "pending" }
  }
  const o = info as Record<string, unknown>
  if (Object.keys(o).length === 0) {
    return { status: "pending" }
  }
  if (o.result === "FAILED") {
    return { status: "failure", rawStatus: o.result }
  }
  const rep = o.receipt as { result?: string } | undefined
  if (rep?.result === "SUCCESS") {
    return { status: "success", rawStatus: rep.result }
  }
  if (typeof rep?.result === "string" && rep.result.length > 0 && rep.result !== "SUCCESS") {
    return { status: "failure", rawStatus: rep.result }
  }
  if (typeof o.blockTimeStamp === "number" && o.blockTimeStamp > 0 && typeof o.id === "string" && o.id) {
    return { status: "success", rawStatus: o }
  }
  return { status: "pending" }
}

/**
 * Phase 21 — **deployment-bound** Tron receipt resolver (passive reads only).
 * Uses Tron FullNode `wallet/gettransactioninfobyid` — no ethers, no EVM fallback.
 */
export function buildTronChainReceiptResolver(
  _deployment: StakingDeploymentConfig,
  http: TronHttpProvider
): ChainReceiptResolver {
  return {
    family: "tron",
    async getReceiptSummary(txHash: string, signal?: AbortSignal): Promise<TxReceiptSummary | null> {
      const value = normalizeTronTxId(txHash)
      const info = await http.postWalletJson<unknown>(
        "/wallet/gettransactioninfobyid",
        { value },
        signal
      )
      return mapTronTxInfoToSummary(info)
    },
  }
}
