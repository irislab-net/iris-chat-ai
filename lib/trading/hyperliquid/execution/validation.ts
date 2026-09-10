import type {
  AccountSnapshot,
  ExecutionAction,
  Market,
  OrderSide,
  Position,
  TradingError,
} from "@/lib/trading/types"
import { decimalNumber } from "@/lib/trading/types"

export type OrderIntentValidationInput = {
  action: ExecutionAction
  symbol: string
  side?: OrderSide
  quantity?: string
  leverage?: number
  markets: readonly Market[]
  account: AccountSnapshot
  positions: readonly Position[]
  /** Mark price from market data — never from the client order request. */
  markPrice: number | null
  maxSlippageBps?: number
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: TradingError }

const DEFAULT_MAX_SLIPPAGE_BPS = 100
const MIN_NOTIONAL_USD = 10

function reject(code: TradingError["code"], message: string): ValidationResult {
  return { ok: false, error: { code, message, retryable: false } }
}

export function validateSupportedMarket(
  symbol: string,
  markets: readonly Market[]
): Market | null {
  const market = markets.find(
    (item) => item.symbol.toUpperCase() === symbol.toUpperCase() && item.status === "ACTIVE"
  )
  return market ?? null
}

export function validateOrderSize(input: {
  quantity: string
  market: Market
  markPrice: number | null
  availableBalance: number | null
  leverage?: number
}): ValidationResult {
  const quantity = decimalNumber(input.quantity)
  if (!(quantity > 0)) {
    return reject("INVALID_REQUEST", "Order size must be greater than zero.")
  }

  const factor = 10 ** input.market.sizeDecimals
  const rounded = Math.round(quantity * factor) / factor
  if (Math.abs(rounded - quantity) > 1 / factor / 10) {
    return reject(
      "INVALID_REQUEST",
      `Order size exceeds allowed precision (${input.market.sizeDecimals} decimals).`
    )
  }

  if (input.markPrice != null && input.markPrice > 0) {
    const notional = quantity * input.markPrice
    if (notional < MIN_NOTIONAL_USD) {
      return reject("INVALID_REQUEST", "Order notional is below the minimum size.")
    }
    const lev = input.leverage ?? 1
    const requiredMargin = notional / lev
    if (
      input.availableBalance != null &&
      input.availableBalance > 0 &&
      requiredMargin > input.availableBalance
    ) {
      return reject("INVALID_REQUEST", "Insufficient available margin for this order.")
    }
  }

  return { ok: true }
}

export function validateLeverageLimit(input: {
  leverage: number | undefined
  market: Market
}): ValidationResult {
  if (input.leverage == null) return { ok: true }
  if (!(input.leverage > 0)) {
    return reject("INVALID_REQUEST", "Leverage must be greater than zero.")
  }
  if (input.leverage > input.market.maxLeverage) {
    return reject(
      "INVALID_REQUEST",
      `Leverage exceeds the maximum allowed (${input.market.maxLeverage}x).`
    )
  }
  return { ok: true }
}

/** Server-side validation contract — must run before signing. */
export function validateOrderIntent(input: OrderIntentValidationInput): ValidationResult {
  const market = validateSupportedMarket(input.symbol, input.markets)
  if (!market) {
    return reject("INVALID_REQUEST", "This market is not supported for execution.")
  }

  if (input.account.status !== "READY") {
    return reject("NOT_READY", "Account state is not ready for execution.")
  }

  const leverageCheck = validateLeverageLimit({
    leverage: input.leverage,
    market,
  })
  if (!leverageCheck.ok) return leverageCheck

  if (input.action === "PLACE_MARKET") {
    if (!input.side) return reject("INVALID_REQUEST", "Order side is required.")
    if (!input.quantity) return reject("INVALID_REQUEST", "Order quantity is required.")
    return validateOrderSize({
      quantity: input.quantity,
      market,
      markPrice: input.markPrice,
      availableBalance: decimalNumber(input.account.availableBalance),
      leverage: input.leverage,
    })
  }

  if (input.action === "CLOSE_POSITION") {
    const position = input.positions.find(
      (item) => item.symbol.toUpperCase() === input.symbol.toUpperCase()
    )
    if (!position) {
      return reject("POSITION_NOT_FOUND", "No open position exists for this market.")
    }
    const quantity = input.quantity ?? position.quantity
    return validateOrderSize({
      quantity,
      market,
      markPrice: input.markPrice ?? decimalNumber(position.markPrice),
      availableBalance: decimalNumber(input.account.availableBalance),
      leverage: position.leverage.value,
    })
  }

  if (input.action === "CANCEL_ORDER") {
    return { ok: true }
  }

  return reject("CAPABILITY_UNAVAILABLE", "This operation is not supported.")
}

export function validateReferencePriceSlippage(input: {
  referencePrice: number
  markPrice: number
  maxSlippageBps?: number
}): ValidationResult {
  const maxBps = input.maxSlippageBps ?? DEFAULT_MAX_SLIPPAGE_BPS
  const diffBps = (Math.abs(input.referencePrice - input.markPrice) / input.markPrice) * 10_000
  if (diffBps > maxBps) {
    return reject(
      "INVALID_REQUEST",
      "Reference price deviates too far from the current market price."
    )
  }
  return { ok: true }
}
