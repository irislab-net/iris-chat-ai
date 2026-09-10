"use client"

import * as React from "react"

import { StanceAlertsPermissionDialog } from "@/components/dashboard/stance-alerts-permission-dialog"
import {
  classifyMarketStance,
  type MarketStateKind,
} from "@/lib/market-state-action"
import {
  isDirectionalStance,
  notifyMarketStanceChange,
  playMarketStanceChime,
  unlockMarketStanceAudio,
} from "@/lib/market-stance-chime"

/**
 * Plays a soft chime (+ OS notification if tab is hidden) when stance
 * flips to LONG or SHORT. Skips the first mount so refresh isn't noisy.
 */
function MarketStanceChime({
  stance,
  symbol,
}: {
  stance: string
  symbol?: string
}) {
  const prevKindRef = React.useRef<MarketStateKind | null>(null)
  const readyRef = React.useRef(false)

  React.useEffect(() => {
    const unlock = () => unlockMarketStanceAudio()
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  React.useEffect(() => {
    const kind = classifyMarketStance(stance)

    if (!readyRef.current) {
      // Prime previous kind without sounding on first paint / SSR hydrate.
      prevKindRef.current = kind
      readyRef.current = true
      return
    }

    const prev = prevKindRef.current
    prevKindRef.current = kind

    if (!isDirectionalStance(kind) || prev === kind) return

    void playMarketStanceChime(kind)

    if (document.visibilityState === "hidden") {
      void notifyMarketStanceChange({ kind, symbol })
    }
  }, [stance, symbol])

  return <StanceAlertsPermissionDialog />
}

export { MarketStanceChime }
