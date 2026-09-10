import {
  fetchHyperliquidCandlesSince,
  hyperliquidIntervalMs,
  type CandleBar,
} from "@/lib/api/candles"
import {
  closePaperPosition,
  emptyPaperState,
  markPaperPrice,
  modifyPaperOrder,
  modifyPaperPosition,
  openPaperTrade,
  cancelPaperOrder,
  placePaperOrder,
  addIsolatedMargin,
  removeIsolatedMargin,
  changePositionLeverage,
  PAPER_RECONCILE_TIMEFRAME,
  reconcilePaperBars,
  resetPaperAccountToBudget,
  validatePaperBudget,
} from "@/lib/paper-trading/engine"
import {
  clearPaperStateStorage,
  loadPaperState,
  savePaperState,
} from "@/lib/paper-trading/persist"
import type {
  OpenPaperTradeInput,
  PaperOrder,
  PaperPosition,
  PaperState,
  PlacePaperOrderInput,
} from "@/lib/paper-trading/types"

type Listener = () => void

let memory: PaperState | null = null
const listeners = new Set<Listener>()
const awayInflight = new Set<string>()

function read(): PaperState {
  if (memory) return memory
  if (typeof window === "undefined") return emptyPaperState()
  memory = loadPaperState()
  return memory
}

function write(next: PaperState) {
  memory = next
  savePaperState(next)
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getServerSnapshot(): PaperState {
  return emptyPaperState()
}

export function getPaperSnapshot(): PaperState {
  return read()
}

export function replacePaperState(next: PaperState): void {
  write(next)
}

export function setPaperBudget(
  budget: number
): { ok: true; state: PaperState } | { ok: false; error: string } {
  const validation = validatePaperBudget(budget)
  if (validation) return { ok: false, error: validation }
  const next = resetPaperAccountToBudget(read(), budget)
  write(next)
  return { ok: true, state: next }
}

/** Logout / session reset — drop in-memory cache and persisted demo desk state. */
export function resetPaperStore(): void {
  awayInflight.clear()
  memory = emptyPaperState()
  clearPaperStateStorage()
  for (const listener of listeners) listener()
}

export function subscribePaperStore(listener: Listener): () => void {
  return subscribe(listener)
}

export function getPaperServerSnapshot(): PaperState {
  return getServerSnapshot()
}

export function paperOpenTrade(
  input: OpenPaperTradeInput
):
  | { ok: true; state: PaperState; position?: PaperPosition }
  | { ok: false; error: string } {
  const result = openPaperTrade(read(), input)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true, state: result.state, position: result.position }
}

export function paperPlaceOrder(
  input: PlacePaperOrderInput
):
  | { ok: true; state: PaperState; order?: PaperOrder }
  | { ok: false; error: string; state: PaperState; order?: PaperOrder } {
  const result = placePaperOrder(read(), input)
  if (result.state !== read()) write(result.state)
  if (result.error) {
    return {
      ok: false,
      error: result.error,
      state: result.state,
      order: result.order,
    }
  }
  return { ok: true, state: result.state, order: result.order }
}

export function paperClosePosition(positionId: string, markPrice: number): void {
  write(closePaperPosition(read(), positionId, markPrice))
}

export function paperModifyPosition(
  positionId: string,
  mods: { stopLoss?: number | null; takeProfit?: number | null }
): { ok: true } | { ok: false; error: string } {
  const result = modifyPaperPosition(read(), positionId, mods)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true }
}

export function paperCancelOrder(
  orderId: string
): { ok: true } | { ok: false; error: string } {
  const result = cancelPaperOrder(read(), orderId)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true }
}

export function paperModifyOrder(
  orderId: string,
  mods: { triggerPrice?: number; size?: number; price?: number }
): { ok: true; order?: PaperOrder } | { ok: false; error: string } {
  const result = modifyPaperOrder(read(), orderId, mods)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true, order: result.order }
}

export function paperAddIsolatedMargin(
  positionId: string,
  amount: number
): { ok: true } | { ok: false; error: string } {
  const result = addIsolatedMargin(read(), positionId, amount)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true }
}

export function paperRemoveIsolatedMargin(
  positionId: string,
  amount: number
): { ok: true } | { ok: false; error: string } {
  const result = removeIsolatedMargin(read(), positionId, amount)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true }
}

export function paperChangeLeverage(
  positionId: string,
  leverage: number
): { ok: true } | { ok: false; error: string } {
  const result = changePositionLeverage(read(), positionId, leverage)
  if (result.error) return { ok: false, error: result.error }
  write(result.state)
  return { ok: true }
}

export function paperApplyMark(symbol: string, price: number): void {
  const current = read()
  const next = markPaperPrice(current, symbol, price)
  if (
    JSON.stringify(next.positions) === JSON.stringify(current.positions) &&
    JSON.stringify(next.orders) === JSON.stringify(current.orders) &&
    JSON.stringify(next.history) === JSON.stringify(current.history) &&
    JSON.stringify(next.account) === JSON.stringify(current.account)
  ) {
    return
  }
  write(next)
}

/**
 * Live-path reconcile against bars already in memory (chart stream).
 * Uses 1m interval semantics only when bars are 1m; for desk timeframe
 * streams, pass the matching intervalMs via paperReconcileWithInterval.
 */
export function paperReconcile(
  symbol: string,
  bars: CandleBar[],
  intervalMs = hyperliquidIntervalMs(PAPER_RECONCILE_TIMEFRAME)
): void {
  if (bars.length === 0) return
  const current = read()
  const next = reconcilePaperBars(current, symbol, bars, { intervalMs })
  if (
    JSON.stringify(next.positions) === JSON.stringify(current.positions) &&
    JSON.stringify(next.orders) === JSON.stringify(current.orders) &&
    JSON.stringify(next.history) === JSON.stringify(current.history) &&
    JSON.stringify(next.account) === JSON.stringify(current.account)
  ) {
    return
  }
  write(next)
}

/**
 * Browser-return reconciliation: fetch real historical candles from
 * lastCheckedAt → now via existing Hyperliquid candleSnapshot, then replay.
 */
export async function paperReconcileAway(
  symbol: string,
  signal?: AbortSignal
): Promise<void> {
  const key = symbol.trim().toUpperCase()
  if (awayInflight.has(key)) return
  const current = read()
  const pos = current.positions.find((p) => p.symbol === key)
  if (!pos) return

  awayInflight.add(key)
  try {
    const now = Date.now()
    const sinceMs = pos.lastCheckedAt
    if (!(now > sinceMs)) return

    const bars = await fetchHyperliquidCandlesSince({
      symbol: key,
      timeframe: PAPER_RECONCILE_TIMEFRAME,
      sinceMs,
      endTime: now,
      signal,
    })

    if (signal?.aborted) return

    // Re-read after await — another path may have closed the position.
    const latest = read()
    const still = latest.positions.find((p) => p.id === pos.id)
    if (!still) return

    const intervalMs = hyperliquidIntervalMs(PAPER_RECONCILE_TIMEFRAME)
    const next = reconcilePaperBars(latest, key, bars, { intervalMs, now })
    if (
      JSON.stringify(next.positions) === JSON.stringify(latest.positions) &&
      JSON.stringify(next.orders) === JSON.stringify(latest.orders) &&
      JSON.stringify(next.history) === JSON.stringify(latest.history)
    ) {
      return
    }
    write(next)
  } catch {
    // Network failure — leave position open; live path may still mark.
  } finally {
    awayInflight.delete(key)
  }
}
