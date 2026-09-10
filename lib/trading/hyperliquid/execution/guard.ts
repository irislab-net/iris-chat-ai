import type {
  AccountSnapshot,
  ExecutionAction,
  Market,
  OrderSide,
  Position,
  TradingError,
} from "@/lib/trading/types"
import type { ExecutionKillSwitch } from "@/lib/trading/hyperliquid/execution/kill-switch"
import { isExecutionAllowed } from "@/lib/trading/hyperliquid/execution/kill-switch"
import { emitExecutionObservability } from "@/lib/trading/hyperliquid/execution/observability"
import type { ExecutionRateLimiter } from "@/lib/trading/hyperliquid/execution/rate-limit"
import {
  validateOrderIntent,
  type OrderIntentValidationInput,
} from "@/lib/trading/hyperliquid/execution/validation"
import { assertExecutionNetwork, type HyperliquidNetwork } from "@/lib/trading/hyperliquid/network"

export type ExecutionGuardInput = {
  requestId: string
  userId: string | null
  walletIdentityId: string
  network: HyperliquidNetwork
  action: ExecutionAction
  symbol: string
  side?: OrderSide
  quantity?: string
  leverage?: number
  markets: readonly Market[]
  account: AccountSnapshot
  positions: readonly Position[]
  markPrice: number | null
  killSwitch: ExecutionKillSwitch
  rateLimiter: ExecutionRateLimiter
}

export type ExecutionGuardResult =
  | { ok: true }
  | { ok: false; error: TradingError }

function blocked(code: TradingError["code"], message: string): ExecutionGuardResult {
  return { ok: false, error: { code, message, retryable: false } }
}

/** Pre-submit guard — frontend intent check; backend must repeat all validations. */
export function guardExecutionIntent(input: ExecutionGuardInput): ExecutionGuardResult {
  emitExecutionObservability({
    phase: "INTENT_CREATED",
    requestId: input.requestId,
    userId: input.userId,
    walletIdentityId: input.walletIdentityId,
    symbol: input.symbol,
    action: input.action,
  })

  try {
    assertExecutionNetwork(input.network)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unsupported execution network."
    emitExecutionObservability({
      phase: "VALIDATION_FAILED",
      requestId: input.requestId,
      userId: input.userId,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      reason: message,
    })
    return blocked("INVALID_REQUEST", message)
  }

  const killSwitch = isExecutionAllowed(input.killSwitch, input.symbol)
  if (!killSwitch.allowed) {
    emitExecutionObservability({
      phase: "KILL_SWITCH_BLOCKED",
      requestId: input.requestId,
      userId: input.userId,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      reason: killSwitch.reason,
    })
    return blocked("NOT_READY", killSwitch.reason)
  }

  if (input.userId) {
    const rate = input.rateLimiter.checkAll({
      userId: input.userId,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
    })
    if (!rate.allowed) {
      emitExecutionObservability({
        phase: "RATE_LIMIT_BLOCKED",
        requestId: input.requestId,
        userId: input.userId,
        walletIdentityId: input.walletIdentityId,
        symbol: input.symbol,
        action: input.action,
        reason: `Rate limit exceeded (${rate.scope}).`,
      })
      return blocked("INVALID_REQUEST", "Too many execution requests. Please wait and retry.")
    }
  }

  const validationInput: OrderIntentValidationInput = {
    action: input.action,
    symbol: input.symbol,
    side: input.side,
    quantity: input.quantity,
    leverage: input.leverage,
    markets: input.markets,
    account: input.account,
    positions: input.positions,
    markPrice: input.markPrice,
  }
  const validation = validateOrderIntent(validationInput)
  if (!validation.ok) {
    emitExecutionObservability({
      phase: "VALIDATION_FAILED",
      requestId: input.requestId,
      userId: input.userId,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      reason: validation.error.message,
    })
    return validation
  }

  emitExecutionObservability({
    phase: "VALIDATION_PASSED",
    requestId: input.requestId,
    userId: input.userId,
    walletIdentityId: input.walletIdentityId,
    symbol: input.symbol,
    action: input.action,
  })

  if (input.userId) {
    input.rateLimiter.recordAll({
      userId: input.userId,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
    })
  }

  return { ok: true }
}
