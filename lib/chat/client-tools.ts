import type { ChatToolCallResult } from "@/lib/api/types"
import {
  parseToolActionInput,
  chatRoleFromUser,
  toChatApiSymbol,
} from "@/lib/api/chat"
import type { User } from "@/lib/api/types"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import type { DeskContextSnapshot } from "@/lib/paper-trading/desk-context"
import {
  dispatchCopilotBracketPreview,
  dispatchCopilotChartIndicator,
  dispatchCopilotClearChartIndicators,
  dispatchCopilotDeskPane,
  dispatchCopilotGhostTrade,
  dispatchCopilotOrderPrefill,
  dispatchCopilotPendingBracketApply,
  dispatchCopilotWalletHighlight,
  parseCopilotBracketArgs,
  parseCopilotChartIndicatorArgs,
  parseCopilotGhostTradeArgs,
  parseCopilotOrderPrefillArgs,
} from "@/lib/paper-trading/copilot-client"
import { requestDeskSymbolChange } from "@/lib/paper-trading/desk-symbol"
import { APP_PATH } from "@/lib/site"
import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"
import {
  WORKSPACE_TAB_NEWS,
  workspaceTabHref,
  type WorkspaceTab,
} from "@/lib/workspace-tab"

export const CHAT_FRONTEND_TOOLS = [
  "show_trade_signal",
  "draw_chart_indicator",
  "clear_chart_indicators",
  "fill_order_form",
  "navigate_to_page",
  "show_wallet_balance",
  "preview_ghost_trade",
  "preview_position_bracket",
  "modify_position_bracket",
  "admin_user_lookup",
] as const

export type ChatFrontendTool = (typeof CHAT_FRONTEND_TOOLS)[number]

export type ChatClientActivePage =
  | "chat"
  | "trading_chart"
  | "wallet_page"
  | "admin_dashboard"

export type ChatClientActionSummary = {
  tool: string
  label: string
  applied: boolean
}

export type ChatClientActionHandlers = {
  navigate?: (href: string) => void
  openDesk?: () => void
  switchSymbol?: (symbol: string) => void
  drawChartIndicator?: typeof dispatchCopilotChartIndicator
  clearChartIndicators?: typeof dispatchCopilotClearChartIndicators
  fillOrderForm?: typeof dispatchCopilotOrderPrefill
  showWalletBalance?: typeof dispatchCopilotWalletHighlight
  focusDeskPane?: typeof dispatchCopilotDeskPane
  previewGhostTrade?: typeof dispatchCopilotGhostTrade
  previewPositionBracket?: typeof dispatchCopilotBracketPreview
  pendingBracketApply?: typeof dispatchCopilotPendingBracketApply
  resolvePosition?: (input: {
    positionId?: string
    symbol?: string
  }) => {
    id: string
    symbol: string
    side: "LONG" | "SHORT"
    entryPrice: number
    quantity: number
  } | null
}

export function resolveChatActivePage(_input?: {
  pathname?: string
  workspaceTab?: WorkspaceTab | null
}): ChatClientActivePage {
  return "chat"
}

export function resolveAvailableUiActions(input: {
  role: string
  onDesk: boolean
}): ChatFrontendTool[] {
  const actions: ChatFrontendTool[] = ["show_trade_signal", "navigate_to_page"]
  if (input.onDesk) {
    actions.push(
      "draw_chart_indicator",
      "clear_chart_indicators",
      "show_wallet_balance",
      "preview_ghost_trade",
      "preview_position_bracket",
      "modify_position_bracket"
    )
    if (input.role === "pro" || input.role === "admin") {
      actions.push("fill_order_form")
    }
    if (input.role === "admin") {
      actions.push("admin_user_lookup")
    }
  }
  return actions
}

function normalizeTradeSide(value: unknown): "LONG" | "SHORT" | null {
  if (typeof value !== "string") return null
  const key = value.trim().toUpperCase()
  if (key === "LONG" || key === "BUY") return "LONG"
  if (key === "SHORT" || key === "SELL") return "SHORT"
  return null
}

function normalizeTradePrice(value: unknown): number | null {
  const price = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return price
}

/** Parse `show_trade_signal` client tool input into a paper ticket for the UI card. */
export function parseShowTradeSignalArgs(
  args: Record<string, unknown>
): PaperTradeTicket | null {
  const symbolRaw =
    typeof args.symbol === "string" ? args.symbol.trim().toUpperCase() : ""
  const symbol = toChatApiSymbol(symbolRaw)
  const side = normalizeTradeSide(args.direction ?? args.side)
  const entry = normalizeTradePrice(
    args.entry ?? args.entryPrice ?? args.entry_price ?? args.markPrice
  )
  const stopLoss = normalizeTradePrice(args.stopLoss ?? args.stop_loss)
  const takeProfit = normalizeTradePrice(args.takeProfit ?? args.take_profit)
  const leverageRaw =
    typeof args.leverage === "number" ? args.leverage : Number(args.leverage)
  const leverage =
    Number.isFinite(leverageRaw) && leverageRaw > 0 ? leverageRaw : 1
  const quantityRaw =
    typeof args.quantity === "number" ? args.quantity : Number(args.quantity)
  const quantity =
    Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 0
  const setup =
    typeof args.setup === "string" && args.setup.trim()
      ? args.setup.trim()
      : "Trade signal"
  const thesis =
    typeof args.thesis === "string" && args.thesis.trim()
      ? args.thesis.trim()
      : ""

  if (!symbol || !side || entry == null || stopLoss == null || takeProfit == null) {
    return null
  }

  return {
    symbol,
    side,
    quantity,
    markPrice: entry,
    stopLoss,
    takeProfit,
    leverage,
    setup,
    thesis,
  }
}

/** UTC offset for chat `client_context.timezone`, e.g. `+03:30` / `-05:00`. */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const abs = Math.abs(offsetMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/**
 * Browser UTC offset for `client_context.timezone`.
 * Returns `undefined` when unknown so the field can be omitted.
 */
export function resolveClientTimezone(
  now: Date = new Date()
): string | undefined {
  try {
    if (typeof now.getTimezoneOffset !== "function") return undefined
    const offsetMinutes = -now.getTimezoneOffset()
    if (!Number.isFinite(offsetMinutes)) return undefined
    return formatUtcOffset(offsetMinutes)
  } catch {
    return undefined
  }
}

export function buildChatClientContext(input: {
  user?: User | null
  isProUser?: boolean
  symbol?: string
  pathname?: string
  workspaceTab?: WorkspaceTab | null
  locale?: string
  timezone?: string
  deskContext?: DeskContextSnapshot | null
}): {
  active_page: ChatClientActivePage
  active_symbol: string
  role: string
  locale?: string
  timezone?: string
  available_ui_actions: ChatFrontendTool[]
  timeframe?: string
  open_positions?: DeskContextSnapshot["openPositions"]
  draft_order?: DeskContextSnapshot["draft"]
  paper_account?: DeskContextSnapshot["paperAccount"]
} {
  const role = chatRoleFromUser(input.user, input.isProUser)
  const onDesk = false

  const desk = input.deskContext
  const timezone = input.timezone?.trim() || resolveClientTimezone()

  return {
    active_page: resolveChatActivePage({
      pathname: input.pathname ?? APP_PATH,
      workspaceTab: input.workspaceTab,
    }),
    active_symbol: "",
    role,
    locale: input.locale,
    ...(timezone ? { timezone } : {}),
    available_ui_actions: resolveAvailableUiActions({ role, onDesk }),
    timeframe: desk?.timeframe,
    open_positions: desk?.openPositions,
    draft_order: desk?.draft ?? null,
    paper_account: desk?.paperAccount ?? null,
  }
}

function ensureDesk(handlers: ChatClientActionHandlers) {
  handlers.navigate?.(workspaceTabHref(WORKSPACE_TAB_NEWS))
  handlers.openDesk?.()
}

function summarizeAction(
  tool: string,
  label: string,
  applied: boolean
): ChatClientActionSummary {
  return { tool, label, applied }
}

export function executeChatClientActions(
  actions: ChatToolCallResult[] | undefined,
  handlers: ChatClientActionHandlers = {}
): {
  summaries: ChatClientActionSummary[]
  paperTicket?: PaperTradeTicket
  pendingBracket?: {
    requestId: string
    positionId: string
    symbol: string
    side: "LONG" | "SHORT"
    stopLoss?: number | null
    takeProfit?: number | null
    reason?: string
  }
} {
  const summaries: ChatClientActionSummary[] = []
  let paperTicket: PaperTradeTicket | undefined
  let pendingBracket:
    | {
        requestId: string
        positionId: string
        symbol: string
        side: "LONG" | "SHORT"
        stopLoss?: number | null
        takeProfit?: number | null
        reason?: string
      }
    | undefined

  for (const action of actions ?? []) {
    if (action.execution_target === "server") continue
    const args = parseToolActionInput(action.input)

    switch (action.tool_name) {
      case "show_trade_signal": {
        const ticket = parseShowTradeSignalArgs(args)
        if (!ticket) {
          summaries.push(
            summarizeAction(action.tool_name, "Trade signal", false)
          )
          break
        }
        paperTicket = ticket
        handlers.switchSymbol?.(ticket.symbol)
        handlers.previewGhostTrade?.({
          id: `signal:${ticket.symbol}:${Date.now()}`,
          symbol: ticket.symbol,
          side: ticket.side,
          entryPrice: ticket.markPrice,
          quantity: ticket.quantity > 0 ? ticket.quantity : 1,
          stopLoss: ticket.stopLoss,
          takeProfit: ticket.takeProfit,
          label: ticket.setup,
          clearPrevious: true,
        })
        summaries.push(
          summarizeAction(
            action.tool_name,
            `${ticket.side} ${ticket.symbol} signal`,
            true
          )
        )
        break
      }
      case "navigate_to_page": {
        const page = args.page
        if (page === "trading_chart") {
          ensureDesk(handlers)
          handlers.focusDeskPane?.({ pane: "chart" })
          summaries.push(
            summarizeAction(action.tool_name, "Opened chart", true)
          )
          break
        }
        if (page === "wallet_page") {
          ensureDesk(handlers)
          handlers.focusDeskPane?.({ pane: "trade" })
          handlers.showWalletBalance?.({})
          summaries.push(
            summarizeAction(action.tool_name, "Opened wallet", true)
          )
          break
        }
        summaries.push(
          summarizeAction(action.tool_name, "Navigate", false)
        )
        break
      }
      case "draw_chart_indicator": {
        const indicator = parseCopilotChartIndicatorArgs(args)
        if (!indicator) {
          summaries.push(
            summarizeAction(action.tool_name, "Draw indicator", false)
          )
          break
        }
        ensureDesk(handlers)
        handlers.focusDeskPane?.({ pane: "chart" })
        if (indicator.mode === "replace") {
          handlers.clearChartIndicators?.()
        }
        handlers.drawChartIndicator?.(indicator)
        summaries.push(
          summarizeAction(
            action.tool_name,
            `${indicator.type} @ ${indicator.price.toFixed(2)}`,
            true
          )
        )
        break
      }
      case "clear_chart_indicators": {
        ensureDesk(handlers)
        handlers.clearChartIndicators?.()
        summaries.push(
          summarizeAction(action.tool_name, "Cleared AI drawings", true)
        )
        break
      }
      case "fill_order_form": {
        const prefill = parseCopilotOrderPrefillArgs(args)
        ensureDesk(handlers)
        if (prefill.symbol) {
          handlers.switchSymbol?.(prefill.symbol)
        }
        handlers.focusDeskPane?.({ pane: "trade" })
        handlers.fillOrderForm?.(prefill)
        summaries.push(
          summarizeAction(
            action.tool_name,
            `Prefilled ${prefill.side ?? "order"} form`,
            true
          )
        )
        break
      }
      case "show_wallet_balance": {
        ensureDesk(handlers)
        handlers.focusDeskPane?.({ pane: "trade" })
        handlers.showWalletBalance?.({
          asset: typeof args.asset === "string" ? args.asset : undefined,
        })
        summaries.push(
          summarizeAction(action.tool_name, "Highlighted wallet", true)
        )
        break
      }
      case "preview_ghost_trade": {
        const preview = parseCopilotGhostTradeArgs(
          args,
          `ghost:${Date.now()}`
        )
        if (!preview) {
          summaries.push(
            summarizeAction(action.tool_name, "Preview setup", false)
          )
          break
        }
        ensureDesk(handlers)
        handlers.switchSymbol?.(preview.symbol)
        handlers.focusDeskPane?.({ pane: "chart" })
        handlers.previewGhostTrade?.(preview)
        summaries.push(
          summarizeAction(
            action.tool_name,
            `${preview.side} ${preview.symbol} setup on chart`,
            true
          )
        )
        break
      }
      case "preview_position_bracket":
      case "modify_position_bracket": {
        const bracket = parseCopilotBracketArgs(args)
        const position = handlers.resolvePosition?.({
          positionId: bracket.positionId,
          symbol: bracket.symbol,
        })
        if (!position) {
          summaries.push(
            summarizeAction(action.tool_name, "Update brackets", false)
          )
          break
        }
        ensureDesk(handlers)
        handlers.switchSymbol?.(position.symbol)
        handlers.focusDeskPane?.({ pane: "chart" })
        const previewId = `bracket:${Date.now()}`
        handlers.previewPositionBracket?.({
          id: previewId,
          positionId: position.id,
          symbol: position.symbol,
          side: position.side,
          entryPrice: position.entryPrice,
          quantity: position.quantity,
          stopLoss: bracket.stopLoss,
          takeProfit: bracket.takeProfit,
        })
        if (action.tool_name === "modify_position_bracket") {
          pendingBracket = {
            requestId: previewId,
            positionId: position.id,
            symbol: position.symbol,
            side: position.side,
            stopLoss: bracket.stopLoss,
            takeProfit: bracket.takeProfit,
            reason: bracket.reason,
          }
          handlers.pendingBracketApply?.(pendingBracket)
        }
        summaries.push(
          summarizeAction(
            action.tool_name,
            `Bracket preview for ${position.symbol}`,
            true
          )
        )
        break
      }
      case "admin_user_lookup":
        break
      default:
        break
    }
  }

  return { summaries, paperTicket, pendingBracket }
}

export function createChatClientActionHandlers(input: {
  navigate: (href: string) => void
  resolvePosition?: ChatClientActionHandlers["resolvePosition"]
}): ChatClientActionHandlers {
  return {
    navigate: input.navigate,
    openDesk: requestOpenPaperTrading,
    switchSymbol: requestDeskSymbolChange,
    drawChartIndicator: dispatchCopilotChartIndicator,
    clearChartIndicators: dispatchCopilotClearChartIndicators,
    fillOrderForm: dispatchCopilotOrderPrefill,
    showWalletBalance: dispatchCopilotWalletHighlight,
    focusDeskPane: dispatchCopilotDeskPane,
    previewGhostTrade: dispatchCopilotGhostTrade,
    previewPositionBracket: dispatchCopilotBracketPreview,
    pendingBracketApply: dispatchCopilotPendingBracketApply,
    resolvePosition: input.resolvePosition,
  }
}
