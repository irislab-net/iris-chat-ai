import { chatApiFetch } from "@/lib/api/chat-client"
import { toChatApiSymbol, unwrapChatPayload } from "@/lib/api/chat"
import type { TradeSignalItem } from "@/lib/api/types"
import type { PaperSide } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"

export type TradeSignalListResult = {
  items: TradeSignalItem[]
  limit: number
  offset: number
  total: number
}

export type FetchChatSignalsInput = {
  sessionId?: string
  outcome?: "signal" | "no_trade"
  finalStatus?: "open" | "tp_hit" | "sl_hit" | "expired"
  limit?: number
  offset?: number
  signal?: AbortSignal
}

function throwChatApiError(
  res: Response,
  body: unknown,
  fallback: string
): never {
  const payload = body as { error?: string; code?: string }
  throw Object.assign(new Error(payload.error || fallback), {
    status: res.status,
    body,
    code: payload.code,
  })
}

function normalizeTradeSignalList(body: unknown): TradeSignalListResult {
  const payload = unwrapChatPayload<{
    signals?: TradeSignalListResult
  }>(body)
  const signals = payload.signals ?? (payload as TradeSignalListResult)
  if (!signals || !Array.isArray(signals.items)) {
    return { items: [], limit: 0, offset: 0, total: 0 }
  }
  return {
    items: signals.items.filter(
      (item): item is TradeSignalItem =>
        Boolean(item) &&
        typeof item.uid === "string" &&
        typeof item.session_id === "string" &&
        typeof item.content_hash === "string"
    ),
    limit: Number(signals.limit) || 0,
    offset: Number(signals.offset) || 0,
    total: Number(signals.total) || signals.items.length,
  }
}

function normalizeDirection(value: unknown): PaperSide | null {
  if (typeof value !== "string") return null
  const key = value.trim().toUpperCase()
  if (key === "LONG" || key === "BUY") return "LONG"
  if (key === "SHORT" || key === "SELL") return "SHORT"
  return null
}

function normalizePrice(value: unknown): number | null {
  const price = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return price
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** Map a verified stored signal into a display ticket; null when unsafe or incomplete. */
export function tradeSignalToPaperTicket(
  item: TradeSignalItem
): PaperTradeTicket | null {
  if (!item.hash_ok || item.outcome !== "signal") return null

  const symbolRaw =
    typeof item.symbol === "string" ? item.symbol.trim().toUpperCase() : ""
  if (!symbolRaw) return null

  const side = normalizeDirection(item.direction)
  const entry = normalizePrice(item.entry)
  const stopLoss = normalizePrice(item.stop_loss)
  const takeProfit = normalizePrice(item.take_profit)
  if (!side || entry == null || stopLoss == null || takeProfit == null) {
    return null
  }

  const leverageRaw =
    typeof item.leverage === "number" ? item.leverage : Number(item.leverage)
  const leverage =
    Number.isFinite(leverageRaw) && leverageRaw > 0 ? leverageRaw : 0

  const timeHorizon = optionalTrimmedString(item.time_horizon)
  const entryReason = optionalTrimmedString(item.entry_reason)
  const stopLossReason = optionalTrimmedString(item.stop_loss_reason)
  const takeProfitReason = optionalTrimmedString(item.take_profit_reason)

  return {
    symbol: toChatApiSymbol(symbolRaw),
    side,
    quantity: 0,
    markPrice: entry,
    stopLoss,
    takeProfit,
    leverage,
    setup: optionalTrimmedString(item.setup) ?? "",
    thesis: optionalTrimmedString(item.thesis) ?? "",
    ...(timeHorizon ? { timeHorizon } : {}),
    ...(entryReason ? { entryReason } : {}),
    ...(stopLossReason ? { stopLossReason } : {}),
    ...(takeProfitReason ? { takeProfitReason } : {}),
  }
}

export async function fetchChatSignals(
  input?: FetchChatSignalsInput
): Promise<TradeSignalListResult> {
  const params = new URLSearchParams()
  if (input?.sessionId) params.set("session_id", input.sessionId)
  if (input?.outcome) params.set("outcome", input.outcome)
  if (input?.finalStatus) params.set("final_status", input.finalStatus)
  if (input?.limit != null) params.set("limit", String(input.limit))
  if (input?.offset != null) params.set("offset", String(input.offset))
  const query = params.toString()
  const res = await chatApiFetch(query ? `/signals?${query}` : "/signals", {
    signal: input?.signal,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throwChatApiError(res, body, `signals failed ${res.status}`)
  }
  return normalizeTradeSignalList(body)
}

export async function fetchChatSignal(
  uid: string,
  input?: { contentHash?: string; signal?: AbortSignal }
): Promise<TradeSignalItem> {
  const params = new URLSearchParams()
  if (input?.contentHash) params.set("content_hash", input.contentHash)
  const query = params.toString()
  const path = `/signals/${encodeURIComponent(uid)}${query ? `?${query}` : ""}`
  const res = await chatApiFetch(path, { signal: input?.signal })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throwChatApiError(
      res,
      body,
      res.status === 409
        ? "signal hash mismatch"
        : `signal fetch failed ${res.status}`
    )
  }
  const payload = unwrapChatPayload<{ signal?: TradeSignalItem }>(body)
  const signal = payload.signal
  if (
    !signal ||
    typeof signal.uid !== "string" ||
    typeof signal.session_id !== "string" ||
    typeof signal.content_hash !== "string"
  ) {
    throw Object.assign(new Error("invalid signal payload"), {
      status: 200,
      body,
      code: "bad_request",
    })
  }
  return signal
}
