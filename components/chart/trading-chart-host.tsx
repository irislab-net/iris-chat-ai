"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import {
  detectTradingViewLibrary,
  isTradingViewLibraryBundled,
} from "@/lib/chart/detect-library"
import type { TradingChartProps } from "@/lib/chart/types"
import { ChartPaneSkeleton } from "@/components/paper-trading/desk-skeleton"
import { PaperTradingChart } from "@/components/paper-trading/trading-chart"
import { cn } from "@/lib/utils"

const TradingViewChartWidget = dynamic(
  () =>
    import("@/components/chart/tradingview-widget").then(
      (mod) => mod.TradingViewChartWidget
    ),
  { ssr: false }
)

type EngineState = "checking" | "tradingview" | "fallback"

/**
 * Chart host — prefers TradingView Advanced Charts when the licensed bundle
 * is present under /public/charting_library/, otherwise Lightweight Charts.
 */
function TradingChartHost(props: TradingChartProps) {
  const [engine, setEngine] = React.useState<EngineState>(() =>
    isTradingViewLibraryBundled() ? "checking" : "fallback"
  )

  React.useEffect(() => {
    if (!isTradingViewLibraryBundled()) return

    let active = true
    void detectTradingViewLibrary().then((available) => {
      if (active) setEngine(available ? "tradingview" : "fallback")
    })
    return () => {
      active = false
    }
  }, [])

  if (engine === "checking") {
    return <ChartPaneSkeleton className={cn("h-full w-full", props.className)} />
  }

  if (engine === "tradingview") {
    return <TradingViewChartWidget {...props} />
  }

  return <PaperTradingChart {...props} />
}

export { TradingChartHost }
