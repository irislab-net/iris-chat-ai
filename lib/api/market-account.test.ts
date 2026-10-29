import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/client", () => ({
  apiJson: vi.fn(),
}))

import { apiJson } from "@/lib/api/client"
import {
  buildMarkPriceLookup,
  enrichOpenPositionsWithMarks,
  fetchDeskPositions,
} from "@/lib/api/market-account"
import type { DeskPosition } from "@/lib/desk-mock/types"

describe("market account positions", () => {
  it("maps open positions and closed trades", async () => {
    vi.mocked(apiJson)
      .mockResolvedValueOnce([
        {
          id: "p1",
          instrument: "BTC",
          side: "long",
          margin: "25.000000",
          size: "0.01",
          entry_price: "100000",
          opened_at: "2026-10-29T10:00:00Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          kind: "position",
          id: "c1",
          instrument: "ETH",
          side: "short",
          margin: "10.000000",
          size: "0.5",
          entry_price: "3000",
          exit_price: "2900",
          realized_pnl: "50.000000",
          fee: "1.000000",
          opened_at: "2026-10-01T10:00:00Z",
          closed_at: "2026-10-28T10:00:00Z",
        },
        {
          kind: "working",
          order_id: "o1",
          instrument: "BTC",
          side: "long",
        },
      ])

    const result = await fetchDeskPositions()
    expect(result.open).toHaveLength(1)
    expect(result.open[0]).toMatchObject({
      id: "p1",
      instrument: "BTC",
      side: "long",
      status: "open",
      entryPrice: 100000,
      marginUsd: 25,
      leverage: 40,
      liquidationPrice: null,
    })
    expect(result.closed).toHaveLength(1)
    expect(result.closed[0]).toMatchObject({
      id: "c1",
      side: "short",
      status: "closed",
      realizedPnlUsd: 50,
      feeUsd: 1,
      markPrice: 2900,
      leverage: 150,
    })
  })

  it("enriches open PAXG rows with XAU/PAXG mids", () => {
    const open: DeskPosition[] = [
      {
        id: "paxg-1",
        instrument: "PAXG",
        side: "long",
        status: "open",
        size: 0.0024849,
        entryPrice: 4024.70243,
        markPrice: 4024.70243,
        marginUsd: 10,
        leverage: 1,
        unrealizedPnlUsd: 0,
        realizedPnlUsd: 0,
        feeUsd: 0,
        takeProfit: null,
        stopLoss: null,
        liquidationPrice: null,
        openedAt: "2026-10-29T19:51:18.040221Z",
        closedAt: null,
      },
    ]

    const marks = buildMarkPriceLookup({
      prices: { XAU: 4024.35 },
      markets: [
        {
          instrument: "XAU",
          hlCoin: "PAXG",
          price: 4024.35,
        },
      ],
    })

    const enriched = enrichOpenPositionsWithMarks(open, marks)
    expect(enriched[0]?.markPrice).toBe(4024.35)
    expect(enriched[0]?.unrealizedPnlUsd).toBeCloseTo(
      (4024.35 - 4024.70243) * 0.0024849,
      8
    )
  })
})
