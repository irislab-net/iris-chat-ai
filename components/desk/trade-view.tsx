"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { DeskPageFrame } from "@/components/desk/desk-page-frame"
import { TradeSkeleton } from "@/components/desk/desk-skeletons"
import { PositionList } from "@/components/desk/position-list"
import { TradeSummaryCard } from "@/components/desk/trade-summary-card"
import { useMockPositions, useMockWallet } from "@/lib/desk-mock/hooks"

function TradeView() {
  const t = useTranslations("deskTrade")
  const { open, closed, loading: positionsLoading } = useMockPositions()
  const { balances, loading: walletLoading } = useMockWallet()

  if (positionsLoading || walletLoading) {
    return <TradeSkeleton />
  }

  return (
    <DeskPageFrame
      pageId="trade"
      title={t("title")}
      className="gap-5 sm:gap-6"
    >
      <TradeSummaryCard balances={balances} />
      <PositionList active={open} history={closed} />
    </DeskPageFrame>
  )
}

export { TradeView }
