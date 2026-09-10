"use client"

import * as React from "react"

import {
  type ClosedTrade,
  type Position,
  type PositionSide,
} from "@/lib/trading/types"
import { cn } from "@/lib/utils"

type BookListPulseTone = "long" | "short" | "profit" | "loss" | "neutral"

type BookListPulseEntry = {
  tone: BookListPulseTone
  source: "position" | "history"
}

type BookListPulseSignal = BookListPulseEntry & {
  id: string
  at: number
}

function positionPulseTone(side: PositionSide): BookListPulseTone {
  return side === "LONG" ? "long" : "short"
}

function historyPulseTone(reason: ClosedTrade["reason"]): BookListPulseTone {
  switch (reason) {
    case "TAKE_PROFIT":
      return "profit"
    case "STOP_LOSS":
    case "LIQUIDATION":
      return "loss"
    case "MANUAL":
    case "AMBIGUOUS":
    default:
      return "neutral"
  }
}

function useBookListPulse(
  positions: Position[],
  history: ClosedTrade[]
): {
  active: Record<string, BookListPulseEntry>
  lastSignal: BookListPulseSignal | null
  dismissPulse: (id: string) => void
} {
  const seenPositionsRef = React.useRef<Set<string>>(new Set())
  const seenHistoryRef = React.useRef<Set<string>>(new Set())
  const primedRef = React.useRef(false)
  const [active, setActive] = React.useState<Record<string, BookListPulseEntry>>(
    {}
  )
  const [lastSignal, setLastSignal] = React.useState<BookListPulseSignal | null>(
    null
  )

  const dismissPulse = React.useCallback((id: string) => {
    setActive((current) => {
      if (!(id in current)) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const registerPulse = React.useCallback((id: string, entry: BookListPulseEntry) => {
    setActive((current) => ({ ...current, [id]: entry }))
    setLastSignal({ id, ...entry, at: Date.now() })
  }, [])

  React.useEffect(() => {
    if (!primedRef.current) {
      for (const position of positions) seenPositionsRef.current.add(position.id)
      for (const trade of history) seenHistoryRef.current.add(trade.id)
      primedRef.current = true
      return
    }

    for (const position of positions) {
      if (seenPositionsRef.current.has(position.id)) continue
      seenPositionsRef.current.add(position.id)
      registerPulse(position.id, {
        tone: positionPulseTone(position.side),
        source: "position",
      })
    }

    for (const trade of history) {
      if (seenHistoryRef.current.has(trade.id)) continue
      seenHistoryRef.current.add(trade.id)
      registerPulse(trade.id, {
        tone: historyPulseTone(trade.reason),
        source: "history",
      })
    }
  }, [history, positions, registerPulse])

  return { active, lastSignal, dismissPulse }
}

function bookListPulseClass(
  pulse: BookListPulseEntry | undefined,
  variant: "row" | "card"
) {
  if (!pulse) return null

  return cn(
    "book-list-pulse",
    variant === "row" ? "book-list-pulse-row" : "book-list-pulse-card",
    "book-list-pulse--active",
    pulse.tone === "long" && "book-list-pulse--long",
    pulse.tone === "short" && "book-list-pulse--short",
    pulse.tone === "profit" && "book-list-pulse--profit",
    pulse.tone === "loss" && "book-list-pulse--loss",
    pulse.tone === "neutral" && "book-list-pulse--neutral"
  )
}

function bookListPulseDismissHandlers(
  id: string,
  pulse: BookListPulseEntry | undefined,
  dismissPulse: (id: string) => void
): {
  onPointerEnter?: () => void
  onFocus?: () => void
} {
  if (!pulse) return {}

  return {
    onPointerEnter: () => dismissPulse(id),
    onFocus: () => dismissPulse(id),
  }
}

export {
  bookListPulseClass,
  bookListPulseDismissHandlers,
  useBookListPulse,
  type BookListPulseEntry,
  type BookListPulseSignal,
  type BookListPulseTone,
}
