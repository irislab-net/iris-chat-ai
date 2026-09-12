"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react"
import {
  CandlestickChartIcon,
  LayoutListIcon,
  ReceiptIcon,
  SendHorizonalIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"

import {
  DESK_BODY_H,
  DESK_CHROME_H,
  DESK_FOOTER_H,
  DESK_FRAME_CLASS,
  DESK_TICKER_H,
} from "@/components/landing/hero-desk-frame"
import { IrisLabAvatar } from "@/components/brand/iris-lab-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/**
 * Auto-demo loop. The side alternates every pass so the desk shows both a
 * long and a short.
 *
 * Desktop (lg+):
 * 1. Watch IRIS signal on chart → click marker → IRIS chat → bracket plan
 * 2. IRIS fills ticket → place order → price resolves to TP → toast
 *
 * Phone (< sm):
 * 1. Chart tab with signal → Trade tab → full-screen IRIS chat
 * 2. User types → plan streams → chat closes → form fills → order sends
 * 3. Chart tab with live PnL → Book tab flash → toast → repeat
 */

const AI_REPLY = "Aligned with the 15m stance. Bracket ready:"
const AI_FOOTNOTE = "R:R 2.0× · analysis, not advice"
const USER_AVATAR_SRC =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80"

type Phase =
  | "watch"
  | "toSignal"
  | "clickSignal"
  | "toChat"
  | "typing"
  | "ai"
  | "toTicket"
  | "filling"
  | "clickTicket"
  | "running"
  | "settling"
  | "toast"
  | "hold"

type Point = { x: number; y: number }

function HandDrawnRing({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 254 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
        fill="currentColor"
      />
    </svg>
  )
}

const CANDLE_UP = "#10b981"
const CANDLE_DOWN = "#ef4444"

type LevelKey = "tp" | "entry" | "sl"

function levelLineOpacity(key: LevelKey, signalHot: boolean) {
  if (key === "entry") return signalHot ? 0.8 : 0.5
  return signalHot ? 0.72 : 0.45
}

function levelLabelClass(_key: LevelKey, signalHot: boolean) {
  return signalHot ? "text-foreground/90" : "text-muted-foreground/70"
}

/** Dense TradingView-style candles — green/red bodies with thin wicks. */
function TvCandle({
  x,
  open,
  close,
  high,
  low,
  w = 3.2,
}: {
  x: number
  open: number
  close: number
  high: number
  low: number
  w?: number
}) {
  const up = close <= open
  const color = up ? CANDLE_UP : CANDLE_DOWN
  const bodyTop = Math.min(open, close)
  const bodyH = Math.max(Math.abs(close - open), 0.9)
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={high}
        y2={low}
        stroke={color}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeOpacity={up ? 0.9 : 0.75}
      />
      <rect
        x={x - w / 2}
        y={bodyTop}
        width={w}
        height={bodyH}
        rx={0.35}
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
        fillOpacity={up ? 0.95 : 0.88}
      />
    </g>
  )
}

/**
 * Chart geometry. The y axis is inverted (higher y = lower price) and maps
 * linearly onto PRICE_AXIS: price = 3520 - (y - 18) * 2.
 */
const CANDLE_COUNT = 56
const CANDLE_LEFT = 22
const CANDLE_STEP = 5.7
const CANDLE_TOP = 24
const CANDLE_BOTTOM = 150
/** Series drifts back toward the IRIS entry level so the signal stays framed. */
const CANDLE_ANCHOR = 78

type Candle = { o: number; c: number; h: number; l: number; vol: number }

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

const yToPrice = (y: number) => 3520 - (y - 18) * 2
const priceToY = (p: number) => 18 + (3520 - p) / 2

/** Deterministic PRNG so server and client render the same first frame. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One bar of a mean-reverting random walk, opening at the previous close. */
function nextCandle(
  prevClose: number,
  rand: () => number,
  anchor = CANDLE_ANCHOR
): Candle {
  const open = prevClose
  const drift = (anchor - open) * 0.055
  const shock = (rand() + rand() + rand() - 1.5) * 7.5
  const close = clamp(open + drift + shock, CANDLE_TOP, CANDLE_BOTTOM)
  const spread = Math.abs(close - open)
  return {
    o: open,
    c: close,
    h: clamp(
      Math.min(open, close) - (0.5 + rand() * (1.6 + spread * 0.5)),
      CANDLE_TOP - 8,
      CANDLE_BOTTOM
    ),
    l: clamp(
      Math.max(open, close) + (0.5 + rand() * (1.6 + spread * 0.5)),
      CANDLE_TOP,
      CANDLE_BOTTOM + 8
    ),
    vol: clamp(5 + rand() * 14 + spread * 1.6, 4, 30),
  }
}

function buildSeries(seed: number): Candle[] {
  const rand = mulberry32(seed)
  const out: Candle[] = []
  let prev = 92
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const candle = nextCandle(prev, rand)
    out.push(candle)
    prev = candle.c
  }
  return out
}

/**
 * Advance the live bar, rolling into a fresh one every few ticks. `anchor`
 * lets the demo pull the tape toward the running mark price so the candles
 * and the position agree while the trade plays out.
 */
function tickSeries(
  prev: Candle[],
  tick: number,
  rand: () => number,
  anchor = CANDLE_ANCHOR,
  pull = 0.025
) {
  const next = prev.slice()
  const last = { ...next[next.length - 1] }

  if (tick % 6 === 0) {
    next.shift()
    next.push(nextCandle(last.c, rand, anchor))
    return next
  }

  const move = (rand() + rand() - 1) * 3.2 + (anchor - last.c) * pull
  last.c = clamp(last.c + move, CANDLE_TOP, CANDLE_BOTTOM)
  last.h = Math.min(last.h, Math.min(last.o, last.c) - rand() * 1.1)
  last.l = Math.max(last.l, Math.max(last.o, last.c) + rand() * 1.1)
  last.vol = clamp(last.vol + rand() * 1.6, 4, 30)
  next[next.length - 1] = last
  return next
}

/**
 * Volume bars + candles for the whole window. Memoized so the story's own
 * re-renders (typing, ticket fills, mark price) never re-diff 100+ svg nodes;
 * only a tape tick does.
 */
const CandleTape = React.memo(function CandleTape({
  series,
}: {
  series: Candle[]
}) {
  return (
    <>
      {series.map((c, i) => {
        const up = c.c <= c.o
        return (
          <rect
            key={`vol-${i}`}
            x={CANDLE_LEFT + i * CANDLE_STEP - 1.4}
            y={194 - c.vol}
            width="2.8"
            height={c.vol}
            rx={0.4}
            className="fill-foreground"
            opacity={up ? 0.22 : 0.14}
          />
        )
      })}
      {series.map((c, i) => (
        <TvCandle
          key={i}
          x={CANDLE_LEFT + i * CANDLE_STEP}
          open={c.o}
          close={c.c}
          high={c.h}
          low={c.l}
        />
      ))}
    </>
  )
})

/** Trade model. Both sides risk 45 and target 90 → a clean 2R plan. */
const ENTRY_PRICE = 3400
const POSITION_SIZE = 0.42
const LEVERAGE = 10
/** Where the ticket's size slider lands once IRIS sets the size. */
const SIZE_PCT = 42

const TRADES = {
  long: { tp: 3490, sl: 3355, label: "Long" },
  short: { tp: 3310, sl: 3445, label: "Short" },
} as const

type Side = keyof typeof TRADES

const fmtPrice = (p: number) =>
  p.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

/** TP / Entry / SL rows for a side, ordered top-to-bottom on the chart. */
function tradeLevels(side: Side) {
  const rows: {
    key: LevelKey
    label: string
    price: number
    dash: string
  }[] = [
    { key: "tp", label: "TP", price: TRADES[side].tp, dash: "3 2" },
    { key: "entry", label: "IRIS Entry", price: ENTRY_PRICE, dash: "4 2.5" },
    { key: "sl", label: "SL", price: TRADES[side].sl, dash: "3 2" },
  ]
  return rows
    .map((r) => ({ ...r, y: priceToY(r.price) }))
    .sort((a, b) => a.y - b.y)
}

/** Mark price for a 0→1 walk from entry to the take-profit. */
function markFromProgress(side: Side, progress: number) {
  return ENTRY_PRICE + (TRADES[side].tp - ENTRY_PRICE) * progress
}

function pnlPercent(side: Side, mark: number) {
  const dir = side === "long" ? 1 : -1
  return ((mark - ENTRY_PRICE) / ENTRY_PRICE) * LEVERAGE * dir
}

const TP_PCT = pnlPercent("long", TRADES.long.tp)

/** Where the stop sits on the entry→target scale (negative, both sides). */
const STOP_PROGRESS =
  (TRADES.long.sl - ENTRY_PRICE) / (TRADES.long.tp - ENTRY_PRICE)

const userPrompt = (side: Side) =>
  `Take the ETH ${side} from the signal?`

/** Ticket rows, revealed one at a time as IRIS fills the form. */
function planRows(side: Side) {
  return [
    { label: "Side", value: TRADES[side].label },
    { label: "Size", value: `${POSITION_SIZE} ETH` },
    { label: "Stop", value: fmtPrice(TRADES[side].sl) },
    { label: "Target", value: fmtPrice(TRADES[side].tp) },
  ]
}

const PRICE_AXIS = [
  { y: 18, t: "3,520" },
  { y: 48, t: "3,460" },
  { y: 78, t: "3,400" },
  { y: 108, t: "3,340" },
  { y: 138, t: "3,280" },
] as const

const TIME_AXIS = [
  { x: 40, t: "11:00" },
  { x: 120, t: "11:40" },
  { x: 200, t: "12:20" },
  { x: 280, t: "13:00" },
] as const

/**
 * The plot svg is stretched with preserveAspectRatio="none", so anything with
 * glyphs has to live in the HTML overlay instead — otherwise it scales
 * non-uniformly with the container. These map viewBox units to overlay %.
 */
const VB_W = 400
const VB_H = 210
const PLOT_RIGHT = 348
const AXIS_LEFT_PAD = 4

const pctX = (x: number) => `${(x / VB_W) * 100}%`
const pctY = (y: number) => `${(y / VB_H) * 100}%`

/** Hide axis rows that a level or the live mark badge already covers. */
function axisTicks(markY: number, levelYs: number[]) {
  return PRICE_AXIS.filter(
    (p) => ![...levelYs, markY].some((y) => Math.abs(y - p.y) < 11)
  )
}

const DRAW_TOOLS = ["+", "/", "◇", "T", "⌀", "⋯"] as const

const BOOK_ASKS = [
  { price: "3,414.20", size: "8.1", w: 28 },
  { price: "3,413.60", size: "21.6", w: 62 },
  { price: "3,412.90", size: "14.2", w: 44 },
] as const

const BOOK_BIDS = [
  { price: "3,412.40", size: "18.7", w: 56 },
  { price: "3,411.20", size: "24.1", w: 72 },
  { price: "3,410.60", size: "6.8", w: 22 },
] as const

/**
 * Hyperliquid-style ticket input: muted box, label on the left, value and
 * unit on the right. Stays blank until IRIS writes the plan into it.
 */
function TicketField({
  label,
  unit,
  filled,
  children,
  tall = false,
}: {
  label: string
  unit?: string
  filled: boolean
  children: React.ReactNode
  tall?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-1.5 rounded-lg border px-2 transition-colors",
        tall ? "h-8" : "h-7",
        filled
          ? "border-foreground/20 bg-muted/35"
          : "border-border/50 bg-muted/20"
      )}
    >
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1 text-foreground">
        {filled ? (
          <motion.span
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="font-mono text-[11px] font-medium tabular-nums"
          >
            {children}
          </motion.span>
        ) : (
          <span className="block h-2.5 w-10 rounded-sm bg-border/60" />
        )}
        {unit ? (
          <span className="text-[9px] text-muted-foreground">{unit}</span>
        ) : null}
      </span>
    </div>
  )
}

const MOBILE_DEMO_TIMING = {
  chartWarm: 2_200,
  chartSignal: 3_200,
  tradeTab: 2_400,
  chatOpen: 1_800,
  typeMs: 62,
  afterType: 1_100,
  afterSend: 1_600,
  fillStart: 1_000,
  fillField: 780,
  armed: 1_500,
  afterOrder: 2_000,
  runSteps: 24,
  runStepMs: 220,
  settle: 1_800,
  book: 3_800,
  chartReturn: 2_000,
  toast: 3_200,
  hold: 1_400,
} as const

const MOBILE_HERO_TRACK =
  "rounded-full border border-white/8 bg-linear-to-b from-white/6 via-white/2 to-transparent p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_12px_32px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl"

const MOBILE_HERO_PILL =
  "rounded-full border border-white/10 bg-linear-to-b from-card/95 via-card/80 to-card/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_24px_-14px_rgba(255,255,255,0.1)]"

const MOBILE_HERO_SOFT_BTN =
  "rounded-full border-border/30 bg-linear-to-b from-background/85 to-muted/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-sm hover:from-background/95 hover:to-muted/25"

const MOBILE_HERO_PRIMARY_BTN =
  "rounded-full border border-white/12 bg-linear-to-b from-foreground via-foreground/92 to-foreground/82 text-background shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_10px_28px_-16px_rgba(255,255,255,0.14)]"

const MOBILE_HERO_COUNT =
  "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-white/10 bg-linear-to-b from-foreground/14 to-foreground/6 px-1 font-mono text-[8px] font-semibold leading-none text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)]"

const DESK_TICKET_SOFT_BTN =
  "rounded-lg border-border/45 bg-muted/20 font-medium text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-muted/30 hover:text-foreground"

const DESK_TICKET_ACTIVE_BTN =
  "rounded-lg border-foreground/35 bg-foreground text-background shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-foreground/90 hover:text-background"

const DESK_TICKET_TAB_LIST =
  "h-7 w-full grid grid-cols-3 gap-0.5 rounded-lg border border-border/45 bg-muted/15 p-0.5"

const DESK_TICKET_TAB_TRIGGER =
  "h-full rounded-md px-0 text-[10px] capitalize text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm"

const DeskTicketForm = React.memo(function DeskTicketForm({
  side,
  filled,
  ticketArmed,
  positionOpen,
  ticketRef,
  embedded = false,
  mobile = false,
}: {
  side: Side
  filled: number
  ticketArmed: boolean
  positionOpen: boolean
  ticketRef: React.RefObject<HTMLDivElement | null>
  embedded?: boolean
  mobile?: boolean
}) {
  const softBtn = mobile ? MOBILE_HERO_SOFT_BTN : DESK_TICKET_SOFT_BTN
  const activeBtn = mobile ? MOBILE_HERO_PRIMARY_BTN : DESK_TICKET_ACTIVE_BTN

  const topBlock = (
    <>
      <div className="grid shrink-0 grid-cols-2 gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          tabIndex={-1}
          className={cn(mobile ? "h-7 text-[10px]" : "h-6 text-[10px]", softBtn)}
        >
          Cross
        </Button>
        <Button
          variant="ghost"
          size="xs"
          tabIndex={-1}
          className={cn(mobile ? "h-7 text-[10px]" : "h-6 text-[10px]", softBtn)}
        >
          {LEVERAGE}×
        </Button>
      </div>

      <Tabs value="market" className="shrink-0 gap-0">
        <TabsList
          variant={mobile ? "line" : "default"}
          className={cn(
            mobile
              ? "h-6 w-full justify-start gap-3 border-b border-border/40 p-0"
              : DESK_TICKET_TAB_LIST
          )}
        >
          {["market", "limit", "pro"].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn(
                "flex-none capitalize",
                mobile ? "px-0 text-[10px]" : DESK_TICKET_TAB_TRIGGER
              )}
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid shrink-0 grid-cols-2 gap-1.5">
        {(["long", "short"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant="ghost"
            tabIndex={-1}
            className={cn(
              mobile ? "h-8 text-[11px]" : "h-7 text-[11px]",
              filled >= 1 && side === s ? activeBtn : softBtn
            )}
          >
            {s === "long" ? "Buy / Long" : "Sell / Short"}
          </Button>
        ))}
      </div>

      <TicketField label="Size" unit="ETH" filled={filled >= 2} tall={mobile}>
        {POSITION_SIZE}
      </TicketField>

      <div className="shrink-0 px-0.5">
        {mobile ? (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-foreground/75 transition-[width] duration-500 ease-out"
                style={{ width: filled >= 2 ? `${SIZE_PCT}%` : "0%" }}
              />
            </div>
            <div className="flex justify-between font-mono text-[8px] text-muted-foreground/80">
              <span>0</span>
              <span>100%</span>
            </div>
          </div>
        ) : (
          <>
            <Slider
              value={[filled >= 2 ? SIZE_PCT : 0]}
              disabled
              aria-hidden
              className="**:data-[slot=slider-range]:bg-foreground/70 **:data-[slot=slider-thumb]:size-2.5 **:data-[slot=slider-thumb]:border-foreground/25 **:data-[slot=slider-thumb]:bg-background **:data-[slot=slider-thumb]:ring-foreground/15"
            />
            <div className="mt-0.5 flex justify-between font-mono text-[8px] text-muted-foreground/80">
              {["0", "25", "50", "75", "100%"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )

  const tpSlBlock = (
    <>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "flex size-3.5 items-center justify-center rounded-md border text-[7px] leading-none transition-colors",
            filled >= 3
              ? "border-foreground/35 bg-foreground text-background"
              : "border-border/50 bg-muted/20 text-transparent"
          )}
        >
          {filled >= 3 ? "✓" : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">TP / SL</span>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1.5">
        <TicketField label="SL" filled={filled >= 3} tall={mobile}>
          {fmtPrice(TRADES[side].sl)}
        </TicketField>
        <TicketField label="TP" filled={filled >= 4} tall={mobile}>
          {fmtPrice(TRADES[side].tp)}
        </TicketField>
      </div>
    </>
  )

  const submitBlock = (
    <div
      ref={ticketRef}
      className={cn(
        "shrink-0 rounded-lg transition-shadow",
        ticketArmed || positionOpen
          ? embedded
            ? "ring-2 ring-foreground/25"
            : "ring-2 ring-foreground/20 ring-offset-2 ring-offset-card"
          : ""
      )}
    >
      <Button
        size="sm"
        variant="ghost"
        tabIndex={-1}
        className={cn(
          "w-full font-semibold",
          mobile ? "h-9 text-[11px]" : "h-8 text-[11px]",
          activeBtn
        )}
      >
        {positionOpen ? `Filled · ${TRADES[side].label}` : "Place Order"}
      </Button>
    </div>
  )

  const bottomBlock = (
    <>
      {tpSlBlock}
      {submitBlock}
    </>
  )

  if (mobile) {
    return (
      <div className="pointer-events-none flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-2">
          <div className="flex flex-col gap-2.5">
            {topBlock}
            {tpSlBlock}
          </div>
        </div>
        <div className="shrink-0 border-t border-border/40 bg-card/95 px-3 pt-2 pb-3">
          {submitBlock}
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none flex shrink-0 flex-col gap-2 border-t border-border/40 bg-card/80 px-3 pt-2.5 pb-3">
      {topBlock}
      {bottomBlock}
    </div>
  )
})

function IrisAvatar() {
  return <IrisLabAvatar />
}

function UserAvatar() {
  return (
    <Avatar size="sm">
      <AvatarImage
        src={USER_AVATAR_SRC}
        alt="Trader"
        loading="lazy"
        decoding="async"
      />
      <AvatarFallback className="bg-foreground text-background">
        <UserIcon className="size-3" />
      </AvatarFallback>
    </Avatar>
  )
}

/** Price tag pinned to the right axis at a given viewBox row. */
function AxisTag({
  y,
  children,
  tone = "muted",
  className,
}: {
  y: number
  children: React.ReactNode
  tone?: "ghost" | "muted" | "entry" | "tp" | "sl" | "mark-up" | "mark-down"
  className?: string
}) {
  return (
    <span
      className={cn(
        "absolute -translate-y-1/2 rounded-[3px] px-1 py-px font-mono text-[9px] leading-[1.4] tabular-nums",
        tone === "entry" && "bg-foreground font-medium text-background",
        tone === "tp" &&
          "border border-border/60 bg-muted/80 font-medium text-foreground",
        tone === "sl" &&
          "border border-border/60 bg-muted/80 font-medium text-foreground",
        tone === "mark-up" && "bg-foreground font-medium text-background",
        tone === "mark-down" && "bg-foreground font-medium text-background",
        tone === "muted" && "bg-muted text-foreground",
        tone === "ghost" && "text-muted-foreground",
        className
      )}
      style={{
        top: pctY(y),
        left: `calc(${pctX(PLOT_RIGHT)} + ${AXIS_LEFT_PAD}px)`,
      }}
    >
      {children}
    </span>
  )
}

/** The demo only drives itself on a desk-sized viewport. */
const LARGE_QUERY = "(min-width: 1024px)"

function subscribeToLarge(onChange: () => void) {
  const media = window.matchMedia(LARGE_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function useIsLarge() {
  return React.useSyncExternalStore(
    subscribeToLarge,
    () => window.matchMedia(LARGE_QUERY).matches,
    () => false
  )
}

/** Phones only — matches Tailwind `sm` (640px). Tablets keep the static tablet layout. */
const MOBILE_PHONE_QUERY = "(max-width: 639px)"

function subscribeToMobilePhone(onChange: () => void) {
  const media = window.matchMedia(MOBILE_PHONE_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function useIsMobilePhone() {
  return React.useSyncExternalStore(
    subscribeToMobilePhone,
    () => window.matchMedia(MOBILE_PHONE_QUERY).matches,
    () => false
  )
}

function IrisCoPilotHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-2.5",
        className
      )}
    >
      <span className="relative flex size-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-border/80 dark:border-white/10" />
        <span className="absolute -inset-1 rounded-full border border-border/40 dark:border-white/5" />
        <span className="relative text-[9px] font-black tracking-tight">IR</span>
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-tight">IRIS AI</p>
        <p className="text-[10px] text-muted-foreground">Desk co-pilot</p>
      </div>
    </div>
  )
}

function IrisStanceCard({
  side,
  conviction,
  className,
}: {
  side: Side
  conviction: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-tight uppercase">
          {side}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          ETH · 15m
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full origin-left rounded-full bg-foreground/80 transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${conviction / 100})` }}
          />
        </div>
        <span className="font-mono text-[10px] font-medium tabular-nums">
          {conviction}%
        </span>
      </div>
    </div>
  )
}

function IrisChatComposer({
  draft,
  phase,
  composerRef,
  active = false,
  className,
}: {
  draft: string
  phase: Phase
  composerRef: React.RefObject<HTMLDivElement | null>
  active?: boolean
  className?: string
}) {
  const typing = phase === "typing" || active
  return (
    <div
      ref={composerRef}
      className={cn(
        "shrink-0 rounded-2xl border px-2.5 py-2 text-left text-[10px] transition-all",
        typing
          ? "border-white/12 bg-linear-to-b from-muted/35 to-muted/15 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-white/8"
          : "border-border/45 bg-linear-to-b from-muted/20 via-card/35 to-muted/10 text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {draft ? (
        <span>{draft}</span>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/20 text-foreground/75">
              <SparklesIcon className="size-2.5" />
            </span>
            <span className="truncate text-foreground/80">
              Ask IRIS for a trade plan...
            </span>
          </span>
          <Button
            size="xs"
            variant="ghost"
            tabIndex={-1}
            className={cn(
              "h-7 gap-1 px-2.5 text-[9px] font-medium",
              typing ? MOBILE_HERO_PRIMARY_BTN : MOBILE_HERO_SOFT_BTN
            )}
          >
            <SendHorizonalIcon className="size-2.5" />
            Send
          </Button>
        </div>
      )}
      {typing ? (
        <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground align-middle" />
      ) : null}
    </div>
  )
}

type MobileHeroPane = "chart" | "trade" | "book"

const MOBILE_HERO_TABS: {
  id: MobileHeroPane
  label: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}[] = [
  { id: "chart", label: "Chart", icon: CandlestickChartIcon },
  { id: "trade", label: "Trade", icon: ReceiptIcon },
  { id: "book", label: "Book", icon: LayoutListIcon },
]

function MobileHeroTabs({
  pane,
  hasPosition,
}: {
  pane: MobileHeroPane
  hasPosition: boolean
}) {
  const activeIndex = MOBILE_HERO_TABS.findIndex((item) => item.id === pane)

  return (
    <div
      role="tablist"
      aria-label="Desk views"
      className={cn("relative overflow-hidden", MOBILE_HERO_TRACK)}
    >
      <div className="relative grid grid-cols-3 gap-0.5">
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              MOBILE_HERO_PILL
            )}
            style={{
              width: "calc((100% - 0.25rem) / 3)",
              transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.125}rem))`,
            }}
          />
        ) : null}
        {MOBILE_HERO_TABS.map((item) => {
          const Icon = item.icon
          const active = pane === item.id
          return (
            <span
              key={item.id}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative z-10 flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 transition-colors duration-300",
                active ? "text-foreground" : "text-muted-foreground/60"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0 transition-[stroke-width,color] duration-300",
                  active
                    ? "stroke-[2.25] text-foreground"
                    : "stroke-[1.75] text-muted-foreground/65"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "truncate text-[11px] leading-none tracking-tight",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
              {item.id === "book" && hasPosition ? (
                <span className={MOBILE_HERO_COUNT}>1</span>
              ) : null}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function MobileHeroNav({
  pane,
  hasPosition,
  chatOpen,
  phase,
  signalHot,
  ticketArmed,
}: {
  pane: MobileHeroPane
  hasPosition: boolean
  chatOpen: boolean
  phase: Phase
  signalHot: boolean
  ticketArmed: boolean
}) {
  const step = chatOpen
    ? 3
    : pane === "chart"
      ? phase === "running" || phase === "settling"
        ? 5
        : 1
      : pane === "trade"
        ? phase === "filling" || ticketArmed || phase === "clickTicket"
          ? 4
          : 2
        : pane === "book"
          ? 6
          : 1

  const label = chatOpen
    ? phase === "typing"
      ? "Type your question to IRIS"
      : "IRIS co-pilot"
    : pane === "chart"
      ? phase === "running" || phase === "settling"
        ? "Position running toward target"
        : signalHot
          ? "IRIS signal on the chart"
          : "Watch the live chart"
      : pane === "trade"
        ? phase === "filling"
          ? "IRIS fills the order ticket"
          : ticketArmed || phase === "clickTicket"
            ? "Place the order"
            : "Open the trade ticket"
        : pane === "book"
          ? "Review open position"
          : "Desk demo"

  return (
    <div className="order-2 shrink-0 space-y-2 border-t border-border/30 bg-muted/10 px-3.5 pb-3 pt-2.5 sm:hidden">
      <MobileHeroTabs pane={pane} hasPosition={hasPosition} />
      {pane !== "trade" ? (
        <div className="rounded-2xl border border-white/8 bg-linear-to-b from-card/40 to-card/15 px-3 py-2 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                aria-hidden
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  n === step ? "w-5 bg-foreground" : "w-1 bg-border/80",
                  n < step && "bg-foreground/40"
                )}
              />
            ))}
          </div>
          <p className="text-[11px] font-medium tracking-tight text-foreground/90">
            {label}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function HeroChartPlot({
  series,
  levels,
  signalHot,
  side,
  signalRef,
  markY,
  markPrice,
  ticks,
  lastBar,
  barChangePct,
  compact = false,
}: {
  series: Candle[]
  levels: ReturnType<typeof tradeLevels>
  signalHot: boolean
  side: Side
  signalRef: React.RefObject<HTMLDivElement | null>
  markY: number
  markPrice: string
  ticks: { y: number; t: string }[]
  lastBar: Candle
  barChangePct: number
  compact?: boolean
}) {
  return (
    <>
      <svg
        viewBox="0 0 400 210"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[18, 48, 78, 108, 138].map((y) => (
          <line
            key={`h-${y}`}
            x1="0"
            x2="348"
            y1={y}
            y2={y}
            className="stroke-border"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2 4"
            strokeOpacity="0.7"
          />
        ))}
        {[60, 120, 180, 240, 300].map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            x2={x}
            y1="0"
            y2="158"
            className="stroke-border"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2 4"
            strokeOpacity="0.45"
          />
        ))}

        <CandleTape series={series} />

        {levels.map((lvl) => (
          <line
            key={lvl.key}
            x1="0"
            x2="348"
            y1={lvl.y}
            y2={lvl.y}
            className="stroke-foreground"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={lvl.dash}
            strokeOpacity={levelLineOpacity(lvl.key, signalHot)}
          />
        ))}

        <line
          x1="348"
          x2="348"
          y1="0"
          y2="200"
          className="stroke-border"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        <line
          x1="0"
          x2="348"
          y1={markY}
          y2={markY}
          className="stroke-foreground"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeOpacity="0.38"
          strokeDasharray="2 3"
        />
      </svg>

      <div
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden
      >
        {ticks.map((p) => (
          <AxisTag key={p.t} y={p.y} tone="ghost">
            {p.t}
          </AxisTag>
        ))}

        <AxisTag y={markY} tone="mark-up">
          {markPrice}
        </AxisTag>

        {levels.map((lvl) => (
          <React.Fragment key={lvl.key}>
            <AxisTag
              y={lvl.y}
              tone={lvl.key}
              className={cn(
                lvl.key !== "entry" && !compact && "hidden sm:inline-flex",
                lvl.key !== "entry" && compact && "hidden"
              )}
            >
              {fmtPrice(lvl.price)}
            </AxisTag>
            {!compact ? (
              <span
                className={cn(
                  "absolute -translate-y-full pl-1 text-[8px] leading-none font-medium tracking-tight transition-opacity sm:text-[9px]",
                  levelLabelClass(lvl.key, signalHot),
                  lvl.key !== "entry" && "hidden sm:inline"
                )}
                style={{ top: pctY(lvl.y - 2), left: 0 }}
              >
                {lvl.label}
              </span>
            ) : null}
          </React.Fragment>
        ))}

        {!compact ? (
          <>
            <span
              className="absolute left-1 text-[9px] leading-none text-muted-foreground"
              style={{ top: pctY(150) }}
            >
              Volume
            </span>

            {TIME_AXIS.map((t) => (
              <span
                key={t.t}
                className="absolute -translate-x-1/2 font-mono text-[9px] leading-none text-muted-foreground tabular-nums"
                style={{ top: pctY(200), left: pctX(t.x) }}
              >
                {t.t}
              </span>
            ))}
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="pointer-events-none absolute top-1.5 left-1.5 z-10 max-w-[72%] font-mono text-[8px] leading-tight text-muted-foreground sm:left-2 sm:max-w-[85%] sm:text-[9px]">
          <p className="truncate">
            <span className="font-sans font-medium text-foreground/90">
              ETHUSD
            </span>
            <span className="mx-1">·</span>
            <span>15m</span>
          </p>
          <p className="mt-0.5 hidden truncate tabular-nums sm:block">
            O {yToPrice(lastBar.o).toFixed(1)} H {yToPrice(lastBar.h).toFixed(1)}{" "}
            L {yToPrice(lastBar.l).toFixed(1)} C {yToPrice(lastBar.c).toFixed(1)}
            <span className="ml-1 text-muted-foreground">
              {barChangePct >= 0 ? "+" : ""}
              {barChangePct.toFixed(2)}%
            </span>
          </p>
          <p
            className={cn(
              "mt-0.5 hidden sm:block",
              signalHot ? "text-foreground/80" : "text-muted-foreground/70"
            )}
          >
            IRIS Signal · {TRADES[side].label} · Entry {fmtPrice(ENTRY_PRICE)} ·{" "}
            SL {fmtPrice(TRADES[side].sl)} · TP {fmtPrice(TRADES[side].tp)}
          </p>
        </div>
      ) : null}

      <div
        ref={signalRef}
        className={cn(
          "pointer-events-none absolute left-[40%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-sm border px-1.5 py-0.5 text-[8px] font-medium tracking-wide transition-opacity",
          signalHot
            ? "border-foreground/40 bg-foreground text-background"
            : "border-border/60 bg-card/90 text-muted-foreground"
        )}
        style={{ top: pctY(priceToY(ENTRY_PRICE)) }}
      >
        IRIS {TRADES[side].label}
      </div>
    </>
  )
}

function MobileIrisOverlay({
  draft,
  userMsg,
  aiMsg,
  aiThinking,
  planOpen,
  rows,
  phase,
  chatRef,
}: {
  draft: string
  userMsg: string | null
  aiMsg: string
  aiThinking: boolean
  planOpen: boolean
  rows: { label: string; value: string }[]
  phase: Phase
  chatRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <motion.div
      key="mobile-iris"
      className="absolute inset-0 z-20 flex min-h-0 flex-col bg-card sm:hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
    >
      <IrisCoPilotHeader className="py-2" />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2.5 pt-1 pb-2.5">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full flex-col justify-end gap-2 py-1">
            {!userMsg && !aiMsg && !aiThinking ? (
              <p className="py-2 text-center text-[10px] leading-relaxed text-muted-foreground/80">
                Ask about the live signal — IRIS drafts the bracket on your
                ticket.
              </p>
            ) : null}
            <AnimatePresence>
              {userMsg ? (
                <motion.div
                  key="user"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-end gap-1"
                >
                  <UserAvatar />
                  <p className="max-w-[92%] rounded-xl rounded-tr-sm bg-foreground px-2.5 py-1.5 text-left text-[10px] leading-relaxed font-medium text-background">
                    {userMsg}
                  </p>
                </motion.div>
              ) : null}
              {aiThinking ? (
                <motion.div
                  key="think"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-start gap-1"
                >
                  <IrisAvatar />
                  <span className="inline-flex gap-1 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-[8px] leading-none text-muted-foreground">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse [animation-delay:120ms]">
                      ●
                    </span>
                    <span className="animate-pulse [animation-delay:240ms]">
                      ●
                    </span>
                  </span>
                </motion.div>
              ) : null}
              {aiMsg ? (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start gap-1"
                >
                  <IrisAvatar />
                  <div className="w-full min-w-0 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-left">
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {aiMsg}
                      {phase === "ai" ? (
                        <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground/70 align-middle" />
                      ) : null}
                    </p>
                    {planOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <dl className="mt-2 grid grid-cols-2 gap-1">
                          {rows.map((row) => (
                            <div
                              key={row.label}
                              className="rounded-md border border-border/50 bg-muted/20 px-1.5 py-1"
                            >
                              <dt className="text-[8px] tracking-wide text-muted-foreground uppercase">
                                {row.label}
                              </dt>
                              <dd className="font-mono text-[10px] leading-tight font-medium text-foreground tabular-nums">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-1.5 text-[8px] leading-none text-muted-foreground/80">
                          {AI_FOOTNOTE}
                        </p>
                      </motion.div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <IrisChatComposer
          draft={draft}
          phase={phase}
          composerRef={chatRef}
          active={phase === "typing"}
        />
      </div>
    </motion.div>
  )
}

function MobileHeroBook({
  positionOpen,
  side,
  markPrice,
  pnlDollars,
  pnlPct,
  pnlUp,
}: {
  positionOpen: boolean
  side: Side
  markPrice: string
  pnlDollars: string
  pnlPct: number
  pnlUp: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 px-3 py-1.5">
        {["Positions", "Open Orders", "Trade History"].map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "text-[10px] font-medium tracking-wide",
              i === 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overscroll-contain px-3 py-2">
        <div className="grid min-w-88 grid-cols-7 gap-2 text-[9px] tracking-wide text-muted-foreground uppercase">
          <span>Coin</span>
          <span>Size</span>
          <span>Entry</span>
          <span>Mark</span>
          <span>PnL</span>
          <span>Liq.</span>
          <span>Margin</span>
        </div>
        <AnimatePresence mode="wait">
          {positionOpen ? (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 grid min-w-88 grid-cols-7 gap-2 font-mono text-[10px]"
            >
              <span className="font-sans font-medium">ETH</span>
              <span>
                {POSITION_SIZE} {TRADES[side].label}
              </span>
              <span>{fmtPrice(ENTRY_PRICE)}</span>
              <span>{markPrice}</span>
              <span className="text-foreground">
                {pnlDollars}{" "}
                <span className="text-muted-foreground">
                  ({pnlUp ? "+" : ""}
                  {pnlPct.toFixed(1)}%)
                </span>
              </span>
              <span className="text-muted-foreground">
                {fmtPrice(
                  side === "long" ? ENTRY_PRICE * 0.91 : ENTRY_PRICE * 1.09
                )}
              </span>
              <span className="text-muted-foreground">Cross {LEVERAGE}×</span>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-[10px] text-muted-foreground"
            >
              No open positions
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * True while the desk is near the viewport and the tab is in the foreground.
 * Everything the demo animates is gated on this so a scrolled-past hero costs
 * nothing.
 */
function useIsAwake(ref: React.RefObject<HTMLElement | null>) {
  const [awake, setAwake] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    let onScreen = true
    let foreground = document.visibilityState === "visible"
    const apply = () => setAwake(onScreen && foreground)

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting
              apply()
            },
            { rootMargin: "150px 0px" }
          )
    io?.observe(el)

    const onVisibility = () => {
      foreground = document.visibilityState === "visible"
      apply()
    }
    document.addEventListener("visibilitychange", onVisibility)
    apply()

    return () => {
      io?.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [ref])

  return awake
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const id = window.setTimeout(() => resolve(), ms)
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true }
    )
  })
}

function centerIn(root: HTMLElement, el: HTMLElement | null): Point {
  if (!el) {
    const r = root.getBoundingClientRect()
    return { x: r.width * 0.5, y: r.height * 0.45 }
  }
  const a = root.getBoundingClientRect()
  const b = el.getBoundingClientRect()
  return {
    x: b.left - a.left + b.width / 2,
    y: b.top - a.top + b.height / 2,
  }
}

function DemoCursor({
  point,
  clicking,
  visible,
}: {
  point: Point
  clicking: boolean
  visible: boolean
}) {
  if (!visible) return null
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-0 z-30 hidden sm:block"
      animate={{
        x: point.x,
        y: point.y,
        scale: clicking ? 0.86 : 1,
      }}
      transition={{
        x: { type: "spring", stiffness: 120, damping: 22, mass: 0.7 },
        y: { type: "spring", stiffness: 120, damping: 22, mass: 0.7 },
        scale: { duration: 0.12 },
      }}
      style={{ marginLeft: -2, marginTop: -2 }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-sm"
        aria-hidden
      >
        <path
          d="M5.5 3.5L19 12.2L12.4 13.5L9.8 20.5L5.5 3.5Z"
          className="fill-foreground stroke-background"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
      <AnimatePresence>
        {clicking ? (
          <motion.span
            key="ripple"
            className="absolute top-0 left-0 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/50"
            initial={{ opacity: 0.7, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function ProfitToast({ show, side }: { show: boolean; side: Side }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="tp-toast"
          className="pointer-events-none absolute top-14 right-3 z-40 sm:right-5"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            <span className="relative flex size-7 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-[11px] font-semibold">
              ✓
              <motion.span
                className="absolute inset-0 rounded-full border border-foreground/35"
                initial={{ opacity: 0.8, scale: 0.7 }}
                animate={{ opacity: 0, scale: 1.55 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </span>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold tracking-tight">
                Take-profit hit
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                ETH {side} · +{TP_PCT.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** Tall Hyperliquid-shaped desk mock with auto demo loop. */
export function HeroDeskMock({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const isLarge = useIsLarge()
  const isMobilePhone = useIsMobilePhone()
  const awake = useIsAwake(rootRef)
  const signalRef = React.useRef<HTMLDivElement>(null)
  const chatRef = React.useRef<HTMLDivElement>(null)
  const mobileChatRef = React.useRef<HTMLDivElement>(null)
  const ticketRef = React.useRef<HTMLDivElement>(null)

  const [phaseState, setPhase] = React.useState<Phase>("watch")
  const [cursor, setCursor] = React.useState<Point>({ x: 280, y: 220 })
  const [cursorOnState, setCursorOn] = React.useState(false)
  const [clicking, setClicking] = React.useState(false)
  const [signalHotState, setSignalHot] = React.useState(false)
  const [draftState, setDraft] = React.useState("")
  const [userMsgState, setUserMsg] = React.useState<string | null>(null)
  const [aiMsgState, setAiMsg] = React.useState("")
  const [aiThinkingState, setAiThinking] = React.useState(false)
  const [planOpenState, setPlanOpen] = React.useState(false)
  const [positionOpenState, setPositionOpen] = React.useState(false)
  const [ticketArmedState, setTicketArmed] = React.useState(false)
  const [toastState, setToast] = React.useState(false)
  const [loop, setLoop] = React.useState(0)
  const [series, setSeries] = React.useState<Candle[]>(() => buildSeries(20260904))
  const [mobilePaneState, setMobilePane] = React.useState<MobileHeroPane>("chart")
  const [mobileChatOpenState, setMobileChatOpen] = React.useState(false)

  /** Alternates each loop so the desk shows both directions. */
  const side: Side = loop % 2 === 0 ? "long" : "short"
  /** How many ticket fields IRIS has filled so far (0–4). */
  const [filledState, setFilled] = React.useState(0)
  /** 0 = at entry, 1 = at take-profit. Wanders before it gets there. */
  const [progressState, setProgress] = React.useState(0)

  /**
   * Desktop plays on lg+; phones play their own tabbed story below sm.
   * Tablets keep the resolved end frame with no timers.
   */
  const playingDesktop = isLarge && reduceMotion === false
  const playingMobile = isMobilePhone && reduceMotion === false
  const runningDesktop = playingDesktop && awake
  const runningMobile = playingMobile && awake
  const running = runningDesktop || runningMobile

  const stillDesktop = !playingDesktop
  const stillMobile = !playingMobile
  const still = isMobilePhone ? stillMobile : stillDesktop
  const phase = still ? ("hold" as Phase) : phaseState
  const cursorOn = still ? false : cursorOnState
  const signalHot = still ? true : signalHotState
  const draft = still ? "" : draftState
  const userMsg = still ? userPrompt(side) : userMsgState
  const aiMsg = still ? AI_REPLY : aiMsgState
  const aiThinking = still ? false : aiThinkingState
  const planOpen = still ? true : planOpenState
  const filled = still ? 4 : filledState
  const positionOpen = still ? true : positionOpenState
  const ticketArmed = still ? true : ticketArmedState
  const toast = still ? false : toastState
  const progress = still ? 1 : progressState

  const mobilePane = stillMobile ? "chart" : mobilePaneState
  const mobileChatOpen = stillMobile ? false : mobileChatOpenState

  const levels = React.useMemo(() => tradeLevels(side), [side])
  const rows = React.useMemo(() => planRows(side), [side])

  // The tape is pulled toward the running mark so chart and position agree.
  const anchorRef = React.useRef(CANDLE_ANCHOR)

  // Live tape: nudge the in-progress bar, roll a new one every few ticks.
  React.useEffect(() => {
    if (!running) return
    const rand = mulberry32(981147)
    let tick = 0
    const id = window.setInterval(() => {
      tick += 1
      React.startTransition(() => {
        setSeries((prev) =>
          tickSeries(
            prev,
            tick,
            rand,
            anchorRef.current,
            anchorRef.current === CANDLE_ANCHOR ? 0.025 : 0.5
          )
        )
      })
    }, 700)
    return () => window.clearInterval(id)
  }, [running])

  const moveCursor = React.useEffectEvent(async (el: HTMLElement | null, signal: AbortSignal) => {
    const root = rootRef.current
    if (!root) return
    setCursorOn(true)
    setCursor(centerIn(root, el))
    await wait(780, signal)
  })

  const clickAt = React.useEffectEvent(async (signal: AbortSignal) => {
    setClicking(true)
    await wait(160, signal)
    setClicking(false)
    await wait(120, signal)
  })

  const typeText = React.useEffectEvent(
    async (
      full: string,
      setter: (v: string) => void,
      msPerChar: number,
      signal: AbortSignal
    ) => {
      setter("")
      for (let i = 1; i <= full.length; i++) {
        setter(full.slice(0, i))
        await wait(msPerChar, signal)
      }
    }
  )

  React.useEffect(() => {
    if (!runningDesktop) return

    const ac = new AbortController()
    const { signal } = ac

    async function runDesktop() {
      try {
        // reset
        setPhase("watch")
        setCursorOn(false)
        setClicking(false)
        setSignalHot(false)
        setDraft("")
        setUserMsg(null)
        setAiMsg("")
        setAiThinking(false)
        setPlanOpen(false)
        setFilled(0)
        setPositionOpen(false)
        setProgress(0)
        setTicketArmed(false)
        setToast(false)
        anchorRef.current = CANDLE_ANCHOR

        await wait(900, signal)
        setSignalHot(true)
        setPhase("watch")
        await wait(1100, signal)

        setPhase("toSignal")
        await moveCursor(signalRef.current, signal)
        setPhase("clickSignal")
        await clickAt(signal)
        setSignalHot(true)

        setPhase("toChat")
        await moveCursor(chatRef.current, signal)
        await clickAt(signal)

        setPhase("typing")
        const prompt = userPrompt(side)
        await typeText(prompt, setDraft, 28, signal)
        await wait(320, signal)
        setUserMsg(prompt)
        setDraft("")

        setPhase("ai")
        setAiThinking(true)
        await wait(520, signal)
        setAiThinking(false)
        await typeText(AI_REPLY, setAiMsg, 16, signal)
        setPlanOpen(true)
        await wait(600, signal)

        // IRIS pushes the plan into the order ticket, field by field.
        setPhase("toTicket")
        await moveCursor(ticketRef.current, signal)
        setPhase("filling")
        for (let i = 1; i <= 4; i++) {
          setFilled(i)
          await wait(260, signal)
        }
        setTicketArmed(true)
        await wait(420, signal)

        setPhase("clickTicket")
        await clickAt(signal)
        setPositionOpen(true)
        setCursorOn(false)

        // Price wanders both ways, then resolves onto the take-profit. It has
        // to stay clear of the stop — a breach there would mean a loss.
        setPhase("running")
        const steps = 46
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          const wobble = Math.sin(t * Math.PI * 3.1) * (1 - t) * 0.85
          const next = clamp(t + wobble, STOP_PROGRESS * 0.8, 1)
          setProgress(next)
          anchorRef.current = clamp(
            priceToY(markFromProgress(side, next)),
            CANDLE_TOP,
            CANDLE_BOTTOM
          )
          await wait(105, signal)
        }

        setPhase("settling")
        setProgress(1)
        anchorRef.current = clamp(
          priceToY(TRADES[side].tp),
          CANDLE_TOP,
          CANDLE_BOTTOM
        )
        await wait(420, signal)

        setPhase("toast")
        setToast(true)
        await wait(2400, signal)

        setPhase("hold")
        anchorRef.current = CANDLE_ANCHOR
        await wait(700, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void runDesktop()
    return () => ac.abort()
  }, [loop, runningDesktop, side])

  React.useEffect(() => {
    if (!runningMobile) return

    const ac = new AbortController()
    const { signal } = ac

    async function runMobile() {
      try {
        setMobilePane("chart")
        setMobileChatOpen(false)
        setPhase("watch")
        setSignalHot(false)
        setDraft("")
        setUserMsg(null)
        setAiMsg("")
        setAiThinking(false)
        setPlanOpen(false)
        setFilled(0)
        setPositionOpen(false)
        setProgress(0)
        setTicketArmed(false)
        setToast(false)
        anchorRef.current = CANDLE_ANCHOR

        await wait(MOBILE_DEMO_TIMING.chartWarm, signal)
        setSignalHot(true)
        await wait(MOBILE_DEMO_TIMING.chartSignal, signal)

        setMobilePane("trade")
        await wait(MOBILE_DEMO_TIMING.tradeTab, signal)

        setMobileChatOpen(true)
        await wait(MOBILE_DEMO_TIMING.chatOpen, signal)

        setPhase("typing")
        const prompt = userPrompt(side)
        await typeText(prompt, setDraft, MOBILE_DEMO_TIMING.typeMs, signal)
        await wait(MOBILE_DEMO_TIMING.afterType, signal)
        setUserMsg(prompt)
        setDraft("")
        await wait(MOBILE_DEMO_TIMING.afterSend, signal)

        setMobileChatOpen(false)
        setPhase("filling")
        await wait(MOBILE_DEMO_TIMING.fillStart, signal)
        for (let i = 1; i <= 4; i++) {
          setFilled(i)
          await wait(MOBILE_DEMO_TIMING.fillField, signal)
        }
        setTicketArmed(true)
        await wait(MOBILE_DEMO_TIMING.armed, signal)

        setPhase("clickTicket")
        setPositionOpen(true)
        await wait(MOBILE_DEMO_TIMING.afterOrder, signal)

        setMobilePane("chart")
        setPhase("running")
        for (let i = 1; i <= MOBILE_DEMO_TIMING.runSteps; i++) {
          const t = i / MOBILE_DEMO_TIMING.runSteps
          const wobble = Math.sin(t * Math.PI * 3.1) * (1 - t) * 0.85
          const next = clamp(t + wobble, STOP_PROGRESS * 0.8, 1)
          setProgress(next)
          anchorRef.current = clamp(
            priceToY(markFromProgress(side, next)),
            CANDLE_TOP,
            CANDLE_BOTTOM
          )
          await wait(MOBILE_DEMO_TIMING.runStepMs, signal)
        }

        setPhase("settling")
        setProgress(1)
        anchorRef.current = clamp(
          priceToY(TRADES[side].tp),
          CANDLE_TOP,
          CANDLE_BOTTOM
        )
        await wait(MOBILE_DEMO_TIMING.settle, signal)

        setMobilePane("book")
        await wait(MOBILE_DEMO_TIMING.book, signal)
        setMobilePane("chart")
        await wait(MOBILE_DEMO_TIMING.chartReturn, signal)

        setPhase("toast")
        setToast(true)
        await wait(MOBILE_DEMO_TIMING.toast, signal)

        setPhase("hold")
        anchorRef.current = CANDLE_ANCHOR
        await wait(MOBILE_DEMO_TIMING.hold, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void runMobile()
    return () => ac.abort()
  }, [loop, runningMobile, side])

  const lastBar = series[series.length - 1]

  // While the demo position runs the story drives the price; otherwise the
  // live tape does. Either way the badge and the dashed line share one value.
  const markValue = positionOpen
    ? markFromProgress(side, progress)
    : yToPrice(lastBar.c)
  const markY = clamp(priceToY(markValue), 10, 152)
  const markPrice = markValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const ticks = axisTicks(
    markY,
    levels.map((l) => l.y)
  )

  const pnlPct = positionOpen ? pnlPercent(side, markValue) : 0
  const pnlUp = pnlPct >= 0

  const barChangePct =
    ((yToPrice(lastBar.c) - yToPrice(lastBar.o)) / yToPrice(lastBar.o)) * 100

  // Stance conviction tracks how the live tape sits inside its recent range.
  const recent = series.slice(-14)
  const recentHigh = Math.min(...recent.map((c) => c.h))
  const recentLow = Math.max(...recent.map((c) => c.l))
  const rangePos =
    recentLow === recentHigh
      ? 0.5
      : (recentLow - lastBar.c) / (recentLow - recentHigh)
  const conviction = Math.round(clamp(52 + rangePos * 40, 48, 94))

  const pnlDollars = positionOpen
    ? `${pnlUp ? "+" : "−"}$${Math.abs(
        POSITION_SIZE * (markValue - ENTRY_PRICE) * (side === "long" ? 1 : -1)
      ).toFixed(2)}`
    : "—"

  return (
    <div
      ref={rootRef}
        className={cn(DESK_FRAME_CLASS, className)}
      aria-hidden
    >
      <DemoCursor
        point={cursor}
        clicking={clicking}
        visible={cursorOn && runningDesktop}
      />
      <ProfitToast show={toast} side={side} />

      {/* Chrome */}
      <div
        className={cn(
          DESK_CHROME_H,
          "flex min-w-0 items-center justify-between gap-2 border-b border-border/70 px-2.5 sm:px-4"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden gap-1 sm:flex">
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
          </span>
          <span className="truncate text-[11px] font-semibold tracking-tight">
            ETH-USD
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            Perp · Cross
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span className="relative hidden px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-foreground uppercase sm:inline-flex">
            Live
            <HandDrawnRing className="text-muted absolute inset-0 size-full scale-x-110" />
          </span>
          <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase sm:text-[10px]">
            Demo
          </span>
        </div>
      </div>

      {/* Ticker */}
      <div
        className={cn(
          DESK_TICKER_H,
          "flex min-w-0 items-center gap-2 overflow-hidden border-b border-border/60 px-2.5 sm:gap-x-5 sm:px-4"
        )}
      >
        <div className="flex min-w-0 shrink items-baseline gap-1.5 sm:gap-2">
          <span className="truncate font-mono text-[13px] font-semibold tracking-tight tabular-nums sm:text-base">
            {markPrice}
          </span>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
            {positionOpen
              ? `${pnlUp ? "+" : ""}${pnlPct.toFixed(1)}%`
              : `${barChangePct >= 0 ? "+" : ""}${barChangePct.toFixed(2)}%`}
          </span>
        </div>
        {(
          [
            ["Oracle", "3,412.41"],
            ["24h Vol", "$842M"],
            ["Open Int.", "$1.28B"],
            ["Funding", "0.0012%"],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="hidden items-baseline gap-1.5 lg:flex">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="font-mono text-[10px] text-foreground/90">
              {value}
            </span>
          </div>
        ))}
        <div
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-md border px-2 py-0.5 transition-colors",
            signalHot
              ? "border-foreground/40 bg-foreground text-background"
              : "border-border/60"
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              signalHot ? "text-background/70" : "text-muted-foreground"
            )}
          >
            Signal
          </span>
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            {side}
          </span>
        </div>
      </div>

      {/* Main — phone tabs; full rail from sm; book + ticket from lg */}
      <div
        className={cn(
          DESK_BODY_H,
          "flex min-h-0 flex-col sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[12.5rem_minmax(0,1fr)_13.5rem]",
          isMobilePhone && "relative"
        )}
      >
        {/* AI rail — tablets and up */}
        <aside className="order-3 hidden min-h-0 flex-col border-t border-border/70 sm:order-0 sm:flex sm:border-t-0 lg:border-r">
          <IrisCoPilotHeader />

          <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <IrisStanceCard side={side} conviction={conviction} />

            <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden">
              {/* No `layout` animations here: the chat re-renders many times
                  a second while the story types, and layout projection would
                  measure the whole rail on every one of them. */}
              <AnimatePresence>
                {userMsg ? (
                  <motion.div
                    key="user"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-end gap-1"
                  >
                    <UserAvatar />
                    <p className="max-w-[88%] rounded-xl rounded-tr-sm bg-foreground px-2.5 py-1.5 text-left text-[10px] leading-relaxed font-medium text-background">
                      {userMsg}
                    </p>
                  </motion.div>
                ) : null}
                {aiThinking ? (
                  <motion.div
                    key="think"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-start gap-1"
                  >
                    <IrisAvatar />
                    <span className="inline-flex gap-1 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-[8px] leading-none text-muted-foreground">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:120ms]">
                        ●
                      </span>
                      <span className="animate-pulse [animation-delay:240ms]">
                        ●
                      </span>
                    </span>
                  </motion.div>
                ) : null}
                {aiMsg ? (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-start gap-1"
                  >
                    <IrisAvatar />
                    <div className="w-full min-w-0 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-left">
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {aiMsg}
                        {phase === "ai" ? (
                          <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground/70 align-middle" />
                        ) : null}
                      </p>

                      {planOpen ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <dl className="mt-2 grid grid-cols-2 gap-1">
                            {rows.map((row) => (
                              <div
                                key={row.label}
                                className="rounded-md border border-border/50 bg-muted/20 px-1.5 py-1"
                              >
                                <dt className="text-[8px] tracking-wide text-muted-foreground uppercase">
                                  {row.label}
                                </dt>
                                <dd className="font-mono text-[10px] leading-tight font-medium text-foreground tabular-nums">
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <p className="mt-1.5 text-[8px] leading-none text-muted-foreground/80">
                            {AI_FOOTNOTE}
                          </p>
                        </motion.div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <IrisChatComposer
              draft={draft}
              phase={phase}
              composerRef={chatRef}
              active={phase === "typing" || phase === "toChat"}
              className="mt-auto"
            />
          </div>
        </aside>

        {isMobilePhone ? (
          <div className="relative order-1 min-h-0 flex-1 sm:hidden">
            <div
              className={cn(
                "absolute inset-0 flex flex-col",
                mobilePane !== "chart" && "hidden"
              )}
            >
              <div className="relative min-h-0 flex-1">
                <HeroChartPlot
                  series={series}
                  levels={levels}
                  signalHot={signalHot}
                  side={side}
                  signalRef={signalRef}
                  markY={markY}
                  markPrice={markPrice}
                  ticks={ticks}
                  lastBar={lastBar}
                  barChangePct={barChangePct}
                  compact
                />
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 flex min-h-0 flex-col overflow-hidden",
                mobilePane !== "trade" && "hidden"
              )}
            >
              <DeskTicketForm
                side={side}
                filled={filled}
                ticketArmed={ticketArmed}
                positionOpen={positionOpen}
                ticketRef={ticketRef}
                embedded
                mobile
              />
            </div>

            <div
              className={cn(
                "absolute inset-0 flex flex-col overflow-hidden",
                mobilePane !== "book" && "hidden"
              )}
            >
              <MobileHeroBook
                positionOpen={positionOpen}
                side={side}
                markPrice={markPrice}
                pnlDollars={pnlDollars}
                pnlPct={pnlPct}
                pnlUp={pnlUp}
              />
            </div>

            <AnimatePresence>
              {mobileChatOpen ? (
                <MobileIrisOverlay
                  draft={draft}
                  userMsg={userMsg}
                  aiMsg={aiMsg}
                  aiThinking={aiThinking}
                  planOpen={planOpen}
                  rows={rows}
                  phase={phase}
                  chatRef={mobileChatRef}
                />
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {isMobilePhone ? (
          <MobileHeroNav
            pane={mobilePane}
            hasPosition={positionOpen}
            chatOpen={mobileChatOpen}
            phase={phase}
            signalHot={signalHot}
            ticketArmed={ticketArmed}
          />
        ) : null}

        {!isMobilePhone ? (
          <div className="relative order-1 flex min-h-0 flex-1 flex-col sm:order-0 sm:flex-none lg:border-r lg:border-border/70">
            <div className="flex h-7 shrink-0 items-center gap-1.5 overflow-hidden border-b border-border/50 px-2 text-[9px] sm:gap-2">
              <span className="shrink-0 font-medium text-foreground">Chart</span>
              <span className="hidden text-muted-foreground/70 lg:inline">
                Funding
              </span>
              <span className="mx-0.5 hidden h-3 w-px bg-border sm:block" />
              <div className="flex min-w-0 items-center gap-px overflow-hidden">
                {["1m", "3m", "5m", "15m", "30m", "1h", "D"].map((tf) => (
                  <span
                    key={tf}
                    className={cn(
                      "shrink-0 px-1 py-0.5 font-mono leading-none",
                      tf === "15m"
                        ? "text-foreground"
                        : "text-muted-foreground/80",
                      tf !== "15m" && "hidden sm:inline"
                    )}
                  >
                    {tf}
                  </span>
                ))}
              </div>
              <span className="ml-auto hidden items-center gap-2 text-muted-foreground/80 lg:flex">
                <span>Candles</span>
                <span>Indicators</span>
              </span>
            </div>

            <div className="relative flex min-h-0 flex-1">
              <div className="hidden w-6 shrink-0 flex-col items-center gap-2.5 border-r border-border/40 py-2 text-[9px] text-muted-foreground/70 lg:flex">
                {DRAW_TOOLS.map((icon) => (
                  <span key={icon} className="leading-none">
                    {icon}
                  </span>
                ))}
              </div>

              <div className="relative min-w-0 flex-1">
                <HeroChartPlot
                  series={series}
                  levels={levels}
                  signalHot={signalHot}
                  side={side}
                  signalRef={signalRef}
                  markY={markY}
                  markPrice={markPrice}
                  ticks={ticks}
                  lastBar={lastBar}
                  barChangePct={barChangePct}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Book + ticket — desk-width only. */}
        <aside className="hidden min-h-0 flex-col overflow-hidden lg:flex">
          {isLarge ? (
            <>
              <div className="shrink-0 px-3 py-1.5">
                <div className="mb-1 flex items-center justify-between text-[9px] tracking-wide text-muted-foreground uppercase">
                  <span>Price</span>
                  <span>Size</span>
                </div>
                <div className="space-y-0.5">
                  {BOOK_ASKS.map((row) => (
                    <div
                      key={row.price}
                      className="relative flex items-center justify-between py-0.5 font-mono text-[10px]"
                    >
                      <span
                        className="absolute inset-y-0 right-0 bg-foreground/8"
                        style={{ width: `${row.w}%` }}
                      />
                      <span className="relative text-foreground/90">{row.price}</span>
                      <span className="relative text-muted-foreground">
                        {row.size}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="my-1 flex items-center justify-between border-y border-border/40 py-1">
                  <span className="font-mono text-[11px] font-semibold tabular-nums">
                    {markPrice}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Spread 0.20
                  </span>
                </div>
                <div className="space-y-0.5">
                  {BOOK_BIDS.map((row) => (
                    <div
                      key={row.price}
                      className="relative flex items-center justify-between py-0.5 font-mono text-[10px]"
                    >
                      <span
                        className="absolute inset-y-0 right-0 bg-foreground/8"
                        style={{ width: `${row.w}%` }}
                      />
                      <span className="relative text-foreground/90">{row.price}</span>
                      <span className="relative text-muted-foreground">
                        {row.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto shrink-0">
                <DeskTicketForm
                  side={side}
                  filled={filled}
                  ticketArmed={ticketArmed}
                  positionOpen={positionOpen}
                  ticketRef={ticketRef}
                />
              </div>
            </>
          ) : null}
        </aside>
      </div>

      {/* Positions — the row is wider than a phone, so it starts at sm */}
      <div
        className={cn(
          DESK_FOOTER_H,
          "hidden overflow-hidden border-t border-border/70 sm:block"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border/50 px-3 py-1.5 sm:px-4">
          {["Positions", "Open Orders", "Trade History"].map((tab, i) => (
            <span
              key={tab}
              className={cn(
                "text-[10px] font-medium tracking-wide",
                i === 0 ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto px-3 py-2 sm:px-4">
          <div className="grid min-w-xl grid-cols-7 gap-2 text-[9px] tracking-wide text-muted-foreground uppercase">
            <span>Coin</span>
            <span>Size</span>
            <span>Entry</span>
            <span>Mark</span>
            <span>PnL</span>
            <span>Liq.</span>
            <span>Margin</span>
          </div>
          <AnimatePresence mode="wait">
            {positionOpen ? (
              <motion.div
                key="pos"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 grid min-w-xl grid-cols-7 gap-2 font-mono text-[10px]"
              >
                <span className="font-sans font-medium">ETH</span>
                <span>
                  {POSITION_SIZE} {TRADES[side].label}
                </span>
                <span>{fmtPrice(ENTRY_PRICE)}</span>
                <span>{markPrice}</span>
                <span className="text-foreground">
                  {pnlDollars}{" "}
                  <span className="text-muted-foreground">
                    ({pnlUp ? "+" : ""}
                    {pnlPct.toFixed(1)}%)
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {fmtPrice(
                    side === "long"
                      ? ENTRY_PRICE * 0.91
                      : ENTRY_PRICE * 1.09
                  )}
                </span>
                <span className="text-muted-foreground">
                  Cross {LEVERAGE}×
                </span>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 text-[10px] text-muted-foreground"
              >
                No open positions
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
