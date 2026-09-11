"use client"

/**
 * Bottom trading panel adapted from OpenCharts BottomPanel + PositionsTable (MIT).
 */
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  formatTradingPnl,
  formatTradingPnlPct,
  formatTradingPrice,
  formatTradingQty,
  tradingPnlPct,
} from "@/lib/trading/format"
import {
  decimalNumber,
  type ClosedTrade,
  type Order,
  type Position,
} from "@/lib/trading/types"
import { cn } from "@/lib/utils"

import {
  bookListPulseClass,
  bookListPulseDismissHandlers,
  type BookListPulseEntry,
  type BookListPulseSignal,
  useBookListPulse,
} from "@/components/paper-trading/book-list-pulse"
import {
  ClosedTradeContextMenu,
  PositionCloseButton,
  PositionContextMenu,
  PositionIrisButton,
  PositionMoreMenu,
  PositionTpslButton,
} from "@/components/paper-trading/book-position-actions"
import { PositionHealthBadge } from "@/components/paper-trading/position-health-badge"

type BottomTradingPanelProps = {
  positions: Position[]
  orders: Order[]
  history: ClosedTrade[]
  markPrice: number | null
  /** Chart symbol — used for live mark on matching rows. */
  chartSymbol?: string
  selectedPositionId?: string | null
  onSelectPosition?: (id: string | null) => void
  onClosePosition: (id: string) => void
  onCancelOrder?: (id: string) => void
  onAddIsolatedMargin?: (id: string, amount: number) => void
  onRemoveIsolatedMargin?: (id: string, amount: number) => void
  readOnly?: boolean
  className?: string
  /** Full-height mobile Book tab — card layout and larger touch targets. */
  mobile?: boolean
}

function EmptyPane({
  title,
  hint,
  mobile,
}: {
  title: string
  hint: string
  mobile?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-4 text-center",
        mobile ? "min-h-48 py-8" : "h-full gap-0.5"
      )}
    >
      <p
        className={cn(
          "text-foreground/80",
          mobile ? "text-sm font-medium" : "text-xs"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "text-muted-foreground",
          mobile ? "max-w-xs text-xs leading-5" : "text-[11px]"
        )}
      >
        {hint}
      </p>
    </div>
  )
}

function TabCount({ value, mobile }: { value: number; mobile?: boolean }) {
  if (value <= 0) return null

  return (
    <Badge
      variant="secondary"
      className={cn(
        "min-w-4 rounded-full px-1 py-0 font-mono leading-none",
        mobile ? "h-3.5 text-[8px]" : "h-4 text-[9px]"
      )}
    >
      {value}
    </Badge>
  )
}

const bookTabListClass =
  "h-8 shrink-0 gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-0.5 shadow-none"
const bookTabTriggerClass =
  "h-7 shrink-0 rounded-md px-2.5 text-[11px] font-medium tracking-tight text-muted-foreground hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:ring-1 data-active:ring-border/50"

type BookTab = "positions" | "orders" | "history"

/** Switch to the relevant book tab when a new list pulse arrives. */
function useBookTabForSignal(lastSignal: BookListPulseSignal | null) {
  const [tab, setTab] = React.useState<BookTab>("positions")
  const [prevSignalAt, setPrevSignalAt] = React.useState<number | null>(null)

  if (lastSignal && lastSignal.at !== prevSignalAt) {
    setPrevSignalAt(lastSignal.at)
    const nextTab = lastSignal.source === "history" ? "history" : "positions"
    if (tab !== nextTab) setTab(nextTab)
  }

  return [tab, setTab] as const
}

function mobileBookTabClass(active: boolean) {
  return cn(
    "h-8 min-w-0 flex-row items-center justify-center gap-1 rounded-lg border-0 px-2 text-[11px] tracking-tight shadow-none transition-colors hover:bg-transparent active:bg-transparent dark:hover:bg-transparent",
    active
      ? "bg-background font-semibold text-foreground shadow-sm ring-1 ring-border/50"
      : "font-medium text-muted-foreground/70 hover:text-foreground/85"
  )
}

function MobileBookPanel({
  positions,
  orders,
  history,
  markPrice,
  chartSymbol,
  selectedPositionId,
  onSelectPosition,
  onClosePosition,
  onCancelOrder,
  onAddIsolatedMargin,
  onRemoveIsolatedMargin,
  readOnly,
  listPulses,
  lastSignal,
  dismissPulse,
}: Omit<BottomTradingPanelProps, "className" | "mobile"> & {
  listPulses: Record<string, BookListPulseEntry>
  lastSignal: BookListPulseSignal | null
  dismissPulse: (id: string) => void
}) {
  const [tab, setTab] = useBookTabForSignal(lastSignal)

  const tabs: { id: BookTab; label: string; count: number }[] = [
    { id: "positions", label: "Positions", count: positions.length },
    { id: "orders", label: "Orders", count: orders.length },
    { id: "history", label: "History", count: 0 },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
      <div
        role="tablist"
        aria-label="Book views"
        className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-0.5"
      >
        {tabs.map((item) => {
          const active = tab === item.id
          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={mobileBookTabClass(active)}
              onClick={() => setTab(item.id)}
            >
              <span className="inline-flex max-w-full items-center gap-1 truncate leading-none">
                {item.label}
                {item.count > 0 ? (
                  <TabCount value={item.count} mobile />
                ) : null}
              </span>
            </Button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        aria-label={
          tab === "positions"
            ? "Open positions"
            : tab === "orders"
              ? "Open orders"
              : "Trade history"
        }
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 [-webkit-overflow-scrolling:touch]"
      >
        {tab === "positions" ? (
          <MobilePositionsList
            positions={positions}
            markPrice={markPrice}
            chartSymbol={chartSymbol}
            selectedPositionId={selectedPositionId ?? null}
            onSelect={onSelectPosition}
            onClose={onClosePosition}
            onAddIsolatedMargin={onAddIsolatedMargin}
            onRemoveIsolatedMargin={onRemoveIsolatedMargin}
            readOnly={readOnly ?? false}
            listPulses={listPulses}
            dismissPulse={dismissPulse}
          />
        ) : null}
        {tab === "orders" ? (
          <MobileOrdersList orders={orders} onCancel={onCancelOrder} />
        ) : null}
        {tab === "history" ? (
          <MobileHistoryList
            history={history}
            listPulses={listPulses}
            dismissPulse={dismissPulse}
          />
        ) : null}
      </div>
    </div>
  )
}

function BottomTradingPanel({
  positions,
  orders,
  history,
  markPrice,
  chartSymbol,
  selectedPositionId = null,
  onSelectPosition,
  onClosePosition,
  onCancelOrder,
  onAddIsolatedMargin,
  onRemoveIsolatedMargin,
  readOnly = false,
  className,
  mobile = false,
}: BottomTradingPanelProps) {
  const { active: listPulses, lastSignal, dismissPulse } = useBookListPulse(
    positions,
    history
  )
  const [bookTab, setBookTab] = useBookTabForSignal(lastSignal)

  React.useEffect(() => {
    if (!lastSignal) return
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-book-pulse-id="${lastSignal.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [lastSignal])

  if (mobile) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
          className
        )}
      >
        <MobileBookPanel
          positions={positions}
          orders={orders}
          history={history}
          markPrice={markPrice}
          chartSymbol={chartSymbol}
          selectedPositionId={selectedPositionId}
          onSelectPosition={onSelectPosition}
          onClosePosition={onClosePosition}
          onCancelOrder={onCancelOrder}
          onAddIsolatedMargin={onAddIsolatedMargin}
          onRemoveIsolatedMargin={onRemoveIsolatedMargin}
          readOnly={readOnly}
          listPulses={listPulses}
          lastSignal={lastSignal}
          dismissPulse={dismissPulse}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-33 shrink-0 flex-col overflow-hidden border-t border-border/60 bg-background lg:h-50",
        className
      )}
    >
      <Tabs
        value={bookTab}
        onValueChange={(value) => setBookTab(value as BookTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex h-10 shrink-0 items-center border-b border-border/50 bg-muted/10 px-3">
          <TabsList
            variant="default"
            className={bookTabListClass}
          >
            <TabsTrigger value="positions" className={bookTabTriggerClass}>
              Positions
              <TabCount value={positions.length} />
            </TabsTrigger>
            <TabsTrigger value="orders" className={bookTabTriggerClass}>
              Orders
              <TabCount value={orders.length} />
            </TabsTrigger>
            <TabsTrigger value="history" className={bookTabTriggerClass}>
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="positions"
          className="mt-0 min-h-0 flex-1 overflow-hidden p-0"
        >
          <PositionsTable
            positions={positions}
            markPrice={markPrice}
            chartSymbol={chartSymbol}
            selectedPositionId={selectedPositionId}
            onSelect={onSelectPosition}
            onClose={onClosePosition}
            onAddIsolatedMargin={onAddIsolatedMargin}
            onRemoveIsolatedMargin={onRemoveIsolatedMargin}
            readOnly={readOnly}
            listPulses={listPulses}
            dismissPulse={dismissPulse}
          />
        </TabsContent>
        <TabsContent
          value="orders"
          className="mt-0 min-h-0 flex-1 overflow-hidden p-0"
        >
          <OrdersTable orders={orders} onCancel={onCancelOrder} />
        </TabsContent>
        <TabsContent
          value="history"
          className="mt-0 min-h-0 flex-1 overflow-hidden p-0"
        >
          <HistoryTable
            history={history}
            listPulses={listPulses}
            dismissPulse={dismissPulse}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const thClass =
  "whitespace-nowrap px-2 py-2 align-middle text-[10px] font-medium tracking-wide text-muted-foreground lg:px-3 lg:py-2 xl:px-4"
const tdClass =
  "px-2 py-2 align-middle lg:px-3 lg:py-2.5 xl:px-4"
const tdMonoClass = cn(tdClass, "whitespace-nowrap font-mono tabular-nums")
const tdStackClass = cn(tdClass, "whitespace-nowrap")
const bookCellPrimary = "block whitespace-nowrap font-mono tabular-nums"
const bookRowClass =
  "group/row border-b border-border/30 transition-colors hover:bg-muted/20 data-[popup-open]:bg-muted/25"
const bookTableWrapClass =
  "h-full min-h-0 min-w-0 w-full overflow-x-auto overflow-y-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
const bookTableClass =
  "w-max min-w-full table-auto border-separate border-spacing-0 text-left text-[10px] lg:text-[11px]"
const positionsTableClass =
  "w-full min-w-[42rem] table-fixed border-separate border-spacing-0 text-left text-[10px] lg:text-[11px]"
const bookCellMeta = "block whitespace-nowrap text-[10px] text-muted-foreground"
const bookHideXl = "hidden xl:table-cell"
const bookGrowThClass = cn(thClass, "min-w-[5.5rem] text-left")
const bookGrowTdClass = cn(tdStackClass, "min-w-[5.5rem] text-left")
const _bookNumThClass = cn(thClass, "text-right")
const _bookNumTdClass = cn(tdMonoClass, "text-right")
const bookActionsThClass = cn(
  thClass,
  "w-[7.25rem] bg-background/95 pr-3 text-right backdrop-blur-sm"
)
const bookActionsTdClass = cn(
  tdClass,
  "w-[7.25rem] whitespace-nowrap pr-3 text-right group-data-[selected=true]/row:bg-primary/5 group-hover/row:bg-muted/20"
)

/** Positions table — paired th/td widths so headers align with data cells. */
const posSizeTh = cn(thClass, "w-[18%] text-left xl:w-[16%]")
const posSizeTd = cn(tdStackClass, "w-[18%] text-left xl:w-[16%]")
const posFlexNumTh = cn(thClass, "w-[17%] text-right xl:w-[12%]")
const posFlexNumTd = cn(tdMonoClass, "w-[17%] text-right xl:w-[12%]")
const posPnlTh = cn(thClass, "w-[12%] text-right xl:w-[11%]")
const posPnlTd = cn(tdStackClass, "w-[12%] text-right xl:w-[11%]")
const posMarginTd = cn(
  tdStackClass,
  "w-[17%] text-right xl:w-[12%]",
  bookHideXl
)
const posActionsColWidth = "w-[10rem] min-w-[10rem]"
const posActionsTh = cn(
  thClass,
  posActionsColWidth,
  "bg-background/95 px-2 text-right backdrop-blur-sm lg:px-2.5 xl:px-3"
)
const posActionsTd = cn(
  tdClass,
  posActionsColWidth,
  "overflow-visible px-2 text-right lg:px-2.5 xl:px-3 group-data-[selected=true]/row:bg-primary/5 group-hover/row:bg-muted/20"
)

function PositionsTable({
  positions,
  markPrice,
  chartSymbol,
  selectedPositionId,
  onSelect,
  onClose,
  onAddIsolatedMargin,
  onRemoveIsolatedMargin,
  readOnly,
  listPulses,
  dismissPulse,
}: {
  positions: Position[]
  markPrice: number | null
  chartSymbol?: string
  selectedPositionId: string | null
  onSelect?: (id: string | null) => void
  onClose: (id: string) => void
  onAddIsolatedMargin?: (id: string, amount: number) => void
  onRemoveIsolatedMargin?: (id: string, amount: number) => void
  readOnly: boolean
  listPulses: Record<string, BookListPulseEntry>
  dismissPulse: (id: string) => void
}) {
  if (positions.length === 0) {
    return (
      <EmptyPane
        title="No open positions"
        hint="Filled orders show up here."
      />
    )
  }

  const chartKey = chartSymbol?.trim().toUpperCase()

  return (
    <div className={bookTableWrapClass}>
      <table className={positionsTableClass}>
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <tr className="border-b border-border/40 bg-muted/15">
            <th className={posSizeTh} scope="col">
              Size
            </th>
            <th className={posFlexNumTh} scope="col">
              Entry
            </th>
            <th className={posFlexNumTh} scope="col">
              Mark
            </th>
            <th className={posPnlTh} scope="col">
              PnL
            </th>
            <th
              className={cn(posFlexNumTh, bookHideXl, "text-amber-500/80")}
              scope="col"
            >
              Liq
            </th>
            <th className={cn(posFlexNumTh, "text-red-500/80")} scope="col">
              SL
            </th>
            <th className={cn(posFlexNumTh, "text-emerald-500/80")} scope="col">
              TP
            </th>
            <th className={cn(posFlexNumTh, bookHideXl)} scope="col">
              Margin
            </th>
            <th className={posActionsTh} scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const mark =
              chartKey != null && p.symbol === chartKey && markPrice != null
                ? markPrice
                : decimalNumber(p.markPrice)
            const pct = tradingPnlPct(p.side, p.entryPrice, mark)
            const pnl = decimalNumber(p.unrealizedPnl)
            const positive = pnl >= 0
            const liq = decimalNumber(p.liquidationPrice)
            const margin = decimalNumber(p.marginUsed)
            const selected = selectedPositionId === p.id
            const long = p.side === "LONG"
            const pulse = listPulses[p.id]

            return (
              <PositionContextMenu
                key={p.id}
                position={p}
                mark={mark}
                readOnly={readOnly}
                onSelect={onSelect}
                onClose={onClose}
                trigger={
                  <tr
                    data-book-pulse-id={p.id}
                    data-selected={selected ? "true" : undefined}
                    tabIndex={readOnly ? -1 : 0}
                    className={cn(
                      bookRowClass,
                      !readOnly && "cursor-pointer",
                      selected &&
                        "bg-primary/5 ring-1 ring-inset ring-primary/20 hover:bg-primary/8",
                      bookListPulseClass(pulse, "row")
                    )}
                    onClick={() => {
                      if (!readOnly) onSelect?.(selected ? null : p.id)
                    }}
                    {...bookListPulseDismissHandlers(p.id, pulse, dismissPulse)}
                  >
                    <td className={posSizeTd}>
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            bookCellPrimary,
                            "font-semibold",
                            long ? "text-emerald-500" : "text-red-500"
                          )}
                        >
                          {long ? "+" : "−"}
                          {formatTradingQty(p.quantity)} {p.symbol}
                        </p>
                        <PositionHealthBadge
                          position={p}
                          mark={mark}
                          compact
                        />
                      </div>
                      <p className={bookCellMeta}>
                        {p.leverage.value}x{" "}
                        {p.marginMode === "CROSS" ? "Cross" : "Isolated"}
                      </p>
                    </td>
                    <td className={cn(posFlexNumTd, "text-foreground/90")}>
                      {formatTradingPrice(p.entryPrice)}
                    </td>
                    <td className={cn(posFlexNumTd, "text-foreground/90")}>
                      {formatTradingPrice(mark)}
                    </td>
                    <td
                      className={cn(
                        posPnlTd,
                        "font-medium",
                        positive ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      <span className={bookCellPrimary}>
                        {formatTradingPnl(p.unrealizedPnl)}
                      </span>
                      <span className={cn(bookCellMeta, "font-normal")}>
                        {formatTradingPnlPct(pct)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        posFlexNumTd,
                        bookHideXl,
                        "text-amber-500/90"
                      )}
                    >
                      {liq != null && Number.isFinite(liq) && liq > 0
                        ? formatTradingPrice(liq)
                        : "—"}
                    </td>
                    <td className={cn(posFlexNumTd, "text-red-500/90")}>
                      {p.stopLoss != null ? formatTradingPrice(p.stopLoss) : "—"}
                    </td>
                    <td className={cn(posFlexNumTd, "text-emerald-500/90")}>
                      {p.takeProfit != null ? formatTradingPrice(p.takeProfit) : "—"}
                    </td>
                    <td className={posMarginTd}>
                      <span className={cn(bookCellPrimary, "text-foreground/90")}>
                        {formatTradingPrice(margin)}
                      </span>
                      {!readOnly &&
                      p.marginMode === "ISOLATED" &&
                      onAddIsolatedMargin ? (
                        <span className="ml-1 hidden shrink-0 xl:inline-flex">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Add isolated margin"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddIsolatedMargin(p.id, margin * 0.25)
                            }}
                          >
                            +
                          </Button>
                          {onRemoveIsolatedMargin ? (
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Remove isolated margin"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveIsolatedMargin(p.id, margin * 0.1)
                              }}
                            >
                              −
                            </Button>
                          ) : null}
                        </span>
                      ) : null}
                    </td>
                    <td className={posActionsTd}>
                      <div className="inline-flex min-w-max items-center justify-end gap-0.5">
                        <PositionIrisButton position={p} mark={mark} />
                        {!readOnly ? (
                          <>
                            <PositionTpslButton
                              selected={selected}
                              onSelect={() => onSelect?.(p.id)}
                            />
                            <PositionCloseButton onClose={() => onClose(p.id)} />
                          </>
                        ) : null}
                        <PositionMoreMenu
                          position={p}
                          mark={mark}
                          readOnly={readOnly}
                          onSelect={onSelect}
                          onClose={onClose}
                        />
                      </div>
                    </td>
                  </tr>
                }
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OrdersTable({
  orders,
  onCancel,
}: {
  orders: Order[]
  onCancel?: (id: string) => void
}) {
  if (orders.length === 0) {
    return (
      <EmptyPane
        title="No open orders"
        hint="Limits and triggers sit here until they fill."
      />
    )
  }

  return (
    <div className={bookTableWrapClass}>
      <table className={bookTableClass}>
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <tr className="border-b border-border/40 bg-muted/15">
            <th className={bookGrowThClass}>Symbol</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>Side</th>
            <th className={thClass}>Size</th>
            <th className={thClass}>Price</th>
            <th className={bookActionsThClass} />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={cn(bookRowClass, "hover:bg-muted/20")}>
              <td className={cn(bookGrowTdClass, "font-medium")}>{o.symbol}</td>
              <td className={cn(tdMonoClass, "text-muted-foreground")}>
                {o.type.replaceAll("_", " ")}
              </td>
              <td
                className={cn(
                  tdMonoClass,
                  o.side === "BUY" ? "text-emerald-500" : "text-red-500"
                )}
              >
                {o.side === "BUY" ? "Buy" : "Sell"}
              </td>
              <td className={tdMonoClass}>
                {formatTradingQty(o.quantity)}
              </td>
              <td className={tdMonoClass}>
                {o.triggerPrice != null
                  ? formatTradingPrice(o.triggerPrice)
                  : o.price != null
                    ? formatTradingPrice(o.price)
                    : "—"}
              </td>
              <td className={bookActionsTdClass}>
                {onCancel ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => onCancel(o.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryTable({
  history,
  listPulses,
  dismissPulse,
}: {
  history: ClosedTrade[]
  listPulses: Record<string, BookListPulseEntry>
  dismissPulse: (id: string) => void
}) {
  if (history.length === 0) {
    return (
      <EmptyPane
        title="No closed trades"
        hint="Realized PnL lands here after a close."
      />
    )
  }

  return (
    <div className={bookTableWrapClass}>
      <table className={bookTableClass}>
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <tr className="border-b border-border/40 bg-muted/15">
            <th className={bookGrowThClass}>Size</th>
            <th className={thClass}>Entry</th>
            <th className={thClass}>Exit</th>
            <th className={thClass}>PnL</th>
            <th className={thClass}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => {
            const long = h.side === "LONG"
            const pulse = listPulses[h.id]
            return (
              <ClosedTradeContextMenu
                key={h.id}
                trade={h}
                trigger={
                  <tr
                    data-book-pulse-id={h.id}
                    tabIndex={0}
                    className={cn(
                      bookRowClass,
                      bookListPulseClass(pulse, "row")
                    )}
                    {...bookListPulseDismissHandlers(h.id, pulse, dismissPulse)}
                  >
                <td className={bookGrowTdClass}>
                  <p
                    className={cn(
                      bookCellPrimary,
                      "font-medium",
                      long ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {formatTradingQty(h.quantity)} {h.symbol}
                  </p>
                  <p className={bookCellMeta}>
                    {long ? "Long" : "Short"}
                  </p>
                </td>
                <td className={cn(tdMonoClass, "text-foreground/90")}>
                  {formatTradingPrice(h.entryPrice)}
                </td>
                <td className={cn(tdMonoClass, "text-foreground/90")}>
                  {formatTradingPrice(h.exitPrice)}
                </td>
                <td
                  className={cn(
                    tdMonoClass,
                    "font-medium",
                    decimalNumber(h.realizedPnl) >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  )}
                >
                  {formatTradingPnl(h.realizedPnl)}
                </td>
                <td className={cn(tdClass, "whitespace-nowrap text-[10px] text-muted-foreground")}>
                  {h.reason.replaceAll("_", " ")}
                </td>
                  </tr>
                }
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MobileStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate font-mono text-xs tabular-nums text-foreground",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MobilePositionsList({
  positions,
  markPrice,
  chartSymbol,
  selectedPositionId,
  onSelect,
  onClose,
  onAddIsolatedMargin,
  onRemoveIsolatedMargin,
  readOnly,
  listPulses,
  dismissPulse,
}: {
  positions: Position[]
  markPrice: number | null
  chartSymbol?: string
  selectedPositionId: string | null
  onSelect?: (id: string | null) => void
  onClose: (id: string) => void
  onAddIsolatedMargin?: (id: string, amount: number) => void
  onRemoveIsolatedMargin?: (id: string, amount: number) => void
  readOnly: boolean
  listPulses: Record<string, BookListPulseEntry>
  dismissPulse: (id: string) => void
}) {
  if (positions.length === 0) {
    return (
      <EmptyPane
        mobile
        title="No open positions"
        hint="Filled orders show up here. Open a trade from the Trade tab."
      />
    )
  }

  const chartKey = chartSymbol?.trim().toUpperCase()

  return (
    <ul className="flex flex-col gap-3" aria-label="Open positions">
      {positions.map((p) => {
        const mark =
          chartKey != null && p.symbol === chartKey && markPrice != null
            ? markPrice
            : decimalNumber(p.markPrice)
        const pct = tradingPnlPct(p.side, p.entryPrice, mark)
        const pnl = decimalNumber(p.unrealizedPnl)
        const positive = pnl >= 0
        const liq = decimalNumber(p.liquidationPrice)
        const margin = decimalNumber(p.marginUsed)
        const selected = selectedPositionId === p.id
        const long = p.side === "LONG"
        const pulse = listPulses[p.id]

        return (
          <li key={p.id}>
            <PositionContextMenu
              position={p}
              mark={mark}
              readOnly={readOnly}
              onSelect={onSelect}
              onClose={onClose}
              trigger={
                <div
                  role="button"
                  tabIndex={readOnly ? -1 : 0}
                  aria-pressed={selected}
                  aria-label={`${long ? "Long" : "Short"} ${formatTradingQty(p.quantity)} ${p.symbol}`}
                  data-book-pulse-id={p.id}
                  className={cn(
                    "rounded-xl border border-border/50 bg-muted/15 p-3 transition-colors",
                    !readOnly && "cursor-pointer active:bg-muted/30",
                    selected &&
                      "border-primary/25 bg-muted/40 ring-1 ring-primary/20",
                    bookListPulseClass(pulse, "card")
                  )}
                  onClick={() => {
                    if (!readOnly) onSelect?.(selected ? null : p.id)
                  }}
                  onKeyDown={(event) => {
                    if (readOnly) return
                    if (event.key !== "Enter" && event.key !== " ") return
                    event.preventDefault()
                    onSelect?.(selected ? null : p.id)
                  }}
                  {...bookListPulseDismissHandlers(p.id, pulse, dismissPulse)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          long ? "text-emerald-500" : "text-red-500"
                        )}
                      >
                        {long ? "+" : "−"}
                        {formatTradingQty(p.quantity)} {p.symbol}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.leverage.value}x{" "}
                        {p.marginMode === "CROSS" ? "Cross" : "Isolated"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          positive ? "text-emerald-500" : "text-red-500"
                        )}
                      >
                        {formatTradingPnl(p.unrealizedPnl)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTradingPnlPct(pct)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                    <MobileStat
                      label="Entry"
                      value={formatTradingPrice(p.entryPrice)}
                    />
                    <MobileStat label="Mark" value={formatTradingPrice(mark)} />
                    <MobileStat
                      label="Liquidation"
                      value={
                        liq != null && Number.isFinite(liq) && liq > 0
                          ? formatTradingPrice(liq)
                          : "—"
                      }
                      valueClassName="text-amber-500"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Margin</p>
                      <div className="flex items-center gap-1">
                        <p className="truncate font-mono text-xs tabular-nums text-foreground">
                          {formatTradingPrice(margin)}
                        </p>
                        {!readOnly &&
                        p.marginMode === "ISOLATED" &&
                        onAddIsolatedMargin ? (
                          <span className="inline-flex shrink-0">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="size-8 text-muted-foreground"
                              aria-label="Add isolated margin"
                              onClick={(event) => {
                                event.stopPropagation()
                                onAddIsolatedMargin(p.id, margin * 0.25)
                              }}
                            >
                              +
                            </Button>
                            {onRemoveIsolatedMargin ? (
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="size-8 text-muted-foreground"
                                aria-label="Remove isolated margin"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onRemoveIsolatedMargin(p.id, margin * 0.1)
                                }}
                              >
                                −
                              </Button>
                            ) : null}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <MobileStat
                      label="Stop loss"
                      value={
                        p.stopLoss != null ? formatTradingPrice(p.stopLoss) : "—"
                      }
                      valueClassName="text-red-500"
                    />
                    <MobileStat
                      label="Take profit"
                      value={
                        p.takeProfit != null
                          ? formatTradingPrice(p.takeProfit)
                          : "—"
                      }
                      valueClassName="text-emerald-500"
                    />
                  </div>

                  {!readOnly ? (
                    <div className="mt-3 flex items-center gap-1.5">
                      <PositionIrisButton
                        position={p}
                        mark={mark}
                        size="icon-sm"
                        className="size-10 shrink-0 rounded-xl border border-border/50 bg-background/70"
                      />
                      <PositionTpslButton
                        selected={selected}
                        size="icon-sm"
                        className="size-10 shrink-0 rounded-xl"
                        onSelect={() => onSelect?.(p.id)}
                      />
                      <PositionCloseButton
                        size="icon-sm"
                        className="size-10 shrink-0 rounded-xl border border-border/50 bg-background/70"
                        onClose={() => onClose(p.id)}
                      />
                      <PositionMoreMenu
                        position={p}
                        mark={mark}
                        readOnly={readOnly}
                        onSelect={onSelect}
                        onClose={onClose}
                        size="icon-sm"
                        className="size-10 shrink-0 rounded-xl border border-border/50 bg-background/70"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex justify-end">
                      <PositionMoreMenu
                        position={p}
                        mark={mark}
                        readOnly={readOnly}
                        onSelect={onSelect}
                        onClose={onClose}
                        size="icon-sm"
                        className="size-10 shrink-0 rounded-xl border border-border/50 bg-background/70"
                      />
                    </div>
                  )}
                </div>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}

function MobileOrdersList({
  orders,
  onCancel,
}: {
  orders: Order[]
  onCancel?: (id: string) => void
}) {
  if (orders.length === 0) {
    return (
      <EmptyPane
        mobile
        title="No open orders"
        hint="Limit and trigger orders appear here until they fill or you cancel them."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Open orders">
      {orders.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-border/50 bg-muted/15 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{o.symbol}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground uppercase">
                {o.type.replaceAll("_", " ")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-xs font-semibold",
                o.side === "BUY"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {o.side === "BUY" ? "Buy" : "Sell"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
            <MobileStat label="Size" value={formatTradingQty(o.quantity)} />
            <MobileStat
              label="Price"
              value={
                o.triggerPrice != null
                  ? formatTradingPrice(o.triggerPrice)
                  : o.price != null
                    ? formatTradingPrice(o.price)
                    : "—"
              }
            />
          </div>

          {onCancel ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 h-10 w-full text-xs"
              onClick={() => onCancel(o.id)}
            >
              Cancel order
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function MobileHistoryList({
  history,
  listPulses,
  dismissPulse,
}: {
  history: ClosedTrade[]
  listPulses: Record<string, BookListPulseEntry>
  dismissPulse: (id: string) => void
}) {
  if (history.length === 0) {
    return (
      <EmptyPane
        mobile
        title="No closed trades"
        hint="Realized PnL from closed positions will show up here."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Trade history">
      {history.map((h) => {
        const long = h.side === "LONG"
        const pnl = decimalNumber(h.realizedPnl)
        const positive = pnl >= 0
        const pulse = listPulses[h.id]

        return (
          <li key={h.id}>
            <ClosedTradeContextMenu
              trade={h}
              trigger={
                <div
                  data-book-pulse-id={h.id}
                  tabIndex={0}
                  className={cn(
                    "rounded-xl border border-border/50 bg-muted/15 p-3",
                    bookListPulseClass(pulse, "card")
                  )}
                  {...bookListPulseDismissHandlers(h.id, pulse, dismissPulse)}
                >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    long ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatTradingQty(h.quantity)} {h.symbol}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {long ? "Long" : "Short"}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 font-mono text-sm font-semibold tabular-nums",
                  positive ? "text-emerald-500" : "text-red-500"
                )}
              >
                {formatTradingPnl(h.realizedPnl)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
              <MobileStat
                label="Entry"
                value={formatTradingPrice(h.entryPrice)}
              />
              <MobileStat label="Exit" value={formatTradingPrice(h.exitPrice)} />
              <MobileStat
                label="Reason"
                value={h.reason.replaceAll("_", " ")}
                valueClassName="normal-case text-muted-foreground"
              />
            </div>
                </div>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}

export { BottomTradingPanel }
