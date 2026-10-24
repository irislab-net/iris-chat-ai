"use client"

import * as React from "react"

import { DeskPageFrame } from "@/components/desk/desk-page-frame"
import { TradeSkeleton } from "@/components/desk/desk-skeletons"
import { PositionList } from "@/components/desk/position-list"
import { useMockPositions } from "@/lib/desk-mock/hooks"

function TradeView() {
  const { open, closed, loading } = useMockPositions()

  if (loading) {
    return <TradeSkeleton />
  }

  return (
    <DeskPageFrame>
      <PositionList active={open} history={closed} />
    </DeskPageFrame>
  )
}

export { TradeView }
