import type {
  AccountSnapshot,
  ClosedTrade,
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
  TradingMode,
  TradingSnapshot,
} from "@/lib/trading/types"

export type TradingUnsubscribe = () => void

export interface TradingAdapter {
  readonly id: string
  readonly mode: TradingMode

  getCapabilities(): TradingCapabilities
  getMarkets(): readonly Market[]
  getSnapshot(): TradingSnapshot
  getServerSnapshot(): TradingSnapshot
  getAccount(): AccountSnapshot
  getPositions(): readonly Position[]
  getOpenOrders(): readonly Order[]
  getFills(): readonly Fill[]
  getHistory(): readonly ClosedTrade[]
  initialize?(signal?: AbortSignal): Promise<void>
  dispose?(): void

  placeOrder(request: OrderRequest): Promise<OrderResult>
  cancelOrder(orderId: string): Promise<OrderResult>
  modifyOrder(orderId: string, update: OrderUpdate): Promise<OrderResult>
  closePosition(positionId: string, referencePrice?: string): Promise<OrderResult>
  updatePositionProtection(
    positionId: string,
    update: PositionProtectionUpdate
  ): Promise<OrderResult>
  updateLeverage(positionId: string, leverage: number): Promise<OrderResult>
  addIsolatedMargin?(positionId: string, amount: string): Promise<OrderResult>
  removeIsolatedMargin?(positionId: string, amount: string): Promise<OrderResult>

  reconcileMarket?(input: MarketReconciliation): void
  reconcileAway?(symbol: string, signal?: AbortSignal): Promise<void>

  subscribeSnapshot(listener: () => void): TradingUnsubscribe
  subscribeAccount(listener: (account: AccountSnapshot) => void): TradingUnsubscribe
  subscribePositions(listener: (positions: readonly Position[]) => void): TradingUnsubscribe
  subscribeOrders(listener: (orders: readonly Order[]) => void): TradingUnsubscribe
  subscribeFills(listener: (fills: readonly Fill[]) => void): TradingUnsubscribe
}
