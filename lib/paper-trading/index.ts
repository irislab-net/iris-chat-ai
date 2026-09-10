export type {
  MarginMode,
  OpenPaperTradeInput,
  PaperAccount,
  PaperBarHit,
  PaperClosedTrade,
  PaperCloseReason,
  PaperExecutionReason,
  PaperFill,
  PaperOrder,
  PaperOrderSide,
  PaperOrderStatus,
  PaperOrderType,
  PaperPosition,
  PaperPositionSource,
  PaperSide,
  PaperState,
  PlacePaperOrderInput,
} from "@/lib/paper-trading/types"

export {
  PAPER_DEFAULT_BALANCE,
  PAPER_MAX_BUDGET,
  PAPER_MIN_BUDGET,
  PAPER_FILLS_LIMIT,
  PAPER_HISTORY_LIMIT,
  PAPER_ORDERS_LIMIT,
  PAPER_RECONCILE_TIMEFRAME,
  PAPER_STATE_VERSION,
  PAPER_STORAGE_KEY,
  getPaperStartingBalance,
  resetPaperAccountToBudget,
  validatePaperBudget,
  addIsolatedMargin,
  applyFillToNetPosition,
  cancelPaperOrder,
  changePositionLeverage,
  closePaperPosition,
  emptyPaperAccount,
  emptyPaperState,
  evaluateBarExecutions,
  evaluateBarHit,
  historyForSymbol,
  hitFromBar,
  liquidatePosition,
  markPaperPrice,
  modifyPaperOrder,
  modifyPaperPosition,
  openOrdersForSymbol,
  openPaperTrade,
  orderSideToPositionSide,
  ordersTouchingBar,
  parsePaperState,
  placePaperOrder,
  pnlOf,
  pnlPct,
  positionForSymbol,
  processLiquidations,
  reconcilePaperBars,
  removeIsolatedMargin,
  sideToOrderSide,
} from "@/lib/paper-trading/engine"

export {
  PAPER_EXECUTION_DEFAULTS,
  applyMarketSlippage,
  feeOnNotional,
  getPaperExecution,
  limitFillFee,
  makerFee,
  marketFillFee,
  marketFillPrice,
  takerFee,
  usePaperExecution,
} from "@/lib/paper-trading/execution"
export type { PaperExecutionConfig } from "@/lib/paper-trading/execution"

export {
  PAPER_DEFAULT_LEVERAGE,
  PAPER_DEFAULT_MAX_LEVERAGE,
  TIERED_MARGIN_NOT_MODELED,
  getMaxLeverage,
  getPaperInstrument,
  maintenanceMarginRate,
  refreshPaperInstruments,
  usePaperInstrumentMaxLeverage,
  validateLeverage,
} from "@/lib/paper-trading/instruments"

export {
  availableBalance,
  calculateAccountMarginView,
  calculateInitialMargin,
  calculateMaintenanceMargin,
  crossAccountEquity,
  isolatedAllocated,
  positionNotional,
  validateMarginForOpen,
} from "@/lib/paper-trading/margin"
export type { PaperAccountMarginView } from "@/lib/paper-trading/margin"

export {
  calculateCrossLiquidationPrice,
  calculateIsolatedLiquidationPrice,
  calculateLiquidationPrice,
  isCrossAccountLiquidatable,
  isIsolatedLiquidatable,
  isPositionLiquidatable,
} from "@/lib/paper-trading/liquidation"

export {
  isValidStopLoss,
  isValidTakeProfit,
  snapPaperPrice,
  stopLossError,
  takeProfitError,
} from "@/lib/paper-trading/levels"

export type {
  PaperTradeDraft,
  TradeInteractionMode,
} from "@/lib/paper-trading/draft"

export {
  DRAFT_POSITION_ID,
  clearDraftLevel,
  commitDraftStopLoss,
  commitDraftTakeProfit,
  createPaperTradeDraft,
  dragDraftLevel,
  isValidDraftStopLoss,
  isValidDraftTakeProfit,
  projectedPnlAt,
  snapDraftPrice,
} from "@/lib/paper-trading/draft"

export { loadPaperState, savePaperState } from "@/lib/paper-trading/persist"

export {
  getPaperServerSnapshot,
  getPaperSnapshot,
  paperAddIsolatedMargin,
  paperApplyMark,
  paperCancelOrder,
  paperChangeLeverage,
  paperClosePosition,
  paperModifyPosition,
  paperModifyOrder,
  paperOpenTrade,
  paperPlaceOrder,
  paperReconcile,
  paperReconcileAway,
  paperRemoveIsolatedMargin,
  setPaperBudget,
  subscribePaperStore,
} from "@/lib/paper-trading/store"

export { formatPaperPrice } from "@/lib/paper-trading/format"
