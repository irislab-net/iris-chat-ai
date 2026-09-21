import type { ChatToolCallResult } from "@/lib/api/types"
import {
  parseToolActionInput,
  chatRoleFromUser,
  toChatApiSymbol,
} from "@/lib/api/chat"
import type { User } from "@/lib/api/types"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import { APP_PATH } from "@/lib/site"
import type { WorkspaceTab } from "@/lib/workspace-tab"

export const CHAT_FRONTEND_TOOLS = [
  "show_trade_signal",
  "navigate_to_page",
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
}

export function resolveChatActivePage(_input?: {
  pathname?: string
  workspaceTab?: WorkspaceTab | null
}): ChatClientActivePage {
  return "chat"
}

export function resolveAvailableUiActions(input: {
  role: string
  onDesk?: boolean
}): ChatFrontendTool[] {
  const actions: ChatFrontendTool[] = ["show_trade_signal", "navigate_to_page"]
  if (input.role === "admin") {
    actions.push("admin_user_lookup")
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

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** Parse `show_trade_signal` client tool input into a paper ticket for the UI card. */
export function parseShowTradeSignalArgs(
  args: Record<string, unknown>
): PaperTradeTicket | null {
  const symbolRaw =
    typeof args.symbol === "string" ? args.symbol.trim().toUpperCase() : ""
  // Do not invent a symbol (toChatApiSymbol falls back to ETH).
  if (!symbolRaw) return null
  const symbol = toChatApiSymbol(symbolRaw)
  const side = normalizeTradeSide(args.direction ?? args.side)
  const entry = normalizeTradePrice(
    args.entry ?? args.entryPrice ?? args.entry_price ?? args.markPrice
  )
  const stopLoss = normalizeTradePrice(args.stopLoss ?? args.stop_loss)
  const takeProfit = normalizeTradePrice(args.takeProfit ?? args.take_profit)
  const leverageRaw =
    typeof args.leverage === "number" ? args.leverage : Number(args.leverage)
  // 0 = not provided — card hides leverage rather than inventing 1x.
  const leverage =
    Number.isFinite(leverageRaw) && leverageRaw > 0 ? leverageRaw : 0
  const quantityRaw =
    typeof args.quantity === "number" ? args.quantity : Number(args.quantity)
  // 0 = not provided — card hides size rather than showing a fake 0 as data.
  const quantity =
    Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 0
  const setup = optionalTrimmedString(args.setup) ?? ""
  const thesis = optionalTrimmedString(args.thesis) ?? ""
  const timeHorizon = optionalTrimmedString(
    args.timeHorizon ?? args.time_horizon
  )
  const entryReason = optionalTrimmedString(
    args.entryReason ?? args.entry_reason
  )
  const stopLossReason = optionalTrimmedString(
    args.stopLossReason ?? args.stop_loss_reason
  )
  const takeProfitReason = optionalTrimmedString(
    args.takeProfitReason ?? args.take_profit_reason
  )

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
    ...(timeHorizon ? { timeHorizon } : {}),
    ...(entryReason ? { entryReason } : {}),
    ...(stopLossReason ? { stopLossReason } : {}),
    ...(takeProfitReason ? { takeProfitReason } : {}),
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
}): {
  active_page: ChatClientActivePage
  active_symbol: string
  role: string
  locale?: string
  timezone?: string
  available_ui_actions: ChatFrontendTool[]
} {
  const role = chatRoleFromUser(input.user, input.isProUser)
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
    available_ui_actions: resolveAvailableUiActions({ role }),
  }
}

function summarizeAction(
  tool: string,
  label: string,
  applied: boolean
): ChatClientActionSummary {
  return { tool, label, applied }
}

function parseNoTradeReason(args: Record<string, unknown>): string | undefined {
  return (
    optionalTrimmedString(args.reason) ??
    optionalTrimmedString(args.no_trade_reason) ??
    optionalTrimmedString(args.noTradeReason) ??
    optionalTrimmedString(args.message)
  )
}

export function executeChatClientActions(
  actions: ChatToolCallResult[] | undefined,
  _handlers: ChatClientActionHandlers = {}
): {
  summaries: ChatClientActionSummary[]
  paperTicket?: PaperTradeTicket
  noTradeReason?: string
} {
  const summaries: ChatClientActionSummary[] = []
  let paperTicket: PaperTradeTicket | undefined
  let noTradeReason: string | undefined

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
        summaries.push(
          summarizeAction(
            action.tool_name,
            `${ticket.side} ${ticket.symbol} signal`,
            true
          )
        )
        break
      }
      case "no_trade": {
        const reason = parseNoTradeReason(args)
        if (!reason) {
          summaries.push(summarizeAction(action.tool_name, "No trade", false))
          break
        }
        noTradeReason = reason
        summaries.push(summarizeAction(action.tool_name, "No trade", true))
        break
      }
      case "navigate_to_page": {
        summaries.push(
          summarizeAction(action.tool_name, "Navigate", false)
        )
        break
      }
      case "admin_user_lookup":
        break
      default:
        break
    }
  }

  return { summaries, paperTicket, noTradeReason }
}

export function createChatClientActionHandlers(input: {
  navigate: (href: string) => void
}): ChatClientActionHandlers {
  return {
    navigate: input.navigate,
  }
}
