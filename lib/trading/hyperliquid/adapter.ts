import type { TradingAdapter, TradingUnsubscribe } from "@/lib/trading/adapter"
import { readOnlyCapabilities } from "@/lib/trading/capabilities"
import {
  mapHyperliquidAccount,
  mapHyperliquidFills,
  mapHyperliquidOrders,
  mapHyperliquidPositions,
  mapHyperliquidSnapshot,
} from "@/lib/trading/hyperliquid/mapping"
import {
  DirectHyperliquidReadOnlyTransport,
  type HyperliquidReadOnlyTransport,
  type HyperliquidStreamStatus,
} from "@/lib/trading/hyperliquid/transport"
import type {
  AccountSnapshot,
  ClosedTrade,
  Fill,
  Market,
  Order,
  OrderRequest,
  OrderResult,
  OrderUpdate,
  Position,
  PositionProtectionUpdate,
  TradingCapabilities,
  TradingSnapshot,
} from "@/lib/trading/types"

const WALLET_ADDRESS = /^0x[a-fA-F0-9]{40}$/

export function isHyperliquidAccountAddress(value: string | null | undefined): value is string {
  return typeof value === "string" && WALLET_ADDRESS.test(value)
}

function unavailableAccount(
  address: string,
  status: AccountSnapshot["status"] = "CONNECTING"
): AccountSnapshot {
  return {
    providerId: "hyperliquid",
    accountId: address,
    status,
    balances: [],
    equity: null,
    availableBalance: null,
    initialMarginUsed: null,
    maintenanceMarginUsed: null,
    funding: null,
    updatedAt: null,
  }
}

function initialSnapshot(address: string): TradingSnapshot {
  return {
    account: unavailableAccount(address),
    positions: [],
    openOrders: [],
    fills: [],
    history: [],
  }
}

function readOnlyResult(): OrderResult {
  return {
    ok: false,
    status: "REJECTED",
    error: {
      code: "CAPABILITY_UNAVAILABLE",
      message: "Hyperliquid is connected in read-only mode.",
      retryable: false,
    },
  }
}

export class HyperliquidTradingAdapter implements TradingAdapter {
  readonly id = "hyperliquid-read-only"
  readonly mode = "real" as const

  private markets: Market[] = []
  private snapshot: TradingSnapshot
  private readonly serverSnapshot: TradingSnapshot
  private readonly listeners = new Set<() => void>()
  private stopStream: (() => void) | null = null
  private staleTimer: ReturnType<typeof setInterval> | null = null
  private initialized = false

  constructor(
    readonly address: string,
    private readonly transport: HyperliquidReadOnlyTransport =
      new DirectHyperliquidReadOnlyTransport(),
    private readonly now: () => number = Date.now,
    private readonly staleAfterMs = 60_000
  ) {
    if (!isHyperliquidAccountAddress(address)) {
      throw new Error("Invalid Hyperliquid account address")
    }
    this.snapshot = initialSnapshot(address)
    this.serverSnapshot = initialSnapshot(address)
  }

  getCapabilities(): TradingCapabilities {
    return readOnlyCapabilities()
  }

  getMarkets(): readonly Market[] {
    return this.markets
  }

  getSnapshot = (): TradingSnapshot => this.snapshot
  getServerSnapshot = (): TradingSnapshot => this.serverSnapshot

  getAccount(): AccountSnapshot {
    return this.snapshot.account
  }

  getPositions(): readonly Position[] {
    return this.snapshot.positions
  }

  getOpenOrders(): readonly Order[] {
    return this.snapshot.openOrders
  }

  getFills(): readonly Fill[] {
    return this.snapshot.fills
  }

  getHistory(): readonly ClosedTrade[] {
    return this.snapshot.history
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  private setFailure(): void {
    const hasSnapshot = this.snapshot.account.updatedAt != null
    this.snapshot = {
      ...this.snapshot,
      account: {
        ...this.snapshot.account,
        status: hasSnapshot ? "STALE" : "ERROR",
      },
    }
    this.emit()
  }

  private applyStreamStatus(status: HyperliquidStreamStatus): void {
    if (status === "DISCONNECTED" || status === "ERROR") this.setFailure()
  }

  evaluateStaleness(): void {
    const updatedAt = this.snapshot.account.updatedAt
    if (
      updatedAt != null &&
      this.now() - updatedAt > this.staleAfterMs &&
      this.snapshot.account.status === "READY"
    ) {
      this.snapshot = {
        ...this.snapshot,
        account: { ...this.snapshot.account, status: "STALE" },
      }
      this.emit()
    }
  }

  async initialize(signal?: AbortSignal): Promise<void> {
    if (!this.initialized) {
      this.initialized = true
      this.stopStream = this.transport.subscribe(this.address, {
        onStatus: (status) => this.applyStreamStatus(status),
        onClearinghouseState: (data) => {
          try {
            const updatedAt = this.now()
            this.snapshot = {
              ...this.snapshot,
              account: mapHyperliquidAccount(data, this.address, updatedAt),
              positions: mapHyperliquidPositions(data),
            }
            this.emit()
          } catch {
            this.setFailure()
          }
        },
        onOpenOrders: (data) => {
          try {
            this.snapshot = { ...this.snapshot, openOrders: mapHyperliquidOrders(data) }
            this.emit()
          } catch {
            this.setFailure()
          }
        },
        onFills: (data) => {
          try {
            const incoming = mapHyperliquidFills(data)
            const byId = new Map(
              [...this.snapshot.fills, ...incoming].map((fill) => [fill.id, fill])
            )
            this.snapshot = {
              ...this.snapshot,
              fills: [...byId.values()]
                .sort((left, right) => right.createdAt - left.createdAt)
                .slice(0, 2_000),
            }
            this.emit()
          } catch {
            this.setFailure()
          }
        },
      })
      if (typeof window !== "undefined") {
        this.staleTimer = setInterval(() => this.evaluateStaleness(), 15_000)
      }
    }

    try {
      const raw = await this.transport.fetchSnapshot(this.address, signal)
      const mapped = mapHyperliquidSnapshot(raw, this.address, this.now())
      this.markets = mapped.markets
      this.snapshot = mapped.snapshot
      this.emit()
    } catch (error) {
      if (signal?.aborted) return
      this.setFailure()
      void error
    }
  }

  dispose(): void {
    this.stopStream?.()
    this.stopStream = null
    if (this.staleTimer) clearInterval(this.staleTimer)
    this.staleTimer = null
    this.initialized = false
  }

  placeOrder(_request: OrderRequest): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  cancelOrder(_orderId: string): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  modifyOrder(_orderId: string, _update: OrderUpdate): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  closePosition(_positionId: string, _referencePrice?: string): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  updatePositionProtection(
    _positionId: string,
    _update: PositionProtectionUpdate
  ): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  updateLeverage(_positionId: string, _leverage: number): Promise<OrderResult> {
    return Promise.resolve(readOnlyResult())
  }

  subscribeSnapshot = (listener: () => void): TradingUnsubscribe => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribeAccount(listener: (account: AccountSnapshot) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.account))
  }

  subscribePositions(listener: (positions: readonly Position[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.positions))
  }

  subscribeOrders(listener: (orders: readonly Order[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.openOrders))
  }

  subscribeFills(listener: (fills: readonly Fill[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.fills))
  }
}
