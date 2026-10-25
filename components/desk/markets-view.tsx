"use client"

import * as React from "react"

import { DeskPageFrame } from "@/components/desk/desk-page-frame"
import { MarketsSkeleton } from "@/components/desk/desk-skeletons"
import { MarketPriceCards } from "@/components/desk/market-price-cards"
import { useMockMarkets } from "@/lib/desk-mock/hooks"

function MarketsView() {
  const { markets, loading } = useMockMarkets()

  if (loading) {
    return <MarketsSkeleton />
  }

  return (
    <DeskPageFrame className="flex h-full min-h-0 flex-1 flex-col gap-0 py-3 pt-5 max-lg:pb-0 sm:py-4 sm:pt-6">
      <MarketPriceCards markets={markets} />
    </DeskPageFrame>
  )
}

export { MarketsView }
