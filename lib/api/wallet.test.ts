import { describe, expect, it } from "vitest"

import {
  currencyFromRoute,
  mapLedgerStatus,
  mapMeBalance,
  mapMeLedgerRow,
  networkFromRoute,
  totalBalanceUsd,
} from "@/lib/api/wallet"

describe("wallet mapping", () => {
  it("maps balance strings and client-side total", () => {
    const balance = {
      available: "10.500000",
      locked: "2.250000",
      withdrawHold: "1.000000",
    }
    expect(totalBalanceUsd(balance)).toBe(13.75)
    expect(
      mapMeBalance(balance, {
        today: { realized: "1.5", fees: "0.1", net: "1.4" },
        last_30_days: { realized: "9.0", fees: "0.5", net: "8.5" },
      })
    ).toEqual({
      availableUsd: 10.5,
      lockedUsd: 2.25,
      withdrawHoldUsd: 1,
      todayPnlUsd: 1.4,
      realizedPnlUsd: 8.5,
    })
  })

  it("uses zero pnl when market pnl is missing", () => {
    expect(
      mapMeBalance({
        available: "0.000000",
        locked: "0.000000",
        withdrawHold: "0.000000",
      })
    ).toEqual({
      availableUsd: 0,
      lockedUsd: 0,
      withdrawHoldUsd: 0,
      todayPnlUsd: 0,
      realizedPnlUsd: 0,
    })
  })

  it("maps ledger statuses and routes", () => {
    expect(mapLedgerStatus("observed")).toBe("pending")
    expect(mapLedgerStatus("pending_review")).toBe("pending")
    expect(mapLedgerStatus("confirming")).toBe("confirming")
    expect(mapLedgerStatus("credited")).toBe("credited")
    expect(mapLedgerStatus("approved")).toBe("settled")
    expect(currencyFromRoute("usdt_trc20")).toBe("USDT")
    expect(currencyFromRoute("usdc_bep20")).toBe("USDC")
    expect(networkFromRoute("usdt_trc20")).toBe("TRC20")
    expect(networkFromRoute("usdc_bep20")).toBe("BEP20")
    expect(
      mapMeLedgerRow(
        {
          id: "d1",
          status: "observed",
          route: "usdt_bep20",
          amount: "11.000000",
          createdAt: "2026-10-29T10:00:00Z",
        },
        "deposit"
      )
    ).toMatchObject({
      id: "d1",
      kind: "deposit",
      amountUsd: 11,
      currency: "USDT",
      network: "BEP20",
      status: "pending",
    })
  })
})
