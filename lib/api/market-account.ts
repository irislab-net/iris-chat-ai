import { apiJson } from "@/lib/api/client"
import { hyperliquidCoin } from "@/lib/api/candles"
import { deskInstrumentFromHlCoin } from "@/lib/desk-markets-catalog"
import type { DeskPosition, DeskSide } from "@/lib/desk-mock/types"

function parseNum(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" ? value : null
}

function mapSide(raw: string | null): DeskSide {
  return raw === "short" || raw === "s" ? "short" : "long"
}

function deriveLeverage(
  size: number,
  entryPrice: number,
  marginUsd: number
): number | null {
  if (!(size > 0) || !(entryPrice > 0) || !(marginUsd > 0)) return null
  const leverage = (size * entryPrice) / marginUsd
  return Number.isFinite(leverage) && leverage > 0 ? leverage : null
}

function computeUnrealizedPnlUsd(
  side: DeskSide,
  size: number,
  entryPrice: number,
  markPrice: number
): number {
  if (!(size > 0) || !(entryPrice > 0) || !(markPrice > 0)) return 0
  const delta =
    side === "long" ? markPrice - entryPrice : entryPrice - markPrice
  return delta * size
}

function mapOpenPosition(row: Record<string, unknown>): DeskPosition | null {
  const id = readString(row, "id")
  if (!id) return null
  const instrument = readString(row, "instrument") ?? "BTC"
  const entry = parseNum(readString(row, "entry_price"))
  const size = parseNum(readString(row, "size"))
  const marginUsd = parseNum(readString(row, "margin"))
  const side = mapSide(readString(row, "side"))
  const markFromApi =
    parseNum(readString(row, "mark_price")) ||
    parseNum(readString(row, "mark"))
  const markPrice = markFromApi > 0 ? markFromApi : entry
  const takeProfitRaw =
    readString(row, "take_profit") ?? readString(row, "tp")
  const stopLossRaw =
    readString(row, "stop_loss") ??
    readString(row, "stop_price") ??
    readString(row, "sl")
  const takeProfit = takeProfitRaw != null ? parseNum(takeProfitRaw) : null
  const stopLoss = stopLossRaw != null ? parseNum(stopLossRaw) : null
  const leverageFromApi = parseNum(readString(row, "leverage"))
  const liqFromApi =
    parseNum(readString(row, "liquidation_price")) ||
    parseNum(readString(row, "liq_price"))

  return {
    id,
    instrument,
    side,
    status: "open",
    size,
    entryPrice: entry,
    markPrice,
    marginUsd,
    leverage:
      leverageFromApi > 0
        ? leverageFromApi
        : deriveLeverage(size, entry, marginUsd),
    unrealizedPnlUsd: (() => {
      const fromApi = readString(row, "unrealized_pnl")
      if (fromApi != null && fromApi !== "") return parseNum(fromApi)
      return computeUnrealizedPnlUsd(side, size, entry, markPrice)
    })(),
    realizedPnlUsd: 0,
    feeUsd: 0,
    takeProfit: takeProfit != null && takeProfit > 0 ? takeProfit : null,
    stopLoss: stopLoss != null && stopLoss > 0 ? stopLoss : null,
    liquidationPrice: liqFromApi > 0 ? liqFromApi : null,
    openedAt: readString(row, "opened_at") ?? new Date(0).toISOString(),
    closedAt: null,
  }
}

function mapClosedTrade(row: Record<string, unknown>): DeskPosition | null {
  const kind = readString(row, "kind")
  if (kind === "working") return null
  const id = readString(row, "id")
  if (!id) return null
  const exit = parseNum(readString(row, "exit_price"))
  const size = parseNum(readString(row, "size"))
  const entry = parseNum(readString(row, "entry_price"))
  const marginUsd = parseNum(readString(row, "margin"))
  return {
    id,
    instrument: readString(row, "instrument") ?? "BTC",
    side: mapSide(readString(row, "side")),
    status: "closed",
    size,
    entryPrice: entry,
    markPrice: exit,
    marginUsd,
    leverage: deriveLeverage(size, entry, marginUsd),
    unrealizedPnlUsd: 0,
    realizedPnlUsd: parseNum(readString(row, "realized_pnl")),
    feeUsd: parseNum(readString(row, "fee")),
    takeProfit: null,
    stopLoss: null,
    liquidationPrice: null,
    openedAt: readString(row, "opened_at") ?? new Date(0).toISOString(),
    closedAt: readString(row, "closed_at"),
  }
}

/** Build instrument → mid lookup from `/api/market/mids` payload keys. */
export function buildMarkPriceLookup(input: {
  prices?: Partial<Record<string, number | null>> | null
  markets?: Array<{
    instrument: string
    hlCoin?: string
    price: number
  }> | null
}): Map<string, number> {
  const out = new Map<string, number>()

  function put(key: string | null | undefined, price: number) {
    if (!key || !(price > 0) || !Number.isFinite(price)) return
    out.set(key.trim().toUpperCase(), price)
  }

  if (input.prices) {
    for (const [key, value] of Object.entries(input.prices)) {
      if (typeof value === "number") put(key, value)
    }
  }

  for (const row of input.markets ?? []) {
    put(row.instrument, row.price)
    put(row.hlCoin, row.price)
    put(deskInstrumentFromHlCoin(row.hlCoin ?? row.instrument), row.price)
  }

  return out
}

export function resolveMarkPrice(
  instrument: string,
  marks: Map<string, number>
): number | null {
  const key = instrument.trim().toUpperCase()
  if (!key) return null
  const direct = marks.get(key)
  if (direct != null) return direct

  const asDesk = deskInstrumentFromHlCoin(key)
  if (asDesk !== key) {
    const desk = marks.get(asDesk)
    if (desk != null) return desk
  }

  const hl = hyperliquidCoin(key)
  if (hl) {
    const mid = marks.get(hl)
    if (mid != null) return mid
  }

  return null
}

/** Apply live mids to open ledger rows (account API has no mark / uPnL). */
export function enrichOpenPositionsWithMarks(
  positions: DeskPosition[],
  marks: Map<string, number>
): DeskPosition[] {
  if (marks.size === 0) return positions
  return positions.map((position) => {
    if (position.status !== "open") return position
    const mark = resolveMarkPrice(position.instrument, marks)
    if (mark == null) return position
    return {
      ...position,
      markPrice: mark,
      unrealizedPnlUsd: computeUnrealizedPnlUsd(
        position.side,
        position.size,
        position.entryPrice,
        mark
      ),
      leverage:
        position.leverage ??
        deriveLeverage(position.size, position.entryPrice, position.marginUsd),
    }
  })
}

export async function fetchAccountOpenPositions(): Promise<DeskPosition[]> {
  const body = await apiJson<unknown>("/v1/market/account/positions")
  if (!Array.isArray(body)) return []
  return body
    .filter(isRecord)
    .map(mapOpenPosition)
    .filter((row): row is DeskPosition => row != null)
}

export async function fetchAccountClosedPositions(): Promise<DeskPosition[]> {
  const body = await apiJson<unknown>(
    "/v1/market/account/trades?view=history&limit=50"
  )
  if (!Array.isArray(body)) return []
  return body
    .filter(isRecord)
    .map(mapClosedTrade)
    .filter((row): row is DeskPosition => row != null)
}

export async function fetchDeskPositions(): Promise<{
  open: DeskPosition[]
  closed: DeskPosition[]
}> {
  const [open, closed] = await Promise.all([
    fetchAccountOpenPositions(),
    fetchAccountClosedPositions(),
  ])
  return { open, closed }
}
