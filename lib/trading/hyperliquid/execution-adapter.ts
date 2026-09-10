import type { TradingAdapter, TradingUnsubscribe } from "@/lib/trading/adapter"
import { canExecuteOrders, executionCapabilities } from "@/lib/trading/capabilities"
import {
  HyperliquidTradingAdapter,
  isHyperliquidAccountAddress,
} from "@/lib/trading/hyperliquid/adapter"
import { guardExecutionIntent } from "@/lib/trading/hyperliquid/execution/guard"
import {
  DEFAULT_KILL_SWITCH,
  fetchExecutionKillSwitch,
  type ExecutionKillSwitch,
} from "@/lib/trading/hyperliquid/execution/kill-switch"
import { emitExecutionObservability } from "@/lib/trading/hyperliquid/execution/observability"
import {
  DEFAULT_EXECUTION_RATE_LIMIT,
  ExecutionRateLimiter,
} from "@/lib/trading/hyperliquid/execution/rate-limit"
import {
  auditExecutionEvent,
  createClientOrderId,
  createIdempotencyKey,
  InMemoryIdempotencyStore,
  reconcileAfterTimeout,
  reconcileExecution,
  reserveIdempotencyKey,
  type IdempotencyStore,
} from "@/lib/trading/hyperliquid/execution/security"
import { transitionExecution } from "@/lib/trading/hyperliquid/execution/lifecycle"
import type { HyperliquidExecutionService } from "@/lib/trading/hyperliquid/execution/signer"
import {
  HYPERLIQUID_EXECUTION_NETWORK,
  hyperliquidEndpoints,
} from "@/lib/trading/hyperliquid/network"
import { DirectHyperliquidReadOnlyTransport } from "@/lib/trading/hyperliquid/transport"
import { decimalNumber } from "@/lib/trading/types"
import type {
  AccountSnapshot,
  ClosedTrade,
  ExecutionRecord,
  Fill,
  Market,
  MarketReconciliation,
  Order,
  OrderRequest,
  OrderResult,
  OrderUpdate,
  Position,
  PositionProtectionUpdate,
  TradingCapabilities,
  TradingSnapshot,
} from "@/lib/trading/types"

function unavailableResult(
  message: string,
  code:
    | "CAPABILITY_UNAVAILABLE"
    | "ORDER_NOT_FOUND"
    | "POSITION_NOT_FOUND"
    | "SIGNER_UNAVAILABLE"
    | "INVALID_REQUEST"
    | "NOT_READY" = "CAPABILITY_UNAVAILABLE"
): OrderResult {
  return {
    ok: false,
    status: "REJECTED",
    error: { code, message, retryable: false },
  }
}

function executionToOrderResult(
  result: Awaited<ReturnType<HyperliquidExecutionService["submit"]>>
): OrderResult {
  if (!result.ok) {
    return { ok: false, status: "REJECTED", error: result.error }
  }
  return {
    ok: true,
    status: result.execution.lifecycle === "FILLED" ? "ACCEPTED" : "PENDING",
    order: result.order,
    position: null,
  }
}

export type HyperliquidExecutionAdapterOptions = {
  userId?: string | null
  killSwitch?: ExecutionKillSwitch
  rateLimiter?: ExecutionRateLimiter
  fetchKillSwitch?: () => Promise<ExecutionKillSwitch>
}

export class HyperliquidExecutionAdapter implements TradingAdapter {
  readonly id = "hyperliquid-testnet"
  readonly mode = "real" as const

  private readonly readAdapter: HyperliquidTradingAdapter
  private readonly idempotency: IdempotencyStore
  private readonly rateLimiter: ExecutionRateLimiter
  private readonly fetchKillSwitch: () => Promise<ExecutionKillSwitch>
  private readonly pendingExecutions = new Map<string, ExecutionRecord>()
  private readonly userId: string | null
  private killSwitch: ExecutionKillSwitch = DEFAULT_KILL_SWITCH
  private signerAvailable = false

  constructor(
    readonly address: string,
    readonly walletIdentityId: string,
    private readonly executionService: HyperliquidExecutionService,
    private readonly now: () => number = Date.now,
    idempotencyStore: IdempotencyStore = new InMemoryIdempotencyStore(),
    readAdapter?: HyperliquidTradingAdapter,
    options: HyperliquidExecutionAdapterOptions = {}
  ) {
    if (!isHyperliquidAccountAddress(address)) {
      throw new Error("Invalid Hyperliquid account address")
    }
    if (!walletIdentityId) {
      throw new Error("Verified wallet identity is required for execution")
    }
    this.idempotency = idempotencyStore
    this.userId = options.userId ?? null
    this.rateLimiter =
      options.rateLimiter ?? new ExecutionRateLimiter(DEFAULT_EXECUTION_RATE_LIMIT)
    this.killSwitch = options.killSwitch ?? DEFAULT_KILL_SWITCH
    this.fetchKillSwitch = options.fetchKillSwitch ?? fetchExecutionKillSwitch
    this.readAdapter =
      readAdapter ??
      new HyperliquidTradingAdapter(
        address,
        new DirectHyperliquidReadOnlyTransport(HYPERLIQUID_EXECUTION_NETWORK),
        now
      )
  }

  getCapabilities(): TradingCapabilities {
    return this.signerAvailable && this.killSwitch.globalExecutionEnabled
      ? executionCapabilities()
      : executionCapabilities({
          canSubmitOrders: false,
          canCancelOrders: false,
          canClosePositions: false,
          canTrade: false,
          canPlaceMarketOrders: false,
        })
  }

  getMarkets(): readonly Market[] {
    return this.readAdapter.getMarkets()
  }

  getSnapshot = (): TradingSnapshot => this.readAdapter.getSnapshot()
  getServerSnapshot = (): TradingSnapshot => this.readAdapter.getServerSnapshot()
  getAccount = (): AccountSnapshot => this.readAdapter.getAccount()
  getPositions = (): readonly Position[] => this.readAdapter.getPositions()
  getOpenOrders = (): readonly Order[] => this.readAdapter.getOpenOrders()
  getFills = (): readonly Fill[] => this.readAdapter.getFills()
  getHistory = (): readonly ClosedTrade[] => this.readAdapter.getHistory()

  subscribeSnapshot = (listener: () => void): TradingUnsubscribe =>
    this.readAdapter.subscribeSnapshot(listener)
  subscribeAccount = (listener: (account: AccountSnapshot) => void): TradingUnsubscribe =>
    this.readAdapter.subscribeAccount(listener)
  subscribePositions = (listener: (positions: readonly Position[]) => void): TradingUnsubscribe =>
    this.readAdapter.subscribePositions(listener)
  subscribeOrders = (listener: (orders: readonly Order[]) => void): TradingUnsubscribe =>
    this.readAdapter.subscribeOrders(listener)
  subscribeFills = (listener: (fills: readonly Fill[]) => void): TradingUnsubscribe =>
    this.readAdapter.subscribeFills(listener)

  async initialize(signal?: AbortSignal): Promise<void> {
    await this.readAdapter.initialize(signal)
    this.killSwitch = await this.fetchKillSwitch()
    const status = await this.executionService.getSignerStatus(this.walletIdentityId)
    this.signerAvailable =
      this.killSwitch.globalExecutionEnabled &&
      this.killSwitch.userExecutionEnabled &&
      status.available &&
      status.network === HYPERLIQUID_EXECUTION_NETWORK &&
      status.walletIdentityId === this.walletIdentityId &&
      (status.expiresAt == null || Date.parse(status.expiresAt) > this.now())
  }

  dispose(): void {
    this.readAdapter.dispose()
    this.pendingExecutions.clear()
  }

  private resolveMarkPrice(symbol: string): number | null {
    const position = this.getPositions().find((item) => item.symbol === symbol)
    if (position) return decimalNumber(position.markPrice)
    return null
  }

  private async runExecution(input: {
    action: ExecutionRecord["action"]
    symbol: string
    side?: OrderRequest["side"]
    quantity?: string
    orderId?: string
    exchangeOrderId?: string
    leverage?: number
  }): Promise<OrderResult> {
    const caps = this.getCapabilities()
    if (!canExecuteOrders(caps)) {
      return unavailableResult("Hyperliquid testnet execution is unavailable.", "SIGNER_UNAVAILABLE")
    }

    const requestId = createIdempotencyKey("req")
    const guard = guardExecutionIntent({
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      network: HYPERLIQUID_EXECUTION_NETWORK,
      action: input.action,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      leverage: input.leverage,
      markets: this.getMarkets(),
      account: this.getAccount(),
      positions: this.getPositions(),
      markPrice: this.resolveMarkPrice(input.symbol),
      killSwitch: this.killSwitch,
      rateLimiter: this.rateLimiter,
    })
    if (!guard.ok) {
      return { ok: false, status: "REJECTED", error: guard.error }
    }

    const executionId = createIdempotencyKey("exec")
    const idempotencyKey = createIdempotencyKey("idem")
    const reserved = reserveIdempotencyKey({
      store: this.idempotency,
      idempotencyKey,
      executionId,
    })
    if (!reserved.ok) {
      return { ok: false, status: "REJECTED", error: reserved.error }
    }

    auditExecutionEvent({
      type: "EXECUTION_CREATED",
      executionId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      idempotencyKey,
    })

    const createdAt = this.now()
    let execution: ExecutionRecord = {
      id: executionId,
      idempotencyKey,
      clientOrderId: createClientOrderId(),
      action: input.action,
      lifecycle: "CREATED",
      symbol: input.symbol,
      orderId: input.orderId ?? null,
      exchangeOrderId: input.exchangeOrderId ?? null,
      createdAt,
      updatedAt: createdAt,
      error: null,
    }
    this.pendingExecutions.set(executionId, execution)

    execution = {
      ...execution,
      lifecycle: transitionExecution(execution.lifecycle, "SUBMITTED"),
      updatedAt: this.now(),
    }
    auditExecutionEvent({
      type: "EXECUTION_SUBMITTED",
      executionId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      idempotencyKey,
    })
    emitExecutionObservability({
      phase: "SIGNING_STARTED",
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: execution.clientOrderId,
      idempotencyKey,
    })
    emitExecutionObservability({
      phase: "SUBMITTED",
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: execution.clientOrderId,
      idempotencyKey,
      lifecycle: execution.lifecycle,
    })

    const result = await this.executionService.submit({
      walletIdentityId: this.walletIdentityId,
      idempotencyKey,
      clientOrderId: execution.clientOrderId,
      action: input.action,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      orderId: input.orderId,
      exchangeOrderId: input.exchangeOrderId,
      leverage: input.leverage,
    })

    emitExecutionObservability({
      phase: "EXCHANGE_RESPONSE",
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: execution.clientOrderId,
      idempotencyKey,
      lifecycle: result.execution?.lifecycle ?? null,
      reason: result.ok ? null : result.error.message,
    })

    if (!result.ok) {
      auditExecutionEvent({
        type: "EXECUTION_FAILED",
        executionId,
        userId: this.userId,
        walletIdentityId: this.walletIdentityId,
        idempotencyKey,
        reason: result.error.message,
      })
      emitExecutionObservability({
        phase: "REJECTED",
        requestId,
        userId: this.userId,
        walletIdentityId: this.walletIdentityId,
        symbol: input.symbol,
        action: input.action,
        reason: result.error.message,
      })
      return executionToOrderResult(result)
    }

    if (!result.execution) {
      return executionToOrderResult(result)
    }

    emitExecutionObservability({
      phase: "RECONCILIATION_STARTED",
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: execution.clientOrderId,
      exchangeOrderId: result.execution.exchangeOrderId,
      idempotencyKey,
    })

    execution = reconcileExecution({
      execution: result.execution,
      orders: this.getOpenOrders(),
      positions: this.getPositions(),
      fills: this.getFills(),
      now: this.now(),
    })
    execution = reconcileAfterTimeout(execution, this.now())
    this.pendingExecutions.set(executionId, execution)

    auditExecutionEvent({
      type:
        execution.lifecycle === "RECONCILIATION_REQUIRED"
          ? "EXECUTION_FAILED"
          : "EXECUTION_ACKNOWLEDGED",
      executionId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      idempotencyKey,
      reason: execution.error?.message ?? null,
    })

    emitExecutionObservability({
      phase: "RECONCILIATION_COMPLETED",
      requestId,
      userId: this.userId,
      walletIdentityId: this.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: execution.clientOrderId,
      exchangeOrderId: execution.exchangeOrderId,
      idempotencyKey,
      lifecycle: execution.lifecycle,
      reason: execution.error?.message ?? null,
    })

    if (execution.lifecycle === "FILLED") {
      emitExecutionObservability({
        phase: "FILLED",
        requestId,
        userId: this.userId,
        walletIdentityId: this.walletIdentityId,
        symbol: input.symbol,
        action: input.action,
        clientOrderId: execution.clientOrderId,
        exchangeOrderId: execution.exchangeOrderId,
        idempotencyKey,
        lifecycle: execution.lifecycle,
      })
    }

    await this.readAdapter.initialize()
    return executionToOrderResult({ ...result, execution })
  }

  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    if (request.type !== "MARKET") {
      return unavailableResult("Only market orders are enabled on testnet.", "CAPABILITY_UNAVAILABLE")
    }
    return this.runExecution({
      action: "PLACE_MARKET",
      symbol: request.symbol,
      side: request.side,
      quantity: request.quantity,
      leverage: request.leverage,
    })
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    const order = this.getOpenOrders().find((item) => item.id === orderId)
    if (!order) {
      return unavailableResult("Order not found.", "ORDER_NOT_FOUND")
    }
    return this.runExecution({
      action: "CANCEL_ORDER",
      symbol: order.symbol,
      orderId: order.id,
      exchangeOrderId: order.exchangeOrderId ?? undefined,
    })
  }

  async modifyOrder(_orderId: string, _update: OrderUpdate): Promise<OrderResult> {
    return unavailableResult("Order modification is not enabled on testnet yet.", "CAPABILITY_UNAVAILABLE")
  }

  async closePosition(positionId: string, _referencePrice?: string): Promise<OrderResult> {
    const position = this.getPositions().find((item) => item.id === positionId)
    if (!position) {
      return unavailableResult("Position not found.", "POSITION_NOT_FOUND")
    }
    return this.runExecution({
      action: "CLOSE_POSITION",
      symbol: position.symbol,
      side: position.side === "LONG" ? "SELL" : "BUY",
      quantity: position.quantity,
    })
  }

  async updatePositionProtection(
    _positionId: string,
    _update: PositionProtectionUpdate
  ): Promise<OrderResult> {
    return unavailableResult("Position protection is not enabled on testnet yet.", "CAPABILITY_UNAVAILABLE")
  }

  async updateLeverage(_positionId: string, _leverage: number): Promise<OrderResult> {
    return unavailableResult("Leverage updates are not enabled on testnet yet.", "CAPABILITY_UNAVAILABLE")
  }

  reconcileMarket(_input: MarketReconciliation): void {
    // Real-mode Hyperliquid does not replay local bar reconciliation.
  }

  async reconcileAway(_symbol: string, _signal?: AbortSignal): Promise<void> {
    await this.readAdapter.initialize()
  }

  getNetworkLabel(): string {
    return hyperliquidEndpoints(HYPERLIQUID_EXECUTION_NETWORK).label
  }
}

export function createHyperliquidRealAdapter(input: {
  address: string
  walletIdentityId: string | null
  executionEnabled: boolean
  executionService?: HyperliquidExecutionService
  userId?: string | null
}): TradingAdapter | null {
  if (!isHyperliquidAccountAddress(input.address)) return null
  if (input.executionEnabled && input.walletIdentityId && input.executionService) {
    return new HyperliquidExecutionAdapter(
      input.address,
      input.walletIdentityId,
      input.executionService,
      Date.now,
      new InMemoryIdempotencyStore(),
      undefined,
      { userId: input.userId ?? null }
    )
  }
  return new HyperliquidTradingAdapter(input.address)
}
