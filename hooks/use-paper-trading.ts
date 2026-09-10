"use client"

import * as React from "react"

import type { CandleBar } from "@/lib/api/candles"
import { hyperliquidIntervalMs } from "@/lib/api/candles"
import {
  historyForSymbol,
  openOrdersForSymbol,
  positionForSymbol,
  type MarginMode,
  type OpenPaperTradeInput,
  type PaperClosedTrade,
  type PaperOrder,
  type PaperPosition,
  type PaperState,
} from "@/lib/paper-trading"
import {
  getPaperServerSnapshot,
  getPaperSnapshot,
  paperAddIsolatedMargin,
  paperCancelOrder,
  paperChangeLeverage,
  paperClosePosition,
  paperModifyPosition,
  paperOpenTrade,
  paperReconcile,
  paperReconcileAway,
  paperRemoveIsolatedMargin,
  subscribePaperStore,
} from "@/lib/paper-trading/store"

type TicketInput = Omit<OpenPaperTradeInput, "symbol">

type PaperTradingApi = {
  ready: boolean
  state: PaperState
  position: PaperPosition | undefined
  orders: PaperOrder[]
  history: PaperClosedTrade[]
  openTrade: (
    input: TicketInput
  ) => { ok: true; positionId?: string } | { ok: false; error: string }
  closePosition: (markPrice: number) => void
  modifyPosition: (mods: {
    stopLoss?: number | null
    takeProfit?: number | null
  }) => { ok: true } | { ok: false; error: string }
  cancelOrder: (orderId: string) => { ok: true } | { ok: false; error: string }
  addIsolatedMargin: (
    positionId: string,
    amount: number
  ) => { ok: true } | { ok: false; error: string }
  removeIsolatedMargin: (
    positionId: string,
    amount: number
  ) => { ok: true } | { ok: false; error: string }
  changeLeverage: (
    positionId: string,
    leverage: number
  ) => { ok: true } | { ok: false; error: string }
  /** Live chart bars — pass the chart timeframe interval. */
  reconcileLive: (bars: CandleBar[], timeframe: string) => void
}

function usePaperTrading(symbol: string): PaperTradingApi {
  const state = React.useSyncExternalStore(
    subscribePaperStore,
    getPaperSnapshot,
    getPaperServerSnapshot
  )
  const symbolKey = symbol.trim().toUpperCase()
  const ready = typeof window !== "undefined"

  React.useEffect(() => {
    if (!ready) return
    const pos = positionForSymbol(getPaperSnapshot(), symbolKey)
    if (!pos) return
    const ac = new AbortController()
    void paperReconcileAway(symbolKey, ac.signal)
    return () => ac.abort()
  }, [ready, symbolKey, state.positions.length])

  const openTrade = React.useCallback(
    (
      input: TicketInput
    ):
      | { ok: true; positionId?: string }
      | { ok: false; error: string } => {
      const result = paperOpenTrade({ ...input, symbol: symbolKey })
      if (!result.ok) return { ok: false, error: result.error }
      return { ok: true, positionId: result.position?.id }
    },
    [symbolKey]
  )

  const closePosition = React.useCallback(
    (markPrice: number) => {
      const pos = positionForSymbol(getPaperSnapshot(), symbolKey)
      if (!pos) return
      paperClosePosition(pos.id, markPrice)
    },
    [symbolKey]
  )

  const modifyPosition = React.useCallback(
    (mods: { stopLoss?: number | null; takeProfit?: number | null }) => {
      const pos = positionForSymbol(getPaperSnapshot(), symbolKey)
      if (!pos) return { ok: false as const, error: "No open position" }
      return paperModifyPosition(pos.id, mods)
    },
    [symbolKey]
  )

  const cancelOrder = React.useCallback((orderId: string) => {
    return paperCancelOrder(orderId)
  }, [])

  const addIsolatedMargin = React.useCallback(
    (positionId: string, amount: number) =>
      paperAddIsolatedMargin(positionId, amount),
    []
  )

  const removeIsolatedMargin = React.useCallback(
    (positionId: string, amount: number) =>
      paperRemoveIsolatedMargin(positionId, amount),
    []
  )

  const changeLeverage = React.useCallback(
    (positionId: string, leverage: number) =>
      paperChangeLeverage(positionId, leverage),
    []
  )

  const reconcileLive = React.useCallback(
    (bars: CandleBar[], timeframe: string) => {
      paperReconcile(symbolKey, bars, hyperliquidIntervalMs(timeframe))
    },
    [symbolKey]
  )

  return {
    ready,
    state,
    position: positionForSymbol(state, symbolKey),
    orders: openOrdersForSymbol(state, symbolKey),
    history: historyForSymbol(state, symbolKey),
    openTrade,
    closePosition,
    modifyPosition,
    cancelOrder,
    addIsolatedMargin,
    removeIsolatedMargin,
    changeLeverage,
    reconcileLive,
  }
}

export { usePaperTrading }
export type { MarginMode }
