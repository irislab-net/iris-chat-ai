"use client"

/**
 * Paper order ticket — Hyperliquid-style market/limit ticket.
 * SL/TP can be typed or placed on the chart.
 */
import * as React from "react"
import {
  BitcoinIcon,
  CheckIcon,
  ChevronDownIcon,
  CrosshairIcon,
  GaugeIcon,
  GemIcon,
  XIcon,
} from "lucide-react"

import {
  PAPER_MARKETS,
  paperMarketBySymbol,
} from "@/components/paper-trading/paper-markets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { maintenanceMarginRate } from "@/lib/paper-trading/instruments"
import { PAPER_EXECUTION_DEFAULTS } from "@/lib/paper-trading/execution"
import {
  formatTicketDecimal,
  formatTradingPnl,
  formatTradingPrice,
} from "@/lib/trading/format"
import {
  projectedPnlAt,
  type TradeDraft,
  type TradeInteractionMode,
} from "@/lib/trading/draft"
import {
  decimalNumber,
  type MarginMode,
  type Position,
  type PositionSide,
  type TimeInForce,
} from "@/lib/trading/types"
import { cn } from "@/lib/utils"

const pillClass =
  "h-7 w-full min-w-0 justify-between gap-1 px-1.5 rounded-md border-border/60 bg-muted/40 text-[11px] font-medium text-foreground hover:bg-muted/60"

const mobilePillClass =
  "h-9 w-full min-w-0 justify-between gap-1 px-2 rounded-md border-border/50 bg-transparent text-xs font-medium text-foreground hover:bg-muted/40"

function ticketFieldRowClass(mobile?: boolean) {
  return cn(
    mobile
      ? "flex min-h-10 items-center justify-between gap-2 border-b border-border/40 py-1.5"
      : "flex h-8 items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-2.5"
  )
}

function ticketFieldInputClass(mobile?: boolean) {
  return cn(
    "border-0 bg-transparent px-0 text-right font-mono font-medium tabular-nums shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent",
    mobile ? "h-10 text-base" : "h-8 text-[11px]"
  )
}

function ticketFieldLabelClass(mobile?: boolean) {
  return cn(
    "shrink-0 text-muted-foreground",
    mobile ? "text-xs" : "text-[10px]"
  )
}

export type TicketProType =
  | "CHASE"
  | "SCALE"
  | "STOP_LIMIT"
  | "STOP_MARKET"
  | "TAKE_LIMIT"
  | "TAKE_MARKET"
  | "TWAP"

export type TicketOrderType = "MARKET" | "LIMIT" | TicketProType
export type TicketSizeUnit = "COIN" | "USDC"

export type TicketSubmitInput = {
  type: TicketOrderType
  quantity: number
  price: number | null
  triggerPrice: number | null
  reduceOnly: boolean
  timeInForce: TimeInForce
}

const PRO_TYPES: { value: TicketProType; label: string }[] = [
  { value: "CHASE", label: "Chase" },
  { value: "SCALE", label: "Scale" },
  { value: "STOP_LIMIT", label: "Stop Limit" },
  { value: "STOP_MARKET", label: "Stop Market" },
  { value: "TAKE_LIMIT", label: "Take Limit" },
  { value: "TAKE_MARKET", label: "Take Market" },
  { value: "TWAP", label: "TWAP" },
]

const UNSUPPORTED_PRO = new Set<TicketProType>(["CHASE", "SCALE", "TWAP"])

function isProType(type: TicketOrderType): type is TicketProType {
  return type !== "MARKET" && type !== "LIMIT"
}

function needsTrigger(type: TicketOrderType) {
  return (
    type === "STOP_MARKET" ||
    type === "STOP_LIMIT" ||
    type === "TAKE_MARKET" ||
    type === "TAKE_LIMIT"
  )
}

function needsLimitPrice(type: TicketOrderType) {
  return type === "LIMIT" || type === "STOP_LIMIT" || type === "TAKE_LIMIT"
}

function proLabel(type: TicketOrderType) {
  return PRO_TYPES.find((item) => item.value === type)?.label ?? "Pro"
}

type OrderTicketProps = {
  symbol: string
  markPrice: number | null
  draft: TradeDraft
  interactionMode: TradeInteractionMode
  /** When set, bracket section edits this position instead of draft levels. */
  selectedPosition?: Position | null
  marginMode: MarginMode
  leverage: number
  onMarginModeChange: (mode: MarginMode) => void
  onLeverageChange: (leverage: number) => void
  onSideChange: (side: PositionSide) => void
  onQuantityChange: (quantity: number) => void
  onArmPlace: (field: "stopLoss" | "takeProfit") => void
  onClearLevel: (field: "stopLoss" | "takeProfit") => void
  onManualLevel: (field: "stopLoss" | "takeProfit", price: number) => boolean
  onCancelPlace: () => void
  onSymbolChange?: (symbol: string) => void
  onSubmit: (
    input: TicketSubmitInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  /** Clears parent draft state after a successful placement. */
  onOrderSuccess?: () => void
  maxLeverage?: number
  availableBalance?: number | null
  symbolPosition?: Position | null
  equity?: number | null
  unrealizedPnl?: number | null
  maintenanceMargin?: number | null
  accountLeverage?: number | null
  externalPrefill?: {
    revision: number
    orderType?: TicketOrderType
    limitPrice?: number | null
    highlightSubmit?: boolean
  } | null
  disabled?: boolean
  compact?: boolean
  /** Full-width mobile tab layout — larger touch targets. */
  mobile?: boolean
}

function EthereumGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path
        d="M12 1.75 4.75 12.1l7.25 4.15 7.25-4.15L12 1.75Z"
        opacity="0.85"
      />
      <path d="M12 16.85 4.75 12.7 12 22.25l7.25-9.55L12 16.85Z" />
    </svg>
  )
}

function SolanaGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path d="M5.2 16.4h13.1l-2.1 2.4H3.1z" />
      <path d="M5.2 11.1h13.1l-2.1 2.4H3.1z" opacity="0.75" />
      <path d="M18.8 7.6H5.7L7.8 5.2h13.1z" />
    </svg>
  )
}

function MarketIcon({
  symbol,
  className,
}: {
  symbol: string
  className?: string
}) {
  const key = symbol.trim().toUpperCase()
  if (key === "BTC") return <BitcoinIcon className={className} />
  if (key === "SOL") return <SolanaGlyph className={className} />
  if (key === "XAU") return <GemIcon className={className} />
  return <EthereumGlyph className={className} />
}

function TicketMarketSwitcher({
  symbol,
  onSymbolChange,
  compact,
}: {
  symbol: string
  onSymbolChange?: (symbol: string) => void
  compact?: boolean
}) {
  const selected = paperMarketBySymbol(symbol) ?? PAPER_MARKETS[0]!
  const symbolKey = selected.symbol

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Market: ${selected.label}`}
            className={cn(
              "h-auto gap-1 rounded-md px-1 py-0.5 font-mono font-semibold tracking-tight",
              compact ? "text-[11px]" : "text-xs"
            )}
          />
        }
      >
        <MarketIcon symbol={symbolKey} className="size-3.5 shrink-0" />
        <span>{symbolKey}</span>
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-52 gap-0 rounded-lg p-1.5 shadow-lg ring-0"
      >
        <DropdownMenuGroup className="flex flex-col gap-0.5">
          <DropdownMenuLabel className="px-2 pb-1 text-[10px] tracking-wide uppercase">
            Market
          </DropdownMenuLabel>
          {PAPER_MARKETS.map((item) => (
            <DropdownMenuItem
              key={item.id}
              disabled={!item.available}
              className="min-h-9 justify-between gap-2 rounded-md px-2 py-2"
              onClick={() => {
                if (!item.available) return
                onSymbolChange?.(item.symbol)
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  <MarketIcon symbol={item.symbol} className="size-3.5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-xs font-semibold leading-none">
                    {item.symbol}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {item.label}
                  </span>
                </span>
              </span>
              {item.available ? (
                item.symbol === symbolKey ? (
                  <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                ) : null
              ) : (
                <Badge
                  variant="secondary"
                  className="h-5 shrink-0 px-1.5 text-[9px] font-medium tracking-wide"
                >
                  Coming soon
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const MIN_TICKET_SIZE = 0.00000001

function createDefaultTicketLocalState() {
  return {
    orderType: "MARKET" as TicketOrderType,
    limitPrice: null as number | null,
    triggerPrice: null as number | null,
    reduceOnly: false,
    timeInForce: "GTC" as TimeInForce,
    sizeUnit: "COIN" as TicketSizeUnit,
    bracketsOn: false,
  }
}

function parseDecimal(raw: string, integer: boolean): number | null {
  const n = integer ? Number.parseInt(raw, 10) : Number(raw)
  if (!Number.isFinite(n)) return null
  return integer ? Math.trunc(n) : n
}

function nudgeDecimal(
  current: number,
  direction: 1 | -1,
  step: number,
  min: number,
  max: number
) {
  const next = Math.round((current + direction * step) / step) * step
  return Math.min(max, Math.max(min, Number(next.toFixed(8))))
}

function formatPositionQty(qty: number) {
  return qty.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

function priceStep(reference: number | null) {
  const price = reference ?? 0
  if (price >= 100) return 1
  if (price >= 1) return 0.1
  return 0.01
}

function DecimalField({
  value,
  onCommit,
  onEmpty,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step,
  shiftStep,
  integer = false,
  disabled,
  id,
  name,
  placeholder,
  className,
  invalid,
  commitOnlyOnEnter = false,
  nudgeFallback,
  "aria-label": ariaLabel,
  enterKeyHint,
}: {
  value: number | null
  onCommit: (n: number) => boolean | void
  onEmpty?: () => void
  min?: number
  max?: number
  step: number
  shiftStep?: number
  integer?: boolean
  disabled?: boolean
  id?: string
  name?: string
  placeholder?: string
  className?: string
  invalid?: boolean
  commitOnlyOnEnter?: boolean
  nudgeFallback?: number | null
  "aria-label"?: string
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>["enterKeyHint"]
}) {
  const focusedRef = React.useRef(false)
  const [draftText, setDraftText] = React.useState<string | null>(null)

  React.useEffect(() => {
    setDraftText((current) => {
      if (current != null && /e/i.test(current)) return null
      if (focusedRef.current) return current
      return null
    })
  }, [value])

  const text =
    draftText ??
    (value != null && Number.isFinite(value)
      ? formatTicketDecimal(value, { integer })
      : "")
  const coarseStep = shiftStep ?? step * 10
  const allowed = integer ? /^\d*$/ : /^\d*\.?\d*$/

  const apply = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next))
    if (!Number.isFinite(clamped) || (min > 0 && !(clamped > 0))) return
    const ok = onCommit(clamped)
    if (ok === false) return
    setDraftText(formatTicketDecimal(clamped, { integer }))
  }

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setDraftText(null)
      onEmpty?.()
      return
    }
    const parsed = parseDecimal(trimmed, integer)
    if (parsed == null) {
      setDraftText(null)
      return
    }
    const clamped = Math.min(max, Math.max(min, parsed))
    if (!Number.isFinite(clamped) || (min > 0 && !(clamped > 0))) {
      setDraftText(null)
      return
    }
    const ok = onCommit(clamped)
    setDraftText(null)
    if (ok === false) return
  }

  return (
    <Input
      id={id}
      name={name}
      type="text"
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      inputMode={integer ? "numeric" : "decimal"}
      enterKeyHint={enterKeyHint}
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={className}
      onFocus={(event) => {
        focusedRef.current = true
        setDraftText(
          value != null && Number.isFinite(value)
            ? formatTicketDecimal(value, { integer })
            : ""
        )
        event.currentTarget.select()
      }}
      onChange={(event) => {
        const raw = event.target.value
        if (raw !== "" && !allowed.test(raw)) return
        setDraftText(raw)
        const parsed = parseDecimal(raw, integer)
        if (parsed == null || parsed < min || parsed > max) return
        if (min > 0 && !(parsed > 0)) return
        onCommit(parsed)
      }}
      onBlur={() => {
        focusedRef.current = false
        commit(text)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit(text)
          if (commitOnlyOnEnter) {
            event.preventDefault()
            event.currentTarget.blur()
          }
          return
        }
        if (integer && event.key === "Home" && Number.isFinite(min)) {
          event.preventDefault()
          apply(min)
          return
        }
        if (integer && event.key === "End" && Number.isFinite(max)) {
          event.preventDefault()
          apply(max)
          return
        }
        const down =
          event.key === "ArrowDown" || event.key === "PageDown"
        const up = event.key === "ArrowUp" || event.key === "PageUp"
        if (!up && !down) return
        event.preventDefault()
        const parsed = parseDecimal(text, integer)
        const current =
          parsed ??
          value ??
          (nudgeFallback != null && nudgeFallback > 0 ? nudgeFallback : null)
        if (current == null) return
        const increment =
          event.shiftKey || event.key === "PageUp" || event.key === "PageDown"
            ? coarseStep
            : step
        apply(nudgeDecimal(current, up ? 1 : -1, increment, min, max))
      }}
    />
  )
}

function LevelControl({
  kind,
  price,
  pnl,
  placing,
  markPrice,
  onArm,
  onClear,
  onManual,
  onCancel,
  mobile,
}: {
  kind: "SL" | "TP"
  price: number | null
  pnl: number | null
  placing: boolean
  markPrice: number | null
  onArm: () => void
  onClear: () => void
  onManual: (price: number) => boolean
  onCancel: () => void
  mobile?: boolean
}) {
  const isSl = kind === "SL"
  const fieldId = React.useId()
  const cancelRef = React.useRef<HTMLButtonElement | null>(null)
  const accent = isSl ? "text-red-500" : "text-emerald-500"
  const accentMuted = isSl
    ? "border-red-500/25 bg-red-500/5 hover:bg-red-500/10"
    : "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"

  const [invalid, setInvalid] = React.useState(false)
  const step = priceStep(price ?? markPrice)
  const title = kind === "SL" ? "stop loss" : "take profit"

  React.useEffect(() => {
    if (!placing) return
    cancelRef.current?.focus()
  }, [placing])

  const actions = (
    <div className="flex items-center gap-0.5">
      {placing ? (
        <Button
          ref={cancelRef}
          type="button"
          size="xs"
          variant="ghost"
          className="h-5 px-1.5 text-[10px] text-muted-foreground"
          onClick={onCancel}
        >
          Cancel
        </Button>
      ) : (
        <>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="size-5 text-muted-foreground hover:text-foreground"
            onClick={onArm}
            aria-label={`Set ${title} on chart`}
            title="Set on chart"
          >
            <CrosshairIcon className="size-3" />
          </Button>
          {price != null ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="size-5 text-muted-foreground hover:text-foreground"
              onClick={onClear}
              aria-label={`Clear ${title}`}
            >
              <XIcon className="size-3" />
            </Button>
          ) : null}
        </>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 overflow-hidden transition-colors",
        mobile
          ? cn(
              "min-h-10 rounded-none border-0 border-b bg-transparent px-0 py-1",
              placing
                ? "border-foreground/30"
                : invalid
                  ? "border-destructive/50"
                  : "border-border/40"
            )
          : cn(
              "h-7 rounded-md border px-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              placing
                ? "border-foreground/25 bg-muted/40"
                : invalid
                  ? "border-destructive/50 bg-destructive/5"
                  : price != null
                    ? accentMuted
                    : "border-border/70 bg-muted/15"
            )
      )}
    >
      <Label
        htmlFor={placing ? undefined : fieldId}
        className={cn(
          "shrink-0",
          mobile ? "text-xs font-medium" : "text-[10px]",
          price != null || placing ? accent : "text-muted-foreground"
        )}
      >
        {kind}
      </Label>
      {placing ? (
        <p className="min-w-0 flex-1 text-[10px] text-muted-foreground">
          Click chart
        </p>
      ) : (
        <DecimalField
          id={fieldId}
          name={kind === "SL" ? "stopLoss" : "takeProfit"}
          value={price}
          min={MIN_TICKET_SIZE}
          step={step}
          shiftStep={step * 10}
          placeholder="—"
          commitOnlyOnEnter
          nudgeFallback={markPrice}
          aria-label={`${title} price`}
          enterKeyHint="done"
          invalid={invalid}
          className={cn(
            ticketFieldInputClass(mobile),
            "min-w-0 flex-1 rounded-none px-1 py-0 text-right"
          )}
          onCommit={(next) => {
            const ok = onManual(next)
            setInvalid(!ok)
            return ok
          }}
          onEmpty={() => {
            setInvalid(false)
            if (price != null) onClear()
          }}
        />
      )}
      {!placing && pnl != null && price != null ? (
        <span
          className={cn(
            "hidden shrink-0 font-mono text-[9px] tabular-nums @min-[20rem]/brackets:inline",
            pnl >= 0 ? "text-emerald-500" : "text-red-500"
          )}
        >
          {formatTradingPnl(pnl)}
        </span>
      ) : null}
      <div className="shrink-0">{actions}</div>
    </div>
  )
}

function leverageChoices(maxLeverage: number) {
  const presets = [1, 2, 3, 5, 10, 15, 20, 25, 40, 50]
  const list = presets.filter((n) => n <= maxLeverage)
  if (maxLeverage >= 1 && !list.includes(maxLeverage)) list.push(maxLeverage)
  return list
}

function MarginPills({
  maxLeverage,
  marginMode,
  leverage,
  onMarginModeChange,
  onLeverageChange,
  disabled,
  mobile,
}: {
  maxLeverage: number
  marginMode: MarginMode
  leverage: number
  onMarginModeChange: (mode: MarginMode) => void
  onLeverageChange: (leverage: number) => void
  disabled?: boolean
  mobile?: boolean
}) {
  const pill = mobile ? mobilePillClass : pillClass

  return (
    <div className={cn("grid grid-cols-3", mobile ? "gap-1.5" : "gap-1.5")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              size="xs"
              aria-label="Margin mode"
              className={pill}
            >
              <span className="min-w-0 truncate">
                {marginMode === "CROSS" ? "Cross" : "Isolated"}
              </span>
              <ChevronDownIcon
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="min-w-36">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onMarginModeChange("CROSS")}>
              Cross
              {marginMode === "CROSS" ? (
                <CheckIcon className="ml-auto size-3.5" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMarginModeChange("ISOLATED")}>
              Isolated
              {marginMode === "ISOLATED" ? (
                <CheckIcon className="ml-auto size-3.5" />
              ) : null}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              size="xs"
              aria-label="Leverage"
              className={pill}
            >
              <span className="min-w-0 truncate">{leverage}×</span>
              <ChevronDownIcon
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-28">
          <DropdownMenuGroup>
            {leverageChoices(maxLeverage).map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => onLeverageChange(value)}
              >
                {value}×
                {value === leverage ? (
                  <CheckIcon className="ml-auto size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              size="xs"
              className={pill}
              aria-label="Account mode"
            >
              <span className="min-w-0 truncate">Unified</span>
              <ChevronDownIcon
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-1.5 py-1.5 text-[10px] font-normal tracking-normal text-muted-foreground normal-case">
              Same-symbol orders net into one position.
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Unified
              <CheckIcon className="ml-auto size-3.5" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const SIZE_SLIDER_STEPS = 20
const SIZE_SLIDER_INTERVAL = 5

function sizeAllocationLabel(step: number): string {
  if (step === 0) return "0"
  if (step === 5) return "25"
  if (step === 10) return "50"
  if (step === 15) return "75"
  if (step === SIZE_SLIDER_STEPS) return "Max"
  return String(step * SIZE_SLIDER_INTERVAL)
}

function sizeAllocationMode(pct: number): { title: string; description: string } {
  if (pct <= 25) {
    return {
      title: "Light size",
      description: "Minimal exposure from available buying power.",
    }
  }
  if (pct <= 75) {
    return {
      title: "Balanced size",
      description: "Moderate allocation for controlled risk.",
    }
  }
  return {
    title: "Max size",
    description: "Full buying power for this order.",
  }
}

function SizeAllocationControl({
  sizePct,
  disabled,
  mobile,
  onSelect,
}: {
  sizePct: number
  disabled?: boolean
  mobile?: boolean
  onSelect: (pct: number) => void
}) {
  const roundedPct = Math.round(sizePct)
  const currentStep = Math.min(
    SIZE_SLIDER_STEPS,
    Math.max(0, Math.round(sizePct / SIZE_SLIDER_INTERVAL))
  )
  const ticks = Array.from({ length: SIZE_SLIDER_STEPS + 1 }, (_, index) => index)
  const mode = sizeAllocationMode(roundedPct)

  return (
    <div
      dir="ltr"
      className={cn(
        "relative w-full",
        mobile ? "mt-3 space-y-3.5" : "mt-2.5 space-y-3"
      )}
    >
      <Slider
        value={[currentStep]}
        min={0}
        max={SIZE_SLIDER_STEPS}
        step={1}
        disabled={disabled}
        aria-label="Size percent"
        className={cn(
          "**:data-[slot=slider-range]:bg-primary **:data-[slot=slider-thumb]:border-primary/50",
          mobile
            ? "**:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-track]:h-1.5"
            : "**:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-1"
        )}
        onValueChange={(next) => {
          const raw = Array.isArray(next) ? next[0] : next
          if (typeof raw !== "number" || !Number.isFinite(raw)) return
          onSelect(raw * SIZE_SLIDER_INTERVAL)
        }}
      />

      <div className="flex w-full items-baseline justify-between px-0.5">
        {ticks.map((step) => {
          const isMajor = step % SIZE_SLIDER_INTERVAL === 0
          const isActive = step <= currentStep
          const label = isMajor ? sizeAllocationLabel(step) : ""
          const tickMark = (
            <div
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                isActive ? "bg-primary" : "bg-primary/20",
                isMajor ? "h-3" : "h-1.5"
              )}
            />
          )
          const tickLabel = (
            <span
              className={cn(
                "font-medium transition-colors",
                mobile ? "text-[11px]" : "text-[10px]",
                isMajor
                  ? "text-muted-foreground opacity-100"
                  : "opacity-0"
              )}
            >
              {label}
            </span>
          )

          if (!isMajor) {
            return (
              <div
                key={step}
                aria-hidden
                className="flex flex-col items-center gap-1"
              >
                {tickMark}
                {tickLabel}
              </div>
            )
          }

          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              aria-label={`Set size to ${label === "Max" ? "100 percent" : `${label} percent`}`}
              className={cn(
                "flex flex-col items-center gap-1 border-0 bg-transparent p-0",
                !disabled && "cursor-pointer"
              )}
              onClick={() => onSelect(step * SIZE_SLIDER_INTERVAL)}
            >
              {tickMark}
              {tickLabel}
            </button>
          )
        })}
      </div>

      <div className="flex w-full items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <GaugeIcon className="size-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <span className={cn("font-medium", mobile ? "text-xs" : "text-[11px]")}>
            {mode.title}
          </span>
          <span
            className={cn(
              "text-muted-foreground leading-snug",
              mobile ? "text-[11px]" : "text-[10px]"
            )}
          >
            {mode.description}
          </span>
        </div>
      </div>
    </div>
  )
}

function MetaRow({
  label,
  value,
  hint,
  mobile,
}: {
  label: string
  value: string
  hint?: string
  mobile?: boolean
}) {
  const text = (
    <span className={hint ? "border-b border-dashed border-muted-foreground/50" : undefined}>
      {label}
    </span>
  )
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        mobile ? "text-xs" : "text-[10px]"
      )}
    >
      {hint ? (
        <Tooltip>
          <TooltipTrigger className="text-muted-foreground">{text}</TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground">{label}</span>
      )}
      <span className="font-mono tabular-nums text-foreground/90">{value}</span>
    </div>
  )
}

function previewIsolatedLiq(input: {
  symbol: string
  side: PositionSide
  quantity: number
  price: number
  leverage: number
}): number | null {
  const qty = input.quantity
  const price = input.price
  const lev = input.leverage
  if (!(qty > 0) || !(price > 0) || !(lev > 0)) return null
  const mmRate = maintenanceMarginRate(input.symbol)
  const margin = (qty * price) / lev
  if (input.side === "LONG") {
    const denom = qty * (1 - mmRate)
    if (!(denom > 0)) return null
    return (price * qty - margin) / denom
  }
  const denom = qty * (1 + mmRate)
  if (!(denom > 0)) return null
  return (price * qty + margin) / denom
}

function OrderTicket({
  symbol,
  markPrice,
  draft,
  interactionMode,
  selectedPosition = null,
  marginMode,
  leverage,
  onMarginModeChange,
  onLeverageChange,
  onSideChange,
  onQuantityChange,
  onArmPlace,
  onClearLevel,
  onManualLevel,
  onCancelPlace,
  onSymbolChange,
  onSubmit,
  onOrderSuccess,
  maxLeverage = 50,
  availableBalance = null,
  symbolPosition = null,
  equity = null,
  unrealizedPnl = null,
  maintenanceMargin = null,
  accountLeverage = null,
  externalPrefill = null,
  disabled,
  compact,
  mobile,
}: OrderTicketProps) {
  const sizeId = React.useId()
  const priceId = React.useId()
  const errorId = React.useId()
  const bracketsId = React.useId()
  const reduceId = React.useId()
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const submittingRef = React.useRef(false)
  const [orderType, setOrderType] = React.useState<TicketOrderType>(
    () => createDefaultTicketLocalState().orderType
  )
  const [limitPrice, setLimitPrice] = React.useState<number | null>(
    () => createDefaultTicketLocalState().limitPrice
  )
  const [triggerPrice, setTriggerPrice] = React.useState<number | null>(
    () => createDefaultTicketLocalState().triggerPrice
  )
  const [reduceOnly, setReduceOnly] = React.useState(
    () => createDefaultTicketLocalState().reduceOnly
  )
  const [timeInForce, setTimeInForce] = React.useState<TimeInForce>(
    () => createDefaultTicketLocalState().timeInForce
  )
  const [sizeUnit, setSizeUnit] = React.useState<TicketSizeUnit>(
    () => createDefaultTicketLocalState().sizeUnit
  )
  const [bracketsOn, setBracketsOn] = React.useState(
    () => draft.stopLoss != null || draft.takeProfit != null
  )
  const [submitPulse, setSubmitPulse] = React.useState(false)
  /** Slider allocation % — kept when leverage / buying power changes. */
  const [sizeAllocationPct, setSizeAllocationPct] = React.useState<number | null>(
    null
  )
  const sizeAllocationPctRef = React.useRef(sizeAllocationPct)
  const maxQtyRef = React.useRef<number | null>(null)
  sizeAllocationPctRef.current = sizeAllocationPct
  const placing =
    interactionMode === "placing-sl" || interactionMode === "placing-tp"

  const resetLocalTicketForm = React.useCallback(() => {
    const defaults = createDefaultTicketLocalState()
    setError(null)
    setOrderType(defaults.orderType)
    setLimitPrice(defaults.limitPrice)
    setTriggerPrice(defaults.triggerPrice)
    setReduceOnly(defaults.reduceOnly)
    setTimeInForce(defaults.timeInForce)
    setSizeUnit(defaults.sizeUnit)
    setBracketsOn(defaults.bracketsOn)
    setSizeAllocationPct(null)
  }, [])

  const applySizeAllocation = React.useCallback(
    (pct: number, cap: number) => {
      const next = Number(((cap * pct) / 100).toFixed(8))
      onQuantityChange(Math.max(MIN_TICKET_SIZE, next))
    },
    [onQuantityChange]
  )

  const [appliedPrefillRevision, setAppliedPrefillRevision] = React.useState(0)

  React.useEffect(() => {
    if (!externalPrefill?.highlightSubmit) return
    const timer = window.setTimeout(() => setSubmitPulse(false), 2_400)
    return () => window.clearTimeout(timer)
  }, [appliedPrefillRevision, externalPrefill?.highlightSubmit])

  if (
    externalPrefill?.revision &&
    externalPrefill.revision !== appliedPrefillRevision
  ) {
    setAppliedPrefillRevision(externalPrefill.revision)
    if (externalPrefill.orderType) setOrderType(externalPrefill.orderType)
    if (externalPrefill.limitPrice != null) {
      setLimitPrice(externalPrefill.limitPrice)
    }
    if (externalPrefill.highlightSubmit) {
      setSubmitPulse(true)
    }
    if (draft.stopLoss != null || draft.takeProfit != null) {
      setBracketsOn(true)
    }
    setError(null)
  }

  const positionQty = symbolPosition
    ? decimalNumber(symbolPosition.quantity)
    : 0

  const submit = async () => {
    if (
      disabled ||
      submitting ||
      submittingRef.current ||
      selectedPosition != null ||
      markPrice == null
    ) {
      return
    }
    if (UNSUPPORTED_PRO.has(orderType as TicketProType)) {
      setError(`${proLabel(orderType)} is not available in paper yet`)
      return
    }
    if (needsLimitPrice(orderType) && !(limitPrice != null && limitPrice > 0)) {
      setError("Enter a limit price")
      return
    }
    if (needsTrigger(orderType) && !(triggerPrice != null && triggerPrice > 0)) {
      setError("Enter a trigger price")
      return
    }
    setError(null)
    submittingRef.current = true
    setSubmitting(true)
    try {
      const result = await onSubmit({
        type: orderType,
        quantity: draft.quantity,
        price: needsLimitPrice(orderType) ? limitPrice : null,
        triggerPrice: needsTrigger(orderType) ? triggerPrice : null,
        reduceOnly: reduceOnly && positionQty > 0,
        timeInForce:
          orderType === "MARKET" ||
          orderType === "STOP_MARKET" ||
          orderType === "TAKE_MARKET"
            ? "FRONTEND_MARKET"
            : timeInForce,
      })
      if (result.ok) {
        resetLocalTicketForm()
        onOrderSuccess?.()
      } else {
        setError(result.error)
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const editing = selectedPosition != null
  const orderLocked = disabled || submitting || editing
  const bracketsSectionRef = React.useRef<HTMLDivElement>(null)
  const lastScrolledPositionId = React.useRef<string | null>(null)

  React.useEffect(() => {
    const id = selectedPosition?.id ?? null
    if (!id) {
      lastScrolledPositionId.current = null
      return
    }
    if (id === lastScrolledPositionId.current) return
    lastScrolledPositionId.current = id
    const timer = window.setTimeout(() => {
      bracketsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [selectedPosition?.id])

  React.useEffect(() => {
    const pct = sizeAllocationPctRef.current
    const cap = maxQtyRef.current
    if (pct == null || cap == null || !(cap > 0)) return
    applySizeAllocation(pct, cap)
  }, [
    leverage,
    reduceOnly,
    positionQty,
    limitPrice,
    triggerPrice,
    orderType,
    applySizeAllocation,
  ])

  const levelSide = editing ? selectedPosition.side : draft.side
  const levelEntry = editing
    ? decimalNumber(selectedPosition.entryPrice)
    : draft.entryPrice > 0
      ? draft.entryPrice
      : (markPrice ?? 0)
  const levelQty = editing ? decimalNumber(selectedPosition.quantity) : draft.quantity
  const levelSl = editing
    ? selectedPosition.stopLoss == null
      ? null
      : decimalNumber(selectedPosition.stopLoss)
    : draft.stopLoss
  const levelTp = editing
    ? selectedPosition.takeProfit == null
      ? null
      : decimalNumber(selectedPosition.takeProfit)
    : draft.takeProfit

  const slPnl =
    levelSl != null && levelEntry > 0
      ? projectedPnlAt(levelSide, levelEntry, levelQty, levelSl)
      : null
  const tpPnl =
    levelTp != null && levelEntry > 0
      ? projectedPnlAt(levelSide, levelEntry, levelQty, levelTp)
      : null

  const refPrice =
    needsLimitPrice(orderType) && limitPrice != null && limitPrice > 0
      ? limitPrice
      : needsTrigger(orderType) && triggerPrice != null && triggerPrice > 0
        ? triggerPrice
        : markPrice
  const buyingPowerQty =
    availableBalance != null &&
    availableBalance > 0 &&
    refPrice != null &&
    refPrice > 0 &&
    leverage > 0
      ? (availableBalance * leverage) / refPrice
      : null
  const maxQty =
    reduceOnly && positionQty > 0
      ? positionQty
      : buyingPowerQty
  const derivedSizePct =
    maxQty != null && maxQty > 0
      ? Math.min(100, Math.max(0, (draft.quantity / maxQty) * 100))
      : 0
  const sizePct = sizeAllocationPct ?? derivedSizePct
  maxQtyRef.current = maxQty

  const orderValue =
    refPrice != null && draft.quantity > 0 ? refPrice * draft.quantity : null
  const marginRequired =
    orderValue != null && leverage > 0 ? orderValue / leverage : null
  const isolatedLiq =
    marginMode === "ISOLATED" &&
    refPrice != null &&
    draft.quantity > 0 &&
    !reduceOnly
      ? previewIsolatedLiq({
          symbol,
          side: draft.side,
          quantity: draft.quantity,
          price: refPrice,
          leverage,
        })
      : symbolPosition
        ? decimalNumber(symbolPosition.liquidationPrice)
        : null
  const sizeDisplay =
    sizeUnit === "USDC" && refPrice != null && refPrice > 0
      ? draft.quantity * refPrice
      : draft.quantity
  const commitSize = (raw: number) => {
    let quantity = raw
    if (sizeUnit === "USDC") {
      if (refPrice == null || !(refPrice > 0)) return
      quantity = raw / refPrice
    }
    onQuantityChange(quantity)
    if (maxQty != null && maxQty > 0) {
      setSizeAllocationPct(
        Math.min(100, Math.max(0, (quantity / maxQty) * 100))
      )
    }
  }

  const showBrackets =
    !isProType(orderType) &&
    (editing ||
      bracketsOn ||
      draft.stopLoss != null ||
      draft.takeProfit != null ||
      placing ||
      levelSl != null ||
      levelTp != null)

  const selectOrderType = (next: TicketOrderType) => {
    setOrderType(next)
    setError(null)
    if (needsLimitPrice(next) && limitPrice == null && markPrice != null) {
      setLimitPrice(markPrice)
    }
    if (needsTrigger(next) && triggerPrice == null && markPrice != null) {
      setTriggerPrice(markPrice)
    }
  }

  const setSizeFromPct = (pct: number) => {
    if (maxQty == null || !(maxQty > 0)) return
    setSizeAllocationPct(pct)
    applySizeAllocation(pct, maxQty)
  }

  const toggleBrackets = (on: boolean) => {
    setBracketsOn(on)
    if (!on && !editing) {
      if (levelSl != null) onClearLevel("stopLoss")
      if (levelTp != null) onClearLevel("takeProfit")
    }
  }

  const levelBlock = (
    <div className="@container/brackets min-w-0">
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 gap-2",
          !mobile && !compact && "@min-[18rem]/brackets:grid-cols-2"
        )}
      >
        <LevelControl
          kind="SL"
          price={levelSl}
          pnl={slPnl}
          placing={interactionMode === "placing-sl"}
          markPrice={markPrice}
          onArm={() => onArmPlace("stopLoss")}
          onClear={() => onClearLevel("stopLoss")}
          onManual={(price) => onManualLevel("stopLoss", price)}
          onCancel={onCancelPlace}
          mobile={mobile}
        />
        <LevelControl
          kind="TP"
          price={levelTp}
          pnl={tpPnl}
          placing={interactionMode === "placing-tp"}
          markPrice={markPrice}
          onArm={() => onArmPlace("takeProfit")}
          onClear={() => onClearLevel("takeProfit")}
          onManual={(price) => onManualLevel("takeProfit", price)}
          onCancel={onCancelPlace}
          mobile={mobile}
        />
      </div>
    </div>
  )

  const orderTypeTabClass = (active: boolean) =>
    cn(
      mobile
        ? "h-8 rounded-md px-1.5 text-xs font-medium transition-colors hover:bg-transparent"
        : "relative h-6 rounded-none px-0 text-[11px] hover:bg-transparent hover:text-foreground",
      mobile
        ? active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
          : "text-muted-foreground hover:text-foreground/90"
        : cn(
            "text-muted-foreground hover:text-foreground",
            active &&
              "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground"
          )
    )

  return (
    <form
      data-tour="order-ticket"
      className={cn(
        "m-0 flex min-h-0 flex-col bg-transparent",
        mobile
          ? "gap-3 px-3 py-3 pb-24"
          : cn("gap-3 px-3", compact ? "gap-2.5 py-2" : "flex-1 pb-3")
      )}
      autoComplete="off"
      noValidate
      aria-label="Demo order ticket"
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void submit()
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !placing) return
        event.preventDefault()
        onCancelPlace()
      }}
    >
      <div
        className={cn(
          "sticky top-0 z-20 -mx-3 border-b border-border/60 bg-muted/85 px-3 pb-2.5 backdrop-blur-md",
          mobile ? "pt-0" : "pt-2.5"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <TicketMarketSwitcher
            symbol={symbol}
            onSymbolChange={onSymbolChange}
            compact={!mobile}
          />
          {markPrice != null ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatTradingPrice(markPrice)}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2.5",
          (editing || submitting) && "pointer-events-none opacity-45"
        )}
      >
        <MarginPills
          maxLeverage={maxLeverage}
          marginMode={marginMode}
          leverage={leverage}
          onMarginModeChange={onMarginModeChange}
          onLeverageChange={onLeverageChange}
          disabled={orderLocked}
          mobile={mobile}
        />

        <div
          role="tablist"
          aria-label="Order type"
          className={cn(
            mobile
              ? "grid grid-cols-3 gap-0.5 rounded-lg border border-border/40 bg-muted/15 p-0.5"
              : "flex h-7 items-end justify-start gap-4 border-b border-border/60 pb-0.5"
          )}
        >
        <Button
          type="button"
          variant="ghost"
          size={mobile ? "sm" : "xs"}
          role="tab"
          aria-selected={orderType === "MARKET"}
          className={orderTypeTabClass(orderType === "MARKET")}
          onClick={() => selectOrderType("MARKET")}
        >
          Market
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={mobile ? "sm" : "xs"}
          role="tab"
          aria-selected={orderType === "LIMIT"}
          className={orderTypeTabClass(orderType === "LIMIT")}
          onClick={() => selectOrderType("LIMIT")}
        >
          Limit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size={mobile ? "sm" : "xs"}
                role="tab"
                aria-selected={isProType(orderType)}
                aria-label="Pro order types"
                className={cn(
                  orderTypeTabClass(isProType(orderType)),
                  !mobile && "gap-0.5"
                )}
              />
            }
          >
            {isProType(orderType) ? proLabel(orderType) : "Pro"}
            <ChevronDownIcon className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-36">
            {PRO_TYPES.map((item) => (
              <DropdownMenuItem
                key={item.value}
                className={cn(
                  "text-[12px]",
                  orderType === item.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => selectOrderType(item.value)}
              >
                {item.label}
                {orderType === item.value ? (
                  <CheckIcon className="ml-auto size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Side">
          <Button
            type="button"
            size="sm"
            variant={draft.side === "LONG" ? "default" : "outline"}
            role="radio"
            aria-checked={draft.side === "LONG"}
            className={cn(
              "font-semibold",
              mobile ? "h-10 text-sm" : "h-8 text-[12px]"
            )}
            disabled={orderLocked}
            onClick={() => onSideChange("LONG")}
          >
            Buy / Long
          </Button>
          <Button
            type="button"
            size="sm"
            variant={draft.side === "SHORT" ? "destructive" : "outline"}
            role="radio"
            aria-checked={draft.side === "SHORT"}
            className={cn(
              "font-semibold",
              mobile ? "h-10 text-sm" : "h-8 text-[12px]"
            )}
            disabled={orderLocked}
            onClick={() => onSideChange("SHORT")}
          >
            Sell / Short
          </Button>
        </div>

      {mobile ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            Avail{" "}
            <span className="font-mono tabular-nums text-foreground/90">
              {availableBalance != null
                ? `${formatTradingPrice(availableBalance)} USDC`
                : "—"}
            </span>
          </span>
          <span>
            Pos{" "}
            <span className="font-mono tabular-nums text-foreground/90">
              {symbolPosition
                ? `${formatPositionQty(decimalNumber(symbolPosition.quantity))} ${symbolPosition.symbol}`
                : `0 ${symbol}`}
            </span>
          </span>
        </div>
      ) : (
        <div className="space-y-1 px-0.5 py-0.5 text-[10px] text-muted-foreground">
          <div className="flex justify-between gap-2">
            <span>Available to Trade</span>
            <span className="font-mono tabular-nums text-foreground/80">
              {availableBalance != null
                ? `${formatTradingPrice(availableBalance)} USDC`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Current Position</span>
            <span className="font-mono tabular-nums text-foreground/80">
              {symbolPosition
                ? `${formatPositionQty(decimalNumber(symbolPosition.quantity))} ${symbolPosition.symbol}`
                : `0.0000 ${symbol}`}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
      {needsTrigger(orderType) ? (
        <div className={ticketFieldRowClass(mobile)}>
          <Label className={ticketFieldLabelClass(mobile)}>
            Trigger (USDC)
          </Label>
          <div className="flex min-w-0 items-center gap-1">
            <DecimalField
              name="triggerPrice"
              value={triggerPrice}
              min={MIN_TICKET_SIZE}
              step={priceStep(triggerPrice ?? markPrice)}
              shiftStep={priceStep(triggerPrice ?? markPrice) * 10}
              disabled={orderLocked}
              aria-label="Trigger price"
              enterKeyHint="next"
              className={cn(ticketFieldInputClass(mobile), mobile ? "w-28" : "w-24")}
              onCommit={setTriggerPrice}
            />
            <Button
              type="button"
              size={mobile ? "sm" : "xs"}
              variant="ghost"
              className={cn(
                "font-medium text-primary hover:bg-transparent hover:text-primary",
                mobile ? "h-10 px-2 text-xs" : "h-5 px-1 text-[10px]"
              )}
              disabled={orderLocked || markPrice == null}
              onClick={() => markPrice != null && setTriggerPrice(markPrice)}
            >
              Mid
            </Button>
          </div>
        </div>
      ) : null}

      {needsLimitPrice(orderType) ? (
        <div className={ticketFieldRowClass(mobile)}>
          <Label htmlFor={priceId} className={ticketFieldLabelClass(mobile)}>
            Price (USDC)
          </Label>
          <div className="flex min-w-0 items-center gap-1">
            <DecimalField
              id={priceId}
              name="limitPrice"
              value={limitPrice}
              min={MIN_TICKET_SIZE}
              step={priceStep(limitPrice ?? markPrice)}
              shiftStep={priceStep(limitPrice ?? markPrice) * 10}
              disabled={orderLocked}
              aria-label="Limit price"
              enterKeyHint="next"
              className={cn(ticketFieldInputClass(mobile), mobile ? "w-28" : "w-24")}
              onCommit={setLimitPrice}
            />
            <Button
              type="button"
              size={mobile ? "sm" : "xs"}
              variant="ghost"
              className={cn(
                "font-medium text-primary hover:bg-transparent hover:text-primary",
                mobile ? "h-10 px-2 text-xs" : "h-5 px-1 text-[10px]"
              )}
              disabled={orderLocked || markPrice == null}
              onClick={() => markPrice != null && setLimitPrice(markPrice)}
            >
              Mid
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
      <div className={ticketFieldRowClass(mobile)}>
        <Label htmlFor={sizeId} className={ticketFieldLabelClass(mobile)}>
          Size
        </Label>
        <div
          className={cn(
            "flex min-w-0 flex-1 items-stretch overflow-hidden",
            mobile && "h-10 rounded-md border border-border/70 bg-background/80"
          )}
        >
          <DecimalField
            id={sizeId}
            name="quantity"
            value={sizeDisplay}
            min={MIN_TICKET_SIZE}
            step={sizeUnit === "USDC" ? 1 : 0.01}
            shiftStep={sizeUnit === "USDC" ? 10 : 0.1}
            disabled={orderLocked}
            aria-label="Size"
            enterKeyHint="go"
            className={cn(
              ticketFieldInputClass(mobile),
              "min-w-0 flex-1",
              mobile ? "px-2" : "px-1"
            )}
            onCommit={commitSize}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Size unit"
                  className={cn(
                    "shrink-0 gap-0.5 rounded-none border-0 border-l border-border/60 font-mono font-medium tabular-nums text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    mobile
                      ? "h-10 px-2 text-xs"
                      : "h-8 px-1.5 text-[10px]"
                  )}
                />
              }
            >
              {sizeUnit === "USDC" ? "USDC" : symbol}
              <ChevronDownIcon className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-24">
              <DropdownMenuItem onClick={() => setSizeUnit("COIN")}>
                {symbol}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSizeUnit("USDC")}>
                USDC
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SizeAllocationControl
        sizePct={sizePct}
        mobile={mobile}
        disabled={orderLocked || maxQty == null}
        onSelect={setSizeFromPct}
      />
      </div>
      </div>
      </div>

      <div
        className={cn(
          "py-0.5",
          mobile
            ? "flex flex-wrap items-center gap-x-4 gap-y-2"
            : "flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
        )}
      >
        <label
          htmlFor={reduceId}
          className={cn(
            "flex cursor-pointer items-center gap-2",
            mobile && "min-h-10"
          )}
        >
          <Checkbox
            id={reduceId}
            checked={reduceOnly}
            disabled={orderLocked || positionQty <= 0}
            className={mobile ? "size-4" : "size-3.5"}
            onCheckedChange={(checked) => setReduceOnly(checked === true)}
          />
          <span className={cn("text-muted-foreground", mobile ? "text-xs" : "text-[9px]")}>
            Reduce Only
          </span>
        </label>
        {!isProType(orderType) ? (
          <label
            htmlFor={bracketsId}
            className={cn(
              "flex cursor-pointer items-center gap-2",
              mobile && "min-h-10"
            )}
          >
            <Checkbox
              id={bracketsId}
              checked={showBrackets}
              disabled={orderLocked || editing}
              className={mobile ? "size-4" : "size-3.5"}
              onCheckedChange={(checked) => toggleBrackets(checked === true)}
            />
            <span className={cn("text-muted-foreground", mobile ? "text-xs" : "text-[9px]")}>
              TP / SL
            </span>
          </label>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!needsLimitPrice(orderType)}
            render={
              <Button
                type="button"
                variant="ghost"
                size={mobile ? "sm" : "xs"}
                aria-label="Time in force"
                className={cn(
                  "gap-1 text-muted-foreground",
                  mobile ? "h-10 px-0 text-xs" : "h-5 px-1 text-[9px]"
                )}
              />
            }
          >
            TIF {needsLimitPrice(orderType) ? timeInForce : "Ioc"}
            <ChevronDownIcon className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-24">
            {(["GTC", "IOC", "ALO"] as const).map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTimeInForce(value)}
              >
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {UNSUPPORTED_PRO.has(orderType as TicketProType) ? (
        <p className="text-[10px] text-muted-foreground">
          {proLabel(orderType)} is a Hyperliquid Pro type. Paper trading does
          not run it yet.
        </p>
      ) : null}

      {showBrackets ? (
        <div
          ref={bracketsSectionRef}
          className="scroll-mt-32"
          data-ticket-section="brackets"
        >
          {levelBlock}
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-1.5 border-border/50",
          mobile ? "space-y-2 border-t pt-3" : "border-t pt-2.5"
        )}
      >
        <MetaRow
          label="Liquidation Price"
          value={
            isolatedLiq != null && isolatedLiq > 0
              ? formatTradingPrice(isolatedLiq)
              : "—"
          }
          hint={
            marginMode === "CROSS"
              ? "Cross liquidation depends on the whole account."
              : undefined
          }
          mobile={mobile}
        />
        <MetaRow
          label="Order Value"
          value={orderValue != null ? formatTradingPrice(orderValue) : "—"}
          mobile={mobile}
        />
        <MetaRow
          label="Margin Required"
          value={
            marginRequired != null ? formatTradingPrice(marginRequired) : "—"
          }
          mobile={mobile}
        />
        <MetaRow
          label="Fees"
          value={`${(PAPER_EXECUTION_DEFAULTS.takerFeeBps / 100).toFixed(3)}% / ${(PAPER_EXECUTION_DEFAULTS.makerFeeBps / 100).toFixed(3)}%`}
          hint="Taker / maker. Charged on fill notional."
          mobile={mobile}
        />
      </div>

      <div
        className={cn(
          mobile &&
            "sticky bottom-0 z-10 -mx-3 space-y-1.5 border-t border-border/50 bg-background/95 px-3 py-2 backdrop-blur-xl supports-backdrop-filter:bg-background/80"
        )}
      >
        {error ? (
          <p
            id={errorId}
            className={cn(
              "text-destructive",
              mobile ? "text-xs leading-5" : "text-[11px]"
            )}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="sm"
          variant={draft.side === "LONG" ? "default" : "destructive"}
          className={cn(
            "w-full font-bold tracking-tight",
            mobile ? "h-11 text-base" : "h-10 text-[13px]",
            submitPulse &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
          )}
          disabled={
            orderLocked ||
            markPrice == null ||
            UNSUPPORTED_PRO.has(orderType as TicketProType)
          }
          aria-busy={submitting}
          aria-describedby={error ? errorId : undefined}
        >
          {submitting
            ? "Placing…"
            : `${draft.side === "LONG" ? "Buy" : "Sell"} ${symbol}`}
        </Button>
      </div>

      {!compact && !mobile ? (
        <div className="mt-auto space-y-2 border-t border-border/50 pt-3">
          <p className="text-[11px] font-semibold">Unified Account Summary</p>
          <MetaRow
            label="Unified Account Ratio"
            value={
              equity != null &&
              equity > 0 &&
              maintenanceMargin != null
                ? `${((maintenanceMargin / equity) * 100).toFixed(2)}%`
                : "0.00%"
            }
            hint="Maintenance margin as a share of equity."
          />
          <MetaRow
            label="Portfolio Value"
            value={
              equity != null ? `$${formatTradingPrice(equity)}` : "$0.00"
            }
          />
          <MetaRow
            label="Unrealized PNL"
            value={
              unrealizedPnl != null
                ? formatTradingPnl(unrealizedPnl)
                : "$0.00"
            }
          />
          <MetaRow
            label="Perps Maintenance Margin"
            value={
              maintenanceMargin != null
                ? `$${formatTradingPrice(maintenanceMargin)}`
                : "$0.00"
            }
          />
          <MetaRow
            label="Unified Account Leverage"
            value={
              accountLeverage != null
                ? `${accountLeverage.toFixed(2)}x`
                : "0.00x"
            }
            hint="Open position notional divided by equity."
          />
        </div>
      ) : null}
    </form>
  )
}

export { OrderTicket }
