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
    <DeskPageFrame className="pt-8 sm:pt-12">
      <MarketPriceCards markets={markets} />
    </DeskPageFrame>
  )
}

export { MarketsView }
