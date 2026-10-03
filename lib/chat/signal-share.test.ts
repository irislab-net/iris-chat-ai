import { describe, expect, it } from "vitest"

import {
  buildNoTradeShareText,
  buildSignalShareText,
  noTradeShareFileName,
  SIGNAL_SHARE_SITE,
  signalShareFileName,
} from "@/lib/chat/signal-share"
import { formatSignalShareDate } from "@/lib/chat/signal-share-capture"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"
import { formatTradePrice } from "@/lib/chat/trade-signal"

const ticket: PaperTradeTicket = {
  symbol: "BTC",
  side: "LONG",
  quantity: 1,
  markPrice: 100_000,
  stopLoss: 98_000,
  takeProfit: 105_000,
  leverage: 5,
  setup: "Breakout",
  thesis: "Momentum",
}

describe("signal share helpers", () => {
  it("builds a plain-text share body ending with exur.ai", () => {
    expect(
      buildSignalShareText(ticket, {
        entry: "Entry",
        stopLoss: "Stop Loss",
        target: "Target",
      })
    ).toBe(
      [
        "BTC LONG",
        `Entry: ${formatTradePrice(ticket.markPrice)}`,
        `Stop Loss: ${formatTradePrice(ticket.stopLoss)}`,
        `Target: ${formatTradePrice(ticket.takeProfit)}`,
        SIGNAL_SHARE_SITE,
      ].join("\n")
    )
  })

  it("includes an optional date line before the site", () => {
    expect(
      buildSignalShareText(
        ticket,
        {
          entry: "Entry",
          stopLoss: "Stop Loss",
          target: "Target",
        },
        { date: "3 Oct 2026" }
      )
    ).toBe(
      [
        "BTC LONG",
        `Entry: ${formatTradePrice(ticket.markPrice)}`,
        `Stop Loss: ${formatTradePrice(ticket.stopLoss)}`,
        `Target: ${formatTradePrice(ticket.takeProfit)}`,
        "3 Oct 2026",
        SIGNAL_SHARE_SITE,
      ].join("\n")
    )
  })

  it("names the share file from symbol and side", () => {
    expect(signalShareFileName(ticket)).toBe("btc-long-signal.png")
  })

  it("builds a no-trade share body ending with exur.ai", () => {
    expect(
      buildNoTradeShareText("Compressed range — wait.", {
        title: "No trade",
        badge: "Wait",
        capitalProtected: "Capital Protected",
        reasonHeading: "Risk Analysis",
      })
    ).toBe(
      [
        "No trade",
        "Wait · Capital Protected",
        "Risk Analysis:",
        "Compressed range — wait.",
        SIGNAL_SHARE_SITE,
      ].join("\n")
    )
  })

  it("includes an optional date line in no-trade share text", () => {
    expect(
      buildNoTradeShareText(
        "Compressed range — wait.",
        {
          title: "No trade",
          badge: "Wait",
          capitalProtected: "Capital Protected",
          reasonHeading: "Risk Analysis",
        },
        { date: "3 Oct 2026" }
      )
    ).toBe(
      [
        "No trade",
        "Wait · Capital Protected",
        "Risk Analysis:",
        "Compressed range — wait.",
        "3 Oct 2026",
        SIGNAL_SHARE_SITE,
      ].join("\n")
    )
  })

  it("names the no-trade share file", () => {
    expect(noTradeShareFileName()).toBe("exur-no-trade.png")
  })

  it("formats a short share date", () => {
    expect(formatSignalShareDate("en", new Date("2026-10-03T12:00:00Z"))).toMatch(
      /Oct.*2026/
    )
  })
})
