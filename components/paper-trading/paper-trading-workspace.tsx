"use client"

/**
 * Paper trading workspace layout adapted from OpenCharts TradingPage (MIT).
 * Chart-dominant terminal: LWC chart + draft bracket + bottom Positions/History.
 */
import * as React from "react"
import { XIcon } from "lucide-react"

import { TicketSlotPortal } from "@/components/app-shell/ticket-slot"
import { useAuth } from "@/components/auth/auth-provider"
import { BottomTradingPanel } from "@/components/paper-trading/bottom-panel"
import {
  showPositionOpenedNotice,
  useTradeHistoryNotifications,
} from "@/components/paper-trading/trade-notifications"
import {
  ChartPaneToolbar,
  type ChartPaneView,
} from "@/components/paper-trading/chart-pane-toolbar"
import type { ChartOverlayToolState } from "@/components/paper-trading/chart-overlay-toggles"
import { DeskChrome } from "@/components/paper-trading/desk-chrome"
import { ChartPaneSkeleton } from "@/components/paper-trading/desk-skeleton"
import {
  MobileDeskLayout,
  type MobileDeskPane,
} from "@/components/paper-trading/mobile-desk-layout"
import { DemoBudgetDialog } from "@/components/paper-trading/demo-budget-dialog"
import { RealTradingWishlistDialog } from "@/components/paper-trading/real-trading-gate"
import { OrderBook } from "@/components/paper-trading/order-book"
import {
  OrderTicket,
  type TicketSubmitInput,
} from "@/components/paper-trading/order-ticket"
import { paperMarketBySymbol } from "@/components/paper-trading/paper-markets"
import { BracketApplyBanner } from "@/components/paper-trading/bracket-apply-banner"
import {
  broadcastDeskSymbol,
  subscribeDeskSymbolChange,
} from "@/lib/paper-trading/desk-symbol"
import { summarizePaperAccount } from "@/lib/paper-trading/account-context"
import { broadcastDeskContext } from "@/lib/paper-trading/desk-context"
import { getPaperStartingBalance } from "@/lib/paper-trading"
import { getPaperSnapshot } from "@/lib/paper-trading/store"
import {
  subscribeCopilotBracketPreview,
  subscribeCopilotChartIndicator,
  subscribeCopilotClearChartIndicators,
  subscribeCopilotDeskPane,
  subscribeCopilotGhostTrade,
  subscribeCopilotOrderPrefill,
  subscribeCopilotPendingBracketApply,
  subscribeCopilotConfirmBracketApply,
  subscribeCopilotDismissBracketApply,
  subscribeCopilotTradeTrace,
  subscribeCopilotWalletHighlight,
  type CopilotPendingBracketApplyInput,
} from "@/lib/paper-trading/copilot-client"
import { buildCopilotOverlayLine } from "@/lib/chart/copilot-overlay"
import { buildBracketPreviewLines } from "@/lib/chart/bracket-preview-overlay"
import { buildGhostTradeOverlayLines } from "@/lib/chart/ghost-trade-overlay"
import type { ChartOverlayLine } from "@/lib/chart/types"
import { PaperMarketSidebar } from "@/components/paper-trading/market-sidebar"
import { TradingChartHost } from "@/components/chart/trading-chart-host"
import {
  mapPredictionToChartContract,
  type PredictionHorizon,
} from "@/lib/chart/prediction-contract"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEntitlements } from "@/hooks/use-entitlements"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useTradingSession } from "@/hooks/use-trading-session"
import { useWalletIdentity } from "@/hooks/use-wallet-identity"
import {
  hyperliquidInterval,
  hyperliquidIntervalMs,
  type CandleBar,
} from "@/lib/api/candles"
import {
  clearDraftLevel,
  commitDraftStopLoss,
  commitDraftTakeProfit,
  isValidStopLoss,
  isValidTakeProfit,
  type TradeDraft,
  type TradeInteractionMode,
} from "@/lib/trading/draft"
import { formatTradingPrice } from "@/lib/trading/format"
import { hyperliquidPublicMarketData } from "@/lib/trading/market-data"
import {
  decimalNumber,
  type MarginMode,
  type PositionSide,
  type TradingMode,
} from "@/lib/trading/types"
import type { InsightSummary, Prediction } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const

type DraftControls = {
  side: PositionSide
  quantity: number
  stopLoss: number | null
  takeProfit: number | null
}

const DEFAULT_DRAFT_CONTROLS: DraftControls = {
  side: "LONG",
  quantity: 1,
  stopLoss: null,
  takeProfit: null,
}

type PaperTradingWorkspaceProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Inline desk next to the chat sidebar — no dialog chrome. */
  embedded?: boolean
  /** Portal the order ticket into the shell column. Off on News. */
  portaledTicket?: boolean
  symbol: string
  defaultTimeframe: string
  /** Desk market direction + analysis for the desktop left rail. */
  summary?: InsightSummary | null
  prediction?: Prediction | null
  className?: string
}

function PaperTradingWorkspace({
  open = false,
  onOpenChange,
  embedded = false,
  portaledTicket = true,
  symbol,
  defaultTimeframe,
  summary = null,
  prediction = null,
  className,
}: PaperTradingWorkspaceProps) {
  const { isAuthenticated, user, login, loginPending } = useAuth()
  const isDesktop = useIsDesktop()
  const [mode, setMode] = React.useState<TradingMode>("demo")
  const [wishlistOpen, setWishlistOpen] = React.useState(false)
  const [budgetDialogOpen, setBudgetDialogOpen] = React.useState(false)
  const [timeframe, setTimeframe] = React.useState(() =>
    hyperliquidInterval(defaultTimeframe)
  )
  const [activeSymbol, setActiveSymbol] = React.useState(() =>
    symbol.trim().toUpperCase()
  )
  const [candles, setCandles] = React.useState<CandleBar[]>([])
  const [live, setLive] = React.useState(false)
  const wallet = useWalletIdentity(isAuthenticated)
  const entitlements = useEntitlements(isAuthenticated)
  const trading = useTradingSession({
    mode,
    isAuthenticated,
    access: entitlements.tradingAccess,
    verifiedWalletAddress: wallet.verifiedAddress,
    walletStatus: wallet.readinessStatus,
    walletIdentityId: wallet.identity?.id ?? null,
    userId: user?.id ?? null,
  })
  const {
    initialize,
    reconcileMarket,
    updatePositionProtection,
    placeOrder,
    closePosition,
    cancelOrder,
    addIsolatedMargin,
    removeIsolatedMargin,
  } = trading
  const snapshot = trading.snapshot

  const markPrice = candles[candles.length - 1]?.c ?? null

  const [controls, setControls] = React.useState<DraftControls>(DEFAULT_DRAFT_CONTROLS)
  const [marginOverride, setMarginOverride] =
    React.useState<MarginMode | null>(null)
  const [leverageOverride, setLeverageOverride] = React.useState<number | null>(
    null
  )
  const [interactionMode, setInteractionMode] =
    React.useState<TradeInteractionMode>("idle")
  const [predictionHorizon, setPredictionHorizon] =
    React.useState<PredictionHorizon>("24h")
  const [selectedPositionId, setSelectedPositionId] = React.useState<
    string | null
  >(null)
  const [mobilePane, setMobilePane] = React.useState<MobileDeskPane>("chart")
  const [marketView, setMarketView] = React.useState<ChartPaneView>("chart")
  const [copilotOverlayLines, setCopilotOverlayLines] = React.useState<
    ChartOverlayLine[]
  >([])
  const [ghostOverlayLines, setGhostOverlayLines] = React.useState<
    ChartOverlayLine[]
  >([])
  const [bracketPreviewLines, setBracketPreviewLines] = React.useState<
    ChartOverlayLine[]
  >([])
  const [overlayEnabled, setOverlayEnabled] = React.useState({
    ghost: true,
    indicators: true,
    brackets: true,
  })
  const [pendingBracketApply, setPendingBracketApply] =
    React.useState<CopilotPendingBracketApplyInput | null>(null)
  const [walletHighlight, setWalletHighlight] = React.useState(false)
  const [ticketPrefillRevision, setTicketPrefillRevision] = React.useState(0)
  const [ticketPrefill, setTicketPrefill] = React.useState<{
    orderType?: "MARKET" | "LIMIT"
    limitPrice?: number | null
    highlightSubmit?: boolean
  } | null>(null)

  const sessionOpen = embedded || open

  const parentSymbol = symbol.trim().toUpperCase()
  const openSyncKey = `${sessionOpen ? "1" : "0"}:${parentSymbol}`
  const [symbolSyncKey, setSymbolSyncKey] = React.useState(openSyncKey)
  if (openSyncKey !== symbolSyncKey) {
    setSymbolSyncKey(openSyncKey)
    if (sessionOpen) setActiveSymbol(parentSymbol)
  }

  const marginMode =
    marginOverride ??
    snapshot?.positions.find((p) => p.symbol === activeSymbol)?.marginMode ??
    ("CROSS" as MarginMode)
  const leverage =
    leverageOverride ??
    snapshot?.positions.find((p) => p.symbol === activeSymbol)?.leverage.value ??
    5

  const selectedPosition =
    selectedPositionId != null
      ? (snapshot?.positions.find((p) => p.id === selectedPositionId) ?? null)
      : null

  const selectedId = selectedPosition?.id ?? null
  const selectedSymbol = selectedPosition?.symbol ?? null

  useTradeHistoryNotifications(
    sessionOpen && mode === "demo" ? snapshot?.history : undefined
  )

  const draft: TradeDraft = {
    side: controls.side,
    quantity: controls.quantity,
    entryPrice: markPrice ?? 0,
    stopLoss: controls.stopLoss,
    takeProfit: controls.takeProfit,
  }

  const chartSymbolKey = activeSymbol.trim().toUpperCase()
  const symbolPositions = (snapshot?.positions ?? []).filter(
    (position) => position.symbol === chartSymbolKey
  )
  const chartPosition =
    selectedPosition != null && selectedPosition.symbol === chartSymbolKey
      ? selectedPosition
      : (symbolPositions[0] ?? null)

  const account = snapshot?.account ?? null
  const liqPrice = chartPosition
    ? decimalNumber(chartPosition.liquidationPrice)
    : null

  React.useEffect(() => {
    if (!sessionOpen) return
    const ac = new AbortController()
    void initialize(ac.signal)
    return () => ac.abort()
  }, [sessionOpen, initialize])

  React.useEffect(() => {
    if (!sessionOpen) return
    return hyperliquidPublicMarketData.subscribeCandles({
      symbol: activeSymbol,
      timeframe,
      limit: 360,
      onCandles: setCandles,
      onStatus: (status) => setLive(status === "live"),
    })
  }, [sessionOpen, activeSymbol, timeframe])

  React.useEffect(() => {
    if (!sessionOpen || mode !== "demo" || candles.length === 0) return
    reconcileMarket({
      symbol: activeSymbol,
      bars: candles,
      intervalMs: hyperliquidIntervalMs(timeframe),
    })
  }, [sessionOpen, mode, candles, timeframe, activeSymbol, reconcileMarket])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) setInteractionMode("idle")
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const onSymbolChange = React.useCallback(
    (next: string) => {
      const key = next.trim().toUpperCase()
      if (key === activeSymbol) return
      setCandles([])
      setLive(false)
      setInteractionMode("idle")
      setSelectedPositionId(null)
      setMarginOverride(null)
      setLeverageOverride(null)
      setControls((d) => ({
        ...d,
        stopLoss: null,
        takeProfit: null,
        quantity: paperMarketBySymbol(key)?.defaultQuantity ?? d.quantity,
      }))
      setActiveSymbol(key)
    },
    [activeSymbol]
  )

  React.useEffect(() => {
    if (!sessionOpen) return
    return subscribeDeskSymbolChange(onSymbolChange)
  }, [sessionOpen, onSymbolChange])

  React.useEffect(() => {
    if (!sessionOpen) return
    broadcastDeskSymbol(activeSymbol)
  }, [sessionOpen, activeSymbol])

  const onModifyPosition = React.useCallback(
    (
      positionId: string,
      mods: { takeProfit?: number | null; stopLoss?: number | null }
    ): boolean => {
      const pos = snapshot?.positions.find((p) => p.id === positionId)
      if (!pos) return false
      const entryPrice = decimalNumber(pos.entryPrice)
      if (mods.stopLoss != null) {
        if (!isValidStopLoss(pos.side, entryPrice, mods.stopLoss)) {
          return false
        }
      }
      if (mods.takeProfit != null) {
        if (!isValidTakeProfit(pos.side, entryPrice, mods.takeProfit)) {
          return false
        }
      }
      void updatePositionProtection(positionId, {
        stopLoss:
          mods.stopLoss === undefined ? undefined : mods.stopLoss === null ? null : String(mods.stopLoss),
        takeProfit:
          mods.takeProfit === undefined ? undefined : mods.takeProfit === null ? null : String(mods.takeProfit),
      })
      return true
    },
    [snapshot?.positions, updatePositionProtection]
  )

  const onDraftLevelsChange = (mods: {
    stopLoss?: number | null
    takeProfit?: number | null
  }): boolean => {
    if (selectedId) {
      return onModifyPosition(selectedId, mods)
    }

    const asDraft: TradeDraft = {
      side: controls.side,
      quantity: controls.quantity,
      entryPrice: markPrice ?? 0,
      stopLoss: controls.stopLoss,
      takeProfit: controls.takeProfit,
    }
    let next = asDraft
    if (mods.stopLoss === null) {
      next = clearDraftLevel(next, "stopLoss")
    } else if (typeof mods.stopLoss === "number") {
      const placed = commitDraftStopLoss(next, mods.stopLoss)
      if (!placed) return false
      next = placed
    }
    if (mods.takeProfit === null) {
      next = clearDraftLevel(next, "takeProfit")
    } else if (typeof mods.takeProfit === "number") {
      const placed = commitDraftTakeProfit(next, mods.takeProfit)
      if (!placed) return false
      next = placed
    }
    setControls({
      side: next.side,
      quantity: next.quantity,
      stopLoss: next.stopLoss,
      takeProfit: next.takeProfit,
    })
    return true
  }

  const onSideChange = (side: PositionSide) => {
    setControls((d) => ({
      ...d,
      side,
      stopLoss: null,
      takeProfit: null,
    }))
    setInteractionMode("idle")
  }

  const onQuantityChange = (quantity: number) => {
    setControls((d) => ({ ...d, quantity }))
  }

  const applyPendingBracket = React.useCallback(() => {
    if (!pendingBracketApply) return
    onModifyPosition(pendingBracketApply.positionId, {
      stopLoss: pendingBracketApply.stopLoss,
      takeProfit: pendingBracketApply.takeProfit,
    })
    setPendingBracketApply(null)
    setBracketPreviewLines([])
  }, [pendingBracketApply, onModifyPosition])

  const pendingBracketRef = React.useRef(pendingBracketApply)
  const applyPendingBracketRef = React.useRef(applyPendingBracket)

  React.useEffect(() => {
    pendingBracketRef.current = pendingBracketApply
  }, [pendingBracketApply])

  React.useEffect(() => {
    applyPendingBracketRef.current = applyPendingBracket
  }, [applyPendingBracket])

  React.useEffect(() => {
    if (!embedded) return
    const cleanups = [
      subscribeCopilotDeskPane(({ pane }) => {
        setMobilePane(pane)
        if (pane === "chart") setMarketView("chart")
      }),
      subscribeCopilotChartIndicator((indicator) => {
        setCopilotOverlayLines((prev) => {
          const base = indicator.mode === "replace" ? [] : prev
          return [
            ...base,
            buildCopilotOverlayLine({
              id: `copilot:${Date.now()}:${base.length}`,
              ...indicator,
            }),
          ]
        })
        setOverlayEnabled((current) => ({ ...current, indicators: true }))
        setMobilePane("chart")
        setMarketView("chart")
      }),
      subscribeCopilotClearChartIndicators(() => {
        setCopilotOverlayLines([])
        setGhostOverlayLines([])
        setBracketPreviewLines([])
      }),
      subscribeCopilotOrderPrefill((prefill) => {
        const symbolKey = prefill.symbol
          ? prefill.symbol.replace(/USDT$/, "").replace(/USD$/, "")
          : null

        if (symbolKey && symbolKey !== activeSymbol) {
          onSymbolChange(symbolKey)
        }

        queueMicrotask(() => {
          setControls((current) => ({
            side: prefill.side ?? current.side,
            quantity:
              prefill.quantity != null && prefill.quantity > 0
                ? prefill.quantity
                : current.quantity,
            stopLoss:
              prefill.stopLoss !== undefined
                ? prefill.stopLoss
                : current.stopLoss,
            takeProfit:
              prefill.takeProfit !== undefined
                ? prefill.takeProfit
                : current.takeProfit,
          }))
          if (prefill.leverage != null && prefill.leverage > 0) {
            setLeverageOverride(prefill.leverage)
          }
          if (prefill.marginMode) {
            setMarginOverride(prefill.marginMode)
          }
          setTicketPrefill({
            orderType: prefill.limitPrice != null ? "LIMIT" : "MARKET",
            limitPrice: prefill.limitPrice ?? null,
            highlightSubmit: prefill.highlightSubmit,
          })
          setTicketPrefillRevision((value) => value + 1)
          setInteractionMode("idle")
          setMobilePane("trade")
        })
      }),
      subscribeCopilotWalletHighlight(() => {
        setWalletHighlight(true)
        setMobilePane("trade")
        window.setTimeout(() => setWalletHighlight(false), 2_400)
      }),
      subscribeCopilotGhostTrade((preview) => {
        if (preview.symbol) {
          onSymbolChange(preview.symbol)
        }
        setGhostOverlayLines((prev) => {
          const base = preview.clearPrevious ? [] : prev
          return [...base, ...buildGhostTradeOverlayLines(preview)]
        })
        setOverlayEnabled((current) => ({ ...current, ghost: true }))
        setMobilePane("chart")
        setMarketView("chart")
      }),
      subscribeCopilotBracketPreview((preview) => {
        setBracketPreviewLines(buildBracketPreviewLines(preview))
        setOverlayEnabled((current) => ({ ...current, brackets: true }))
        setMobilePane("chart")
        setMarketView("chart")
      }),
      subscribeCopilotPendingBracketApply((pending) => {
        setPendingBracketApply(pending)
        setSelectedPositionId(pending.positionId)
      }),
      subscribeCopilotConfirmBracketApply((requestId) => {
        if (pendingBracketRef.current?.requestId !== requestId) return
        applyPendingBracketRef.current()
      }),
      subscribeCopilotDismissBracketApply((requestId) => {
        if (pendingBracketRef.current?.requestId !== requestId) return
        setPendingBracketApply(null)
        setBracketPreviewLines([])
      }),
      subscribeCopilotTradeTrace((trace) => {
        onSymbolChange(trace.symbol)
        setGhostOverlayLines([
          ...buildGhostTradeOverlayLines({
            id: `trace:${trace.openedAt}`,
            symbol: trace.symbol,
            side: trace.side,
            entryPrice: trace.entryPrice,
            quantity: 1,
            label: "Entry",
          }),
          ...buildGhostTradeOverlayLines({
            id: `trace-exit:${trace.closedAt}`,
            symbol: trace.symbol,
            side: trace.side,
            entryPrice: trace.exitPrice,
            quantity: 1,
            label: `Exit (${trace.reason.replaceAll("_", " ")})`,
          }),
        ])
        setMobilePane("chart")
        setMarketView("chart")
      }),
    ]
    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [embedded, onSymbolChange, activeSymbol])

  const onArmPlace = (field: "stopLoss" | "takeProfit") => {
    // Chart placement only when editing the chart symbol (or drafting for it).
    if (selectedSymbol && selectedSymbol !== chartSymbolKey) {
      return
    }
    setInteractionMode(field === "stopLoss" ? "placing-sl" : "placing-tp")
  }

  const onClearLevel = (field: "stopLoss" | "takeProfit") => {
    if (selectedId) {
      onModifyPosition(selectedId, { [field]: null })
      return
    }
    setControls((d) => {
      const cleared = clearDraftLevel(
        {
          side: d.side,
          quantity: d.quantity,
          entryPrice: markPrice ?? 0,
          stopLoss: d.stopLoss,
          takeProfit: d.takeProfit,
        },
        field
      )
      return {
        side: cleared.side,
        quantity: cleared.quantity,
        stopLoss: cleared.stopLoss,
        takeProfit: cleared.takeProfit,
      }
    })
  }

  const resetDraftAfterOrder = React.useCallback(() => {
    setControls((current) => ({
      side: current.side,
      quantity: DEFAULT_DRAFT_CONTROLS.quantity,
      stopLoss: null,
      takeProfit: null,
    }))
    setInteractionMode("idle")
  }, [])

  const onSubmit = React.useCallback(async (order: TicketSubmitInput) => {
    if (markPrice == null || !(markPrice > 0)) {
      return { ok: false as const, error: "Waiting for mark price" }
    }
    if (!(order.quantity > 0)) {
      return { ok: false as const, error: "Invalid size" }
    }
    const currentPosition = snapshot?.positions.find(
      (position) => position.symbol === activeSymbol
    )
    const requestType =
      order.type === "STOP_MARKET" || order.type === "STOP_LIMIT"
        ? "STOP_MARKET"
        : order.type === "TAKE_MARKET" || order.type === "TAKE_LIMIT"
          ? "TAKE_PROFIT"
          : order.type === "MARKET" || order.type === "LIMIT"
            ? order.type
            : null
    if (!requestType) {
      return {
        ok: false as const,
        error: `${order.type} is not available in paper yet`,
      }
    }
    const result = await placeOrder({
      symbol: activeSymbol,
      side: controls.side === "LONG" ? "BUY" : "SELL",
      type: requestType,
      quantity: String(order.quantity),
      referencePrice: String(markPrice),
      price: order.price == null ? null : String(order.price),
      triggerPrice:
        order.triggerPrice == null ? null : String(order.triggerPrice),
      reduceOnly: order.reduceOnly,
      timeInForce: order.timeInForce,
      marginMode,
      leverage,
      ...(currentPosition || requestType !== "MARKET"
        ? {}
        : {
            stopLoss:
              controls.stopLoss == null ? null : String(controls.stopLoss),
            takeProfit:
              controls.takeProfit == null ? null : String(controls.takeProfit),
          }),
    })
    if (
      result.ok &&
      requestType === "MARKET" &&
      !order.reduceOnly &&
      result.position
    ) {
      showPositionOpenedNotice(result.position, !currentPosition)
    }
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, error: result.error.message }
  }, [controls, markPrice, snapshot?.positions, activeSymbol, placeOrder, marginMode, leverage])

  const ticketProps = {
    symbol: activeSymbol,
    markPrice,
    draft,
    interactionMode,
    selectedPosition,
    marginMode,
    leverage,
    onMarginModeChange: (mode: MarginMode) => setMarginOverride(mode),
    onLeverageChange: (lev: number) => setLeverageOverride(lev),
    onSideChange,
    onQuantityChange,
    onArmPlace,
    onClearLevel,
    onManualLevel: (field: "stopLoss" | "takeProfit", price: number) =>
      onDraftLevelsChange({ [field]: price }),
    onCancelPlace: () => setInteractionMode("idle"),
    onSymbolChange,
    onSubmit,
    onOrderSuccess: resetDraftAfterOrder,
    maxLeverage:
      trading.markets.find((market) => market.symbol === activeSymbol)
        ?.maxLeverage ?? 1,
    availableBalance:
      snapshot?.account.availableBalance != null
        ? decimalNumber(snapshot.account.availableBalance)
        : null,
    symbolPosition:
      snapshot?.positions.find((position) => position.symbol === activeSymbol) ??
      null,
    equity:
      snapshot?.account.equity != null
        ? decimalNumber(snapshot.account.equity)
        : null,
    unrealizedPnl: (snapshot?.positions ?? []).reduce(
      (sum, position) => sum + decimalNumber(position.unrealizedPnl),
      0
    ),
    maintenanceMargin:
      snapshot?.account.maintenanceMarginUsed != null
        ? decimalNumber(snapshot.account.maintenanceMarginUsed)
        : null,
    accountLeverage: (() => {
      const equity =
        snapshot?.account.equity != null
          ? decimalNumber(snapshot.account.equity)
          : null
      if (equity == null || !(equity > 0)) return 0
      const notional = (snapshot?.positions ?? []).reduce((sum, position) => {
        return (
          sum +
          Math.abs(decimalNumber(position.quantity)) *
            decimalNumber(position.markPrice)
        )
      }, 0)
      return notional / equity
    })(),
    externalPrefill:
      ticketPrefillRevision > 0
        ? {
            revision: ticketPrefillRevision,
            orderType: ticketPrefill?.orderType,
            limitPrice: ticketPrefill?.limitPrice,
            highlightSubmit: ticketPrefill?.highlightSubmit,
          }
        : null,
  }

  const executionReady = trading.executionReady
  const interactiveTrading = mode === "demo" || executionReady
  const placing =
    interactionMode === "placing-sl" || interactionMode === "placing-tp"
  const isMobileEmbedded = embedded && isDesktop === false
  const activeMarketView: ChartPaneView =
    placing || (embedded && isDesktop !== false) ? "chart" : marketView
  const accountLabel = snapshot?.account.accountId
    ? `${snapshot.account.accountId.slice(0, 6)}…${snapshot.account.accountId.slice(-4)}`
    : null

  const enabledPredictionHorizons = React.useMemo(() => {
    const horizons: PredictionHorizon[] = []
    const access = entitlements.tradingAccess
    if (access.canUsePrediction24H) horizons.push("24h")
    if (access.canUsePrediction4H) horizons.push("4h")
    if (access.canUsePrediction1M) horizons.push("1m")
    if (horizons.length === 0 && mode === "demo" && prediction) {
      horizons.push("24h")
    }
    return horizons
  }, [entitlements.tradingAccess, mode, prediction])

  const chartPrediction = React.useMemo(() => {
    if (!prediction || markPrice == null || !(markPrice > 0)) return null
    return mapPredictionToChartContract({
      prediction,
      symbol: activeSymbol,
      horizon: predictionHorizon,
      anchorPrice: markPrice,
    })
  }, [prediction, activeSymbol, predictionHorizon, markPrice])

  const chartOverlayTools = React.useMemo<ChartOverlayToolState[]>(
    () => [
      {
        id: "ghost",
        label: "Exur setup overlay",
        available: ghostOverlayLines.length > 0,
        enabled: overlayEnabled.ghost,
        onToggle: () =>
          setOverlayEnabled((current) => ({
            ...current,
            ghost: !current.ghost,
          })),
      },
      {
        id: "indicators",
        label: "AI chart drawings",
        available: copilotOverlayLines.length > 0,
        enabled: overlayEnabled.indicators,
        onToggle: () =>
          setOverlayEnabled((current) => ({
            ...current,
            indicators: !current.indicators,
          })),
      },
      {
        id: "brackets",
        label: "Bracket preview",
        available: bracketPreviewLines.length > 0,
        enabled: overlayEnabled.brackets,
        onToggle: () =>
          setOverlayEnabled((current) => ({
            ...current,
            brackets: !current.brackets,
          })),
      },
    ],
    [
      ghostOverlayLines.length,
      copilotOverlayLines.length,
      bracketPreviewLines.length,
      overlayEnabled,
    ]
  )

  const chartProps = {
    symbol: activeSymbol,
    timeframe,
    candles,
    positions: symbolPositions,
    openOrders: snapshot?.openOrders ?? [],
    fills: snapshot?.fills ?? [],
    liquidationPrice: liqPrice,
    prediction: chartPrediction,
    predictionHorizon,
    enabledPredictionHorizons,
    onPredictionHorizonChange: setPredictionHorizon,
    extraOverlayLines: [
      ...(overlayEnabled.indicators ? copilotOverlayLines : []),
      ...(overlayEnabled.ghost ? ghostOverlayLines : []),
      ...(overlayEnabled.brackets ? bracketPreviewLines : []),
    ],
  }

  const demoStartingBalance =
    mode === "demo" ? getPaperStartingBalance(getPaperSnapshot()) : null

  React.useEffect(() => {
    if (!sessionOpen || !embedded) return
    const paperAccount =
      mode === "demo" ? summarizePaperAccount(getPaperSnapshot()) : null
    broadcastDeskContext({
      symbol: activeSymbol,
      timeframe,
      predictionHorizon:
        enabledPredictionHorizons.length > 0 ? predictionHorizon : null,
      markPrice,
      paperAccount,
      openPositions: (snapshot?.positions ?? []).map((position) => ({
        id: position.id,
        symbol: position.symbol,
        side: position.side,
        quantity: decimalNumber(position.quantity),
        entryPrice: decimalNumber(position.entryPrice),
        markPrice: decimalNumber(position.markPrice),
        stopLoss:
          position.stopLoss == null
            ? null
            : decimalNumber(position.stopLoss),
        takeProfit:
          position.takeProfit == null
            ? null
            : decimalNumber(position.takeProfit),
        leverage: position.leverage.value,
        marginMode: position.marginMode,
        unrealizedPnl: decimalNumber(position.unrealizedPnl),
      })),
      draft: chartPosition
        ? null
        : {
            side: controls.side,
            quantity: controls.quantity,
            stopLoss: controls.stopLoss,
            takeProfit: controls.takeProfit,
          },
    })
  }, [
    sessionOpen,
    embedded,
    mode,
    activeSymbol,
    timeframe,
    predictionHorizon,
    enabledPredictionHorizons.length,
    markPrice,
    snapshot?.positions,
    snapshot?.account.equity,
    snapshot?.account.availableBalance,
    chartPosition,
    controls,
  ])

  const lastBar = candles[candles.length - 1] ?? null
  const changePct =
    lastBar && lastBar.o > 0
      ? ((lastBar.c - lastBar.o) / lastBar.o) * 100
      : null

  function onModeChange(item: TradingMode) {
    if (item === "real" && !executionReady) {
      setWishlistOpen(true)
      return
    }
    setMode(item)
    setSelectedPositionId(null)
    setInteractionMode("idle")
  }

  const wishlistDialog = (
    <RealTradingWishlistDialog
      open={wishlistOpen}
      onOpenChange={setWishlistOpen}
      isAuthenticated={isAuthenticated}
      loginPending={loginPending}
      onLogin={() => login({ source: "trade_desk" })}
    />
  )

  const budgetDialog =
    mode === "demo" && demoStartingBalance != null ? (
      <DemoBudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        currentBudget={demoStartingBalance}
        hasOpenActivity={
          (snapshot?.positions.length ?? 0) > 0 ||
          (snapshot?.openOrders.length ?? 0) > 0
        }
      />
    ) : null

  const timeframeBar = (
    <div
      className="flex h-9 shrink-0 items-end gap-3 overflow-x-auto border-b border-border/60 px-3 lg:h-8"
      role="group"
      aria-label="Timeframe"
    >
      {TIMEFRAMES.map((tf) => (
        <Button
          key={tf}
          type="button"
          size="xs"
          variant="ghost"
          className={cn(
            "relative h-8 shrink-0 rounded-none px-0 font-mono text-[11px] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground",
            timeframe === tf &&
              "pointer-events-none text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
          )}
          onClick={() => {
            setCandles([])
            setLive(false)
            setTimeframe(tf)
          }}
        >
          {tf}
        </Button>
      ))}
    </div>
  )

  const interactiveChartPane =
    candles.length >= 2 ? (
      <div className="relative h-full min-h-0">
        <TradingChartHost
          {...chartProps}
          history={interactiveTrading ? snapshot?.history ?? [] : []}
          draft={interactiveTrading && !chartPosition ? draft : null}
          interactionMode={interactiveTrading ? interactionMode : "idle"}
          onInteractionModeChange={
            interactiveTrading ? setInteractionMode : () => undefined
          }
          onDraftLevelsChange={
            interactiveTrading ? onDraftLevelsChange : () => false
          }
          onModifyPosition={
            interactiveTrading ? onModifyPosition : () => false
          }
          onClearLevel={interactiveTrading ? onClearLevel : () => undefined}
        />
        <BracketApplyBanner
          pending={pendingBracketApply}
          onApply={applyPendingBracket}
          onDismiss={() => {
            setPendingBracketApply(null)
            setBracketPreviewLines([])
          }}
        />
      </div>
    ) : (
      <ChartPaneSkeleton className="h-full" />
    )

  const readOnlyChartPane =
    candles.length >= 2 ? (
      <TradingChartHost
        {...chartProps}
        history={[]}
        draft={null}
        interactionMode="idle"
        onInteractionModeChange={() => undefined}
        onDraftLevelsChange={() => false}
        onModifyPosition={() => false}
        onClearLevel={() => undefined}
      />
    ) : (
      <ChartPaneSkeleton className="h-full" />
    )

  const chartPaneContent = interactiveTrading
    ? interactiveChartPane
    : readOnlyChartPane

  const marketPaneToolbar = embedded ? (
    <ChartPaneToolbar
      view={activeMarketView}
      onViewChange={setMarketView}
      timeframe={timeframe}
      onTimeframeChange={(tf) => {
        setCandles([])
        setLive(false)
        setTimeframe(hyperliquidInterval(tf))
      }}
      bookDisabled={placing}
      overlayTools={chartOverlayTools}
    />
  ) : null

  const showOrderBookInChartPane =
    embedded && isDesktop === false && activeMarketView === "book"

  const marketPaneBody = showOrderBookInChartPane ? (
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-background"
      >
        <OrderBook
          symbol={activeSymbol}
          depth={12}
          className="min-h-full border-b-0"
        />
      </div>
    ) : (
      chartPaneContent
    )

  const embeddedMarketPane = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {marketPaneToolbar}
      <div className="relative min-h-0 flex-1 bg-background lg:min-h-70">
        {marketPaneBody}
      </div>
    </div>
  )

  const renderBottomPanel = (className?: string, mobile = false) =>
    snapshot ? (
      <BottomTradingPanel
        className={className}
        mobile={mobile}
        positions={snapshot.positions}
        orders={snapshot.openOrders}
        history={snapshot.history}
        markPrice={markPrice}
        chartSymbol={activeSymbol}
        selectedPositionId={selectedPositionId}
        onSelectPosition={
          interactiveTrading
            ? (id) => {
                const target = id
                  ? snapshot.positions.find((p) => p.id === id)
                  : null
                if (target && target.symbol !== chartSymbolKey) {
                  setCandles([])
                  setLive(false)
                  setMarginOverride(null)
                  setLeverageOverride(null)
                  setControls((d) => ({
                    ...d,
                    stopLoss: null,
                    takeProfit: null,
                  }))
                  setActiveSymbol(target.symbol.trim().toUpperCase())
                }
                setSelectedPositionId(id)
                setInteractionMode("idle")
                if (isMobileEmbedded) {
                  setMobilePane("chart")
                  setMarketView("chart")
                }
              }
            : undefined
        }
        onClosePosition={
          interactiveTrading
            ? (id) => {
                const target = snapshot.positions.find((p) => p.id === id)
                if (!target) return
                const px =
                  target.symbol === chartSymbolKey && markPrice != null
                    ? markPrice
                    : decimalNumber(target.markPrice)
                if (!(px > 0)) return
                void closePosition(id, String(px))
                if (selectedPositionId === id) setSelectedPositionId(null)
                setControls((d) => ({ ...d, stopLoss: null, takeProfit: null }))
              }
            : () => undefined
        }
        onCancelOrder={
          interactiveTrading ? (id) => void cancelOrder(id) : undefined
        }
        onAddIsolatedMargin={
          interactiveTrading
            ? (id, amount) => void addIsolatedMargin(id, String(amount))
            : undefined
        }
        onRemoveIsolatedMargin={
          interactiveTrading
            ? (id, amount) => void removeIsolatedMargin(id, String(amount))
            : undefined
        }
        readOnly={!interactiveTrading}
      />
    ) : null

  const deskChrome = (
    <DeskChrome
      symbol={activeSymbol}
      live={live}
      mode={mode}
      onModeChange={onModeChange}
      markPrice={markPrice}
      changePct={changePct}
      equityLabel={account ? formatTradingPrice(account.equity) : null}
      availableLabel={
        account ? formatTradingPrice(account.availableBalance) : null
      }
      marginLabel={
        account ? formatTradingPrice(account.initialMarginUsed) : null
      }
      summary={summary}
      prediction={prediction}
      highlightBalances={walletHighlight}
      demoBudgetLabel={
        demoStartingBalance != null
          ? `$${formatTradingPrice(demoStartingBalance)}`
          : null
      }
      onDemoBudgetClick={
        mode === "demo" ? () => setBudgetDialogOpen(true) : undefined
      }
    />
  )
  const mobileDeskWithTabs = isMobileEmbedded && interactiveTrading

  const tradingBoard = (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {snapshot ? (
          <>
            {!embedded && mode === "demo" && summary && prediction ? (
              <PaperMarketSidebar summary={summary} prediction={prediction} />
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {mode === "real" && executionReady ? (
                <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 text-[10px] text-muted-foreground">
                  <span>{accountLabel} · Hyperliquid Testnet</span>
                  <span className="text-emerald-500">Execution enabled</span>
                </div>
              ) : null}

              {mobileDeskWithTabs ? (
                <MobileDeskLayout
                  pane={mobilePane}
                  onPaneChange={setMobilePane}
                  placing={placing}
                  positionsCount={snapshot.positions.length}
                  ordersCount={snapshot.openOrders.length}
                  header={deskChrome}
                  chart={embeddedMarketPane}
                  trade={
                    <OrderTicket
                      key={activeSymbol}
                      {...ticketProps}
                      mobile
                      disabled={!trading.canSubmit}
                    />
                  }
                  portfolio={renderBottomPanel(
                    "h-full min-h-0 flex-1 border-t-0 lg:h-50",
                    true
                  )}
                />
              ) : (
                <>
                  {embedded ? (
                    embeddedMarketPane
                  ) : (
                    <>
                      {timeframeBar}
                      <div className="relative min-h-0 flex-1 bg-background lg:min-h-70">
                        {interactiveChartPane}
                      </div>
                    </>
                  )}
                  {renderBottomPanel()}
                </>
              )}
            </div>

            {interactiveTrading && isDesktop !== false && !embedded ? (
              <aside className="hidden w-64 shrink-0 overflow-hidden border-l border-border/70 bg-card lg:flex lg:flex-col xl:w-70">
                <div className="max-h-44 shrink-0 overflow-y-auto border-b border-border/50">
                  <OrderBook symbol={activeSymbol} />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <OrderTicket
                    key={activeSymbol}
                    {...ticketProps}
                    disabled={!trading.canSubmit}
                  />
                </div>
              </aside>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading desk…
          </div>
        )}
      </div>

      {embedded && isDesktop === true ? (
        <TicketSlotPortal enabled={portaledTicket}>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 pr-3 pl-5">
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Order</span>
              <span className="block truncate text-xs text-muted-foreground">
                {activeSymbol}-USD · {mode === "demo" ? "Demo" : "Live"}
              </span>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="max-h-44 shrink-0 overflow-y-auto border-b border-border/50">
              <div>
                <OrderBook symbol={activeSymbol} />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <OrderTicket
                key={activeSymbol}
                {...ticketProps}
                compact
                disabled={!trading.canSubmit}
              />
            </div>
          </div>
        </TicketSlotPortal>
      ) : null}
    </>
  )

  if (embedded) {
    return (
      <>
        <div
          className={cn("flex h-full min-h-0 flex-col", className)}
        >
          {!mobileDeskWithTabs ? deskChrome : null}
          {tradingBoard}
        </div>
        {wishlistDialog}
        {budgetDialog}
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 ring-0 sm:max-w-none"
          showCloseButton={false}
        >
        <DialogHeader className="shrink-0 space-y-0 border-b border-border/60 px-3 py-2 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold tracking-tight">
                  {activeSymbol} · {mode === "demo" ? "Demo Trading" : "Real Trading"}
                </DialogTitle>
                <div
                  className="relative flex shrink-0 rounded-md border border-border/60 p-0.5"
                  role="group"
                  aria-label="Trading mode"
                >
                  {mode === "demo" ? (
                    <span
                      className="pointer-events-none absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary animate-pulse"
                      aria-hidden
                    />
                  ) : null}
                  {(["demo", "real"] as const).map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="xs"
                      variant={mode === item ? "secondary" : "ghost"}
                      className="h-5 px-1.5 text-[9px] capitalize"
                      onClick={() => onModeChange(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {live ? "Live Hyperliquid" : "Connecting…"}
                {markPrice != null
                  ? ` · ${markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : null}
                {mode === "demo"
                  ? " · Simulation only · Free"
                  : executionReady
                    ? " · Hyperliquid testnet execution"
                    : " · Execution disabled"}
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Close paper trading"
                />
              }
            >
              <XIcon className="size-4" />
            </DialogClose>
          </div>

          {snapshot && account ? <div className="mt-1.5 flex items-center gap-3 overflow-x-auto font-mono text-[10px] tabular-nums text-muted-foreground [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0">
              Equity{" "}
              <span className="text-foreground">
                {formatTradingPrice(account.equity)}
              </span>
            </span>
            <span className="shrink-0">
              Avail{" "}
              <span className="text-foreground">
                {formatTradingPrice(account.availableBalance)}
              </span>
            </span>
            <span className="shrink-0">
              Margin{" "}
              <span className="text-foreground">
                {formatTradingPrice(account.initialMarginUsed)}
              </span>
            </span>
          </div> : null}

          <div
            className="mt-1.5 flex items-end gap-3 overflow-x-auto border-b border-border/60 px-0 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Timeframe"
          >
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf}
                type="button"
                size="xs"
                variant="ghost"
                className={cn(
                  "relative h-7 shrink-0 rounded-none px-0 font-mono text-[11px] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground",
                  timeframe === tf &&
                    "pointer-events-none text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
                )}
                onClick={() => {
                  setCandles([])
                  setLive(false)
                  setTimeframe(tf)
                }}
              >
                {tf}
              </Button>
            ))}
          </div>
        </DialogHeader>

        {tradingBoard}
      </DialogContent>
    </Dialog>
    {wishlistDialog}
    {budgetDialog}
    </>
  )
}

export { PaperTradingWorkspace }
