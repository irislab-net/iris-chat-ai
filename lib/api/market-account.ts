import { apiJson } from "@/lib/api/client"
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

function mapOpenPosition(row: Record<string, unknown>): DeskPosition | null {
  const id = readString(row, "id")
  if (!id) return null
  const instrument = readString(row, "instrument") ?? "BTC"
  const entry = parseNum(readString(row, "entry_price"))
  return {
    id,
    instrument,
    side: mapSide(readString(row, "side")),
    status: "open",
    size: parseNum(readString(row, "size")),
    entryPrice: entry,
    markPrice: entry,
    marginUsd: parseNum(readString(row, "margin")),
    unrealizedPnlUsd: 0,
    realizedPnlUsd: 0,
    feeUsd: 0,
    takeProfit: null,
    stopLoss: null,
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
  return {
    id,
    instrument: readString(row, "instrument") ?? "BTC",
    side: mapSide(readString(row, "side")),
    status: "closed",
    size: parseNum(readString(row, "size")),
    entryPrice: parseNum(readString(row, "entry_price")),
    markPrice: exit,
    marginUsd: parseNum(readString(row, "margin")),
    unrealizedPnlUsd: 0,
    realizedPnlUsd: parseNum(readString(row, "realized_pnl")),
    feeUsd: parseNum(readString(row, "fee")),
    takeProfit: null,
    stopLoss: null,
    openedAt: readString(row, "opened_at") ?? new Date(0).toISOString(),
    closedAt: readString(row, "closed_at"),
  }
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
