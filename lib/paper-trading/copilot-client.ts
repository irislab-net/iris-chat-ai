import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"

import type { PositionSide } from "@/lib/trading/types"
import type { ProductTourDeskPane } from "@/lib/product-tour-nav"
import type { GhostTradePreview } from "@/lib/chart/ghost-trade-overlay"
import type { BracketPreviewInput } from "@/lib/chart/bracket-preview-overlay"

const CHART_INDICATOR_EVENT = "iris:copilot-chart-indicator"
const CHART_INDICATORS_CLEAR_EVENT = "iris:copilot-chart-indicators-clear"
const ORDER_PREFILL_EVENT = "iris:copilot-order-prefill"
const CHAT_PREFILL_EVENT = "iris:copilot-chat-prefill"
const WALLET_HIGHLIGHT_EVENT = "iris:copilot-wallet-highlight"
const DESK_PANE_EVENT = "iris:copilot-desk-pane"
const GHOST_TRADE_EVENT = "iris:copilot-ghost-trade"
const BRACKET_PREVIEW_EVENT = "iris:copilot-bracket-preview"
const BRACKET_APPLY_EVENT = "iris:copilot-bracket-apply"
const BRACKET_CONFIRM_EVENT = "iris:copilot-bracket-confirm"
const BRACKET_DISMISS_EVENT = "iris:copilot-bracket-dismiss"
const TRADE_TRACE_EVENT = "iris:copilot-trade-trace"
const DISMISS_MOBILE_CHAT_EVENT = "iris:dismiss-mobile-chat"

export type CopilotChartIndicatorType = "support" | "resistance" | "trendline"
export type CopilotChartIndicatorMode = "append" | "replace"

export type CopilotChartIndicatorInput = {
  type: CopilotChartIndicatorType
  price: number
  mode?: CopilotChartIndicatorMode
}

export type CopilotOrderPrefillInput = {
  side?: PositionSide
  symbol?: string
  quantity?: number
  limitPrice?: number | null
  stopLoss?: number | null
  takeProfit?: number | null
  leverage?: number
  marginMode?: "CROSS" | "ISOLATED"
  /** Brief pulse on the ticket submit button after IRIS fill. */
  highlightSubmit?: boolean
}

export type CopilotChatPrefillInput = {
  text: string
  openChat?: boolean
  focus?: boolean
}

export type CopilotWalletHighlightInput = {
  asset?: string
}

export type CopilotDeskPaneInput = {
  pane: ProductTourDeskPane
}

export type CopilotGhostTradeInput = GhostTradePreview & {
  clearPrevious?: boolean
}

export type CopilotBracketPreviewInput = BracketPreviewInput

export type CopilotPendingBracketApplyInput = {
  requestId: string
  positionId: string
  symbol: string
  side: PositionSide
  stopLoss?: number | null
  takeProfit?: number | null
  reason?: string
}

export type CopilotTradeTraceInput = {
  symbol: string
  side: PositionSide
  entryPrice: number
  exitPrice: number
  openedAt: number
  closedAt: number
  reason: string
  realizedPnl: number
}

function normalizeIndicatorType(
  value: unknown
): CopilotChartIndicatorType | null {
  if (value === "support" || value === "resistance" || value === "trendline") {
    return value
  }
  return null
}

function normalizePrice(value: unknown): number | null {
  const price = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return price
}

function normalizeOptionalPrice(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null
  return normalizePrice(value)
}

function normalizeSide(value: unknown): PositionSide | undefined {
  const sideRaw = typeof value === "string" ? value.toLowerCase() : ""
  if (sideRaw === "sell" || sideRaw === "short") return "SHORT"
  if (sideRaw === "buy" || sideRaw === "long") return "LONG"
  return undefined
}

export function dispatchCopilotChartIndicator(input: CopilotChartIndicatorInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotChartIndicatorInput>(CHART_INDICATOR_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotChartIndicator(
  handler: (input: CopilotChartIndicatorInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotChartIndicatorInput>).detail
    if (!detail) return
    const type = normalizeIndicatorType(detail.type)
    const price = normalizePrice(detail.price)
    if (!type || price == null) return
    handler({
      type,
      price,
      mode: detail.mode === "replace" ? "replace" : "append",
    })
  }
  window.addEventListener(CHART_INDICATOR_EVENT, onEvent)
  return () => window.removeEventListener(CHART_INDICATOR_EVENT, onEvent)
}

export function dispatchCopilotClearChartIndicators() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CHART_INDICATORS_CLEAR_EVENT))
}

export function subscribeCopilotClearChartIndicators(
  handler: () => void
): () => void {
  const onEvent = () => handler()
  window.addEventListener(CHART_INDICATORS_CLEAR_EVENT, onEvent)
  return () =>
    window.removeEventListener(CHART_INDICATORS_CLEAR_EVENT, onEvent)
}

export function dispatchCopilotOrderPrefill(input: CopilotOrderPrefillInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotOrderPrefillInput>(ORDER_PREFILL_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotOrderPrefill(
  handler: (input: CopilotOrderPrefillInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotOrderPrefillInput>).detail
    if (!detail) return
    handler(detail)
  }
  window.addEventListener(ORDER_PREFILL_EVENT, onEvent)
  return () => window.removeEventListener(ORDER_PREFILL_EVENT, onEvent)
}

export function dispatchCopilotChatPrefill(input: CopilotChatPrefillInput) {
  if (typeof window === "undefined") return
  if (!input.text.trim()) return
  window.dispatchEvent(
    new CustomEvent<CopilotChatPrefillInput>(CHAT_PREFILL_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotChatPrefill(
  handler: (input: CopilotChatPrefillInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotChatPrefillInput>).detail
    if (!detail?.text?.trim()) return
    handler(detail)
  }
  window.addEventListener(CHAT_PREFILL_EVENT, onEvent)
  return () => window.removeEventListener(CHAT_PREFILL_EVENT, onEvent)
}

export function dispatchCopilotWalletHighlight(
  input: CopilotWalletHighlightInput = {}
) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotWalletHighlightInput>(WALLET_HIGHLIGHT_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotWalletHighlight(
  handler: (input: CopilotWalletHighlightInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail =
      (event as CustomEvent<CopilotWalletHighlightInput>).detail ?? {}
    handler(detail)
  }
  window.addEventListener(WALLET_HIGHLIGHT_EVENT, onEvent)
  return () => window.removeEventListener(WALLET_HIGHLIGHT_EVENT, onEvent)
}

export function dispatchCopilotDeskPane(input: CopilotDeskPaneInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotDeskPaneInput>(DESK_PANE_EVENT, { detail: input })
  )
}

export function subscribeCopilotDeskPane(
  handler: (input: CopilotDeskPaneInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotDeskPaneInput>).detail
    if (!detail?.pane) return
    handler(detail)
  }
  window.addEventListener(DESK_PANE_EVENT, onEvent)
  return () => window.removeEventListener(DESK_PANE_EVENT, onEvent)
}

export function dispatchCopilotGhostTrade(input: CopilotGhostTradeInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotGhostTradeInput>(GHOST_TRADE_EVENT, { detail: input })
  )
}

export function subscribeCopilotGhostTrade(
  handler: (input: CopilotGhostTradeInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotGhostTradeInput>).detail
    if (!detail?.id || !detail.symbol) return
    handler(detail)
  }
  window.addEventListener(GHOST_TRADE_EVENT, onEvent)
  return () => window.removeEventListener(GHOST_TRADE_EVENT, onEvent)
}

export function dispatchCopilotBracketPreview(
  input: CopilotBracketPreviewInput
) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotBracketPreviewInput>(BRACKET_PREVIEW_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotBracketPreview(
  handler: (input: CopilotBracketPreviewInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotBracketPreviewInput>).detail
    if (!detail?.positionId) return
    handler(detail)
  }
  window.addEventListener(BRACKET_PREVIEW_EVENT, onEvent)
  return () => window.removeEventListener(BRACKET_PREVIEW_EVENT, onEvent)
}

export function dispatchCopilotPendingBracketApply(
  input: CopilotPendingBracketApplyInput
) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotPendingBracketApplyInput>(BRACKET_APPLY_EVENT, {
      detail: input,
    })
  )
}

export function subscribeCopilotPendingBracketApply(
  handler: (input: CopilotPendingBracketApplyInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotPendingBracketApplyInput>).detail
    if (!detail?.positionId) return
    handler(detail)
  }
  window.addEventListener(BRACKET_APPLY_EVENT, onEvent)
  return () => window.removeEventListener(BRACKET_APPLY_EVENT, onEvent)
}

export function dispatchCopilotConfirmBracketApply(requestId: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<{ requestId: string }>(BRACKET_CONFIRM_EVENT, {
      detail: { requestId },
    })
  )
}

export function subscribeCopilotConfirmBracketApply(
  handler: (requestId: string) => void
): () => void {
  const onEvent = (event: Event) => {
    const requestId = (event as CustomEvent<{ requestId: string }>).detail
      ?.requestId
    if (!requestId) return
    handler(requestId)
  }
  window.addEventListener(BRACKET_CONFIRM_EVENT, onEvent)
  return () => window.removeEventListener(BRACKET_CONFIRM_EVENT, onEvent)
}

export function dispatchCopilotDismissBracketApply(requestId: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<{ requestId: string }>(BRACKET_DISMISS_EVENT, {
      detail: { requestId },
    })
  )
}

export function subscribeCopilotDismissBracketApply(
  handler: (requestId: string) => void
): () => void {
  const onEvent = (event: Event) => {
    const requestId = (event as CustomEvent<{ requestId: string }>).detail
      ?.requestId
    if (!requestId) return
    handler(requestId)
  }
  window.addEventListener(BRACKET_DISMISS_EVENT, onEvent)
  return () => window.removeEventListener(BRACKET_DISMISS_EVENT, onEvent)
}

export function dispatchCopilotTradeTrace(input: CopilotTradeTraceInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<CopilotTradeTraceInput>(TRADE_TRACE_EVENT, { detail: input })
  )
}

export function subscribeCopilotTradeTrace(
  handler: (input: CopilotTradeTraceInput) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<CopilotTradeTraceInput>).detail
    if (!detail?.symbol) return
    handler(detail)
  }
  window.addEventListener(TRADE_TRACE_EVENT, onEvent)
  return () => window.removeEventListener(TRADE_TRACE_EVENT, onEvent)
}

export function parseCopilotChartIndicatorArgs(
  args: Record<string, unknown>
): CopilotChartIndicatorInput | null {
  const type = normalizeIndicatorType(args.type)
  const price = normalizePrice(args.price)
  if (!type || price == null) return null
  const modeRaw = typeof args.mode === "string" ? args.mode.toLowerCase() : ""
  return {
    type,
    price,
    mode: modeRaw === "replace" ? "replace" : "append",
  }
}

export function parseCopilotOrderPrefillArgs(
  args: Record<string, unknown>
): CopilotOrderPrefillInput {
  const side = normalizeSide(args.side)
  const symbol =
    typeof args.symbol === "string" && args.symbol.trim()
      ? args.symbol.trim().toUpperCase()
      : undefined

  const quantity =
    typeof args.quantity === "number" && args.quantity > 0
      ? args.quantity
      : undefined

  const limitPrice = normalizeOptionalPrice(args.price ?? args.limit_price)
  const stopLoss = normalizeOptionalPrice(args.stop_loss ?? args.stopLoss)
  const takeProfit = normalizeOptionalPrice(args.take_profit ?? args.takeProfit)

  const leverage =
    typeof args.leverage === "number" && args.leverage > 0
      ? args.leverage
      : undefined

  const marginRaw =
    typeof args.margin_mode === "string"
      ? args.margin_mode
      : typeof args.marginMode === "string"
        ? args.marginMode
        : ""
  const marginMode =
    marginRaw.toLowerCase() === "isolated"
      ? ("ISOLATED" as const)
      : marginRaw.toLowerCase() === "cross"
        ? ("CROSS" as const)
        : undefined

  return {
    side,
    symbol,
    quantity,
    limitPrice,
    stopLoss,
    takeProfit,
    leverage,
    marginMode,
  }
}

export function parseCopilotGhostTradeArgs(
  args: Record<string, unknown>,
  fallbackId: string
): CopilotGhostTradeInput | null {
  const symbol =
    typeof args.symbol === "string" ? args.symbol.trim().toUpperCase() : ""
  const side = normalizeSide(args.direction ?? args.side)
  const entryPrice = normalizePrice(args.entry_price ?? args.entryPrice ?? args.mark_price ?? args.markPrice)
  const quantity =
    typeof args.quantity === "number" && args.quantity > 0 ? args.quantity : 1
  if (!symbol || !side || entryPrice == null) return null

  return {
    id: typeof args.id === "string" ? args.id : fallbackId,
    symbol,
    side,
    entryPrice,
    quantity,
    stopLoss: normalizeOptionalPrice(args.stop_loss ?? args.stopLoss) ?? null,
    takeProfit:
      normalizeOptionalPrice(args.take_profit ?? args.takeProfit) ?? null,
    label: typeof args.label === "string" ? args.label : "AI setup",
    clearPrevious: args.clear_previous !== false,
  }
}

export function parseCopilotBracketArgs(args: Record<string, unknown>): {
  positionId?: string
  symbol?: string
  stopLoss?: number | null
  takeProfit?: number | null
  reason?: string
} {
  const positionId =
    typeof args.position_id === "string"
      ? args.position_id
      : typeof args.positionId === "string"
        ? args.positionId
        : undefined
  const symbol =
    typeof args.symbol === "string" && args.symbol.trim()
      ? args.symbol.trim().toUpperCase()
      : undefined
  return {
    positionId,
    symbol,
    stopLoss: normalizeOptionalPrice(args.stop_loss ?? args.stopLoss),
    takeProfit: normalizeOptionalPrice(args.take_profit ?? args.takeProfit),
    reason: typeof args.reason === "string" ? args.reason : undefined,
  }
}

export function dispatchDismissMobileChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(DISMISS_MOBILE_CHAT_EVENT))
}

export function subscribeDismissMobileChat(handler: () => void): () => void {
  const onEvent = () => handler()
  window.addEventListener(DISMISS_MOBILE_CHAT_EVENT, onEvent)
  return () => window.removeEventListener(DISMISS_MOBILE_CHAT_EVENT, onEvent)
}

/** Fill the desk order ticket from an IRIS signal — user only confirms Buy/Sell. */
export function fillSignalToOrder(input: {
  side: PositionSide
  symbol: string
  quantity: number
  stopLoss?: number | null
  takeProfit?: number | null
  leverage?: number
}) {
  dispatchCopilotOrderPrefill({
    ...input,
    highlightSubmit: true,
  })
  dispatchCopilotDeskPane({ pane: "trade" })
  dispatchDismissMobileChat()
  requestOpenPaperTrading()
}
