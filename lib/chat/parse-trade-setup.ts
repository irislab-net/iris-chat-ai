import { replyContainsIrisSetupBlock } from "@/lib/chat/strip-paper-setup"
import type { PaperSide } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import { calculateRiskBasedSize } from "@/lib/iris-paper-trade/size"

export type ParsedTradeSetup = {
  symbol: string
  side: PaperSide
  entryPrice: number
  stopLoss: number
  takeProfit: number
  leverage: number
  setup: string
  thesis: string
}

const PRICE_CAPTURE = String.raw`([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)`

function firstPrice(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match?.[1]) continue
    const value = Number(String(match[1]).replace(/,/g, ""))
    if (Number.isFinite(value) && value > 0) return value
  }
  return null
}

function firstText(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = match?.[1]?.trim()
    if (value) return value
  }
  return null
}

function parseSide(text: string): PaperSide | null {
  const leadingMatch = text.match(
    /^(?:ETH|BTC|XAU|SOL|BNB|DOGE|AVAX|LINK|ARB|OP)\s+(LONG|SHORT)\b/i
  )
  if (leadingMatch?.[2]) {
    return leadingMatch[2].toUpperCase() === "LONG" ? "LONG" : "SHORT"
  }

  const directionMatch = text.match(
    /(?:direction|جهت)[^:\n]*[:：]\s*\*?\*?\s*(long|short)\b/iu
  )
  if (directionMatch?.[1]) {
    return directionMatch[1].toUpperCase() === "LONG" ? "LONG" : "SHORT"
  }

  const lower = text.toLowerCase()
  if (
    /\bshort\b/.test(lower) ||
    /\bفروش\b/.test(text) ||
    /\bsell\b/.test(lower)
  ) {
    return "SHORT"
  }
  if (
    /\blong\b/.test(lower) ||
    /\bخرید\b/.test(text) ||
    /\bbuy\b/.test(lower)
  ) {
    return "LONG"
  }
  return null
}

function parseSymbol(text: string): string | null {
  const leading = text.match(
    /^(ETH|BTC|XAU|SOL|BNB|DOGE|AVAX|LINK|ARB|OP)\b/i
  )
  if (leading?.[1]) return leading[1].toUpperCase()

  if (/\beth\b|ethereum|اتریوم/i.test(text)) return "ETH"
  if (/\bbtc\b|bitcoin|بیت\s*کوین/i.test(text)) return "BTC"
  return null
}

function parseLeverage(text: string): number {
  const match =
    text.match(new RegExp(String.raw`\bLeverage\s+([0-9]+)\s*x\b`, "i")) ??
    text.match(
      /(?:leverage|اهرم)[^0-9]*[:：]?\s*\*?\*?\s*([0-9]+)\s*x?/iu
    )
  if (!match?.[1]) return 5
  const value = Number(match[1])
  if (!Number.isFinite(value) || value < 1) return 5
  return Math.min(Math.trunc(value), 50)
}

/** Best-effort parse when the model describes a setup in prose (no structured tool). */
export function parseTradeSetupFromText(
  text: string
): ParsedTradeSetup | null {
  const raw = text.trim()
  if (!raw) return null

  const side = parseSide(raw)
  const symbol = parseSymbol(raw) ?? "ETH"
  const stopLoss = firstPrice(raw, [
    new RegExp(String.raw`(?:stop\s*loss|sl|حد\s*ضرر)[^0-9]*[:：]?\s*\*?\*?\s*${PRICE_CAPTURE}`, "i"),
    new RegExp(String.raw`\bSL\s+${PRICE_CAPTURE}`, "i"),
  ])
  const takeProfit = firstPrice(raw, [
    new RegExp(String.raw`(?:take\s*profit|tp|حد\s*سود)[^0-9]*[:：]?\s*\*?\*?\s*${PRICE_CAPTURE}`, "i"),
    new RegExp(String.raw`\bTP\s+${PRICE_CAPTURE}`, "i"),
  ])
  const entryPrice = firstPrice(raw, [
    new RegExp(
      String.raw`(?:entry(?:\s+price)?|mark|current(?:\s+live)?(?:\s+price)?|قیمت\s*فعلی)[^0-9]*[:：]?\s*\*?\*?\s*${PRICE_CAPTURE}`,
      "i"
    ),
    new RegExp(String.raw`\bEntry\s+${PRICE_CAPTURE}`, "i"),
    new RegExp(String.raw`(?:@|at)\s+${PRICE_CAPTURE}`, "i"),
  ])

  if (!side || stopLoss == null || takeProfit == null) return null

  const mark = entryPrice ?? inferEntryFromSide(side, stopLoss, takeProfit)
  if (mark == null) return null

  if (side === "LONG") {
    if (!(stopLoss < mark && takeProfit > mark)) return null
  } else if (!(stopLoss > mark && takeProfit < mark)) {
    return null
  }

  const setup =
    firstText(raw, [
      /\bSetup:\s*(.+?)\s+Entry\b/i,
      /(?:setup(?:\s+name)?|ستاپ)[^:\n]*[:：]\s*\*?\*?\s*([^\n*]+?)(?:\n|\*\*)/iu,
    ]) ?? "Exur signal"

  const thesis =
    firstText(raw, [
      /(?:thesis|دلیل)[^:\n]*[:：]\s*\*?\*?\s*([\s\S]+?)(?:\n\n|\*\*|$)/iu,
    ]) ?? "Parsed from assistant reply"

  return {
    symbol,
    side,
    entryPrice: mark,
    stopLoss,
    takeProfit,
    leverage: parseLeverage(raw),
    setup,
    thesis,
  }
}

function inferEntryFromSide(
  side: PaperSide,
  stopLoss: number,
  takeProfit: number
): number | null {
  if (side === "LONG") {
    if (stopLoss >= takeProfit) return null
    return stopLoss + (takeProfit - stopLoss) * 0.35
  }
  if (stopLoss <= takeProfit) return null
  return stopLoss - (stopLoss - takeProfit) * 0.35
}

export function parsedSetupToPaperTicket(
  setup: ParsedTradeSetup
): PaperTradeTicket | null {
  const sized = calculateRiskBasedSize({
    side: setup.side,
    markPrice: setup.entryPrice,
    stopLoss: setup.stopLoss,
    leverage: setup.leverage,
  })
  if (!sized.ok) return null

  return {
    symbol: setup.symbol,
    side: setup.side,
    quantity: sized.quantity,
    markPrice: setup.entryPrice,
    stopLoss: setup.stopLoss,
    takeProfit: setup.takeProfit,
    leverage: setup.leverage,
    setup: setup.setup,
    thesis: setup.thesis,
  }
}

export function parsePaperTicketFromAssistantText(
  text: string
): PaperTradeTicket | null {
  const setup = parseTradeSetupFromText(text)
  if (!setup) return null
  return parsedSetupToPaperTicket(setup)
}

/** True when assistant text is an explicit setup block — not casual SL/TP mentions. */
export function isStructuredSignalSetupContent(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false
  if (replyContainsIrisSetupBlock(trimmed)) return true

  if (
    /^(?:ETH|BTC|XAU|SOL|BNB|DOGE|AVAX|LINK|ARB|OP)\s+(LONG|SHORT)\s+Setup:/im.test(
      trimmed
    )
  ) {
    return true
  }

  return (
    /^Setup:/im.test(trimmed) &&
    /^Entry\b/im.test(trimmed) &&
    /^SL\b/im.test(trimmed) &&
    /^TP\b/im.test(trimmed)
  )
}

export function resolvePaperTicketFromChatTurn(input: {
  userMessage: string
  assistantMessage: string
}): PaperTradeTicket | null {
  const assistantTicket = parsePaperTicketFromAssistantText(
    input.assistantMessage
  )
  if (assistantTicket) return assistantTicket

  return parsePaperTicketFromAssistantText(
    `${input.userMessage}\n${input.assistantMessage}`
  )
}

export function resolvePaperTicketForAssistantMessage(input: {
  content: string
  paperTicket?: PaperTradeTicket
}): PaperTradeTicket | null {
  // Integrity: only trust an explicit ticket (API client_actions / recovery).
  // Do not invent Signal cards from assistant prose.
  return input.paperTicket ?? null
}

