import { describe, expect, it } from "vitest"

import { stripUnrequestedIrisSetupFromReply } from "@/lib/chat/strip-paper-setup"

describe("stripUnrequestedIrisSetupFromReply", () => {
  it("removes an appended IRIS setup block from a co-pilot reply", () => {
    const reply = `Here are the top important news items for BTC today:

1. Bitcoin holds above $77k.

Exur setup. Not a profit guarantee. No paper trade is open yet.

BTC LONG
Setup: Model long continuation`

    expect(stripUnrequestedIrisSetupFromReply(reply)).toBe(
      `Here are the top important news items for BTC today:

1. Bitcoin holds above $77k.`
    )
  })

  it("returns setup-only replies unchanged when no marker is present", () => {
    const reply = "Maybe long ETH later."
    expect(stripUnrequestedIrisSetupFromReply(reply)).toBe(reply)
  })
})
