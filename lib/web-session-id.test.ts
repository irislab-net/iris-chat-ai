import { describe, expect, it } from "vitest"

import {
  isValidWebSessionId,
  newWebSessionId,
  reboundWebSessionId,
  sha256Hex,
} from "@/lib/web-session-id"

const ANON_USER = "anon-test"
const ANON_PREFIX = "e42ca9bd7fad742a71ad1338c684f5a4"

describe("web session id", () => {
  it("hashes user id and salt with no separator", async () => {
    const digest = await sha256Hex(`${ANON_USER}exur-ai`)
    expect(digest.slice(0, 32)).toBe(ANON_PREFIX)
  })

  it("mints a 40-char lowercase hex id for that user", async () => {
    const sessionId = await newWebSessionId(ANON_USER)
    expect(sessionId).toHaveLength(40)
    expect(sessionId).toMatch(/^[0-9a-f]{40}$/)
    expect(sessionId.startsWith(ANON_PREFIX)).toBe(true)
    expect(await isValidWebSessionId(ANON_USER, sessionId)).toBe(true)
  })

  it("rejects the same id for a different user", async () => {
    const sessionId = await newWebSessionId(ANON_USER)
    expect(await isValidWebSessionId("someone-else", sessionId)).toBe(false)
  })

  it("rejects a UUID", async () => {
    expect(
      await isValidWebSessionId(
        ANON_USER,
        "11111111-1111-4111-8111-111111111111"
      )
    ).toBe(false)
  })

  it("rejects a correct prefix with an uppercase or non-hex suffix", async () => {
    expect(await isValidWebSessionId(ANON_USER, `${ANON_PREFIX}AB12CD34`)).toBe(
      false
    )
    expect(await isValidWebSessionId(ANON_USER, `${ANON_PREFIX}ab12cd3g`)).toBe(
      false
    )
  })

  it("rebinds the suffix onto the registered user prefix", async () => {
    const guestId = `${ANON_PREFIX}ab12cd34`
    const rebound = await reboundWebSessionId("user-42", guestId)
    expect(rebound).not.toBeNull()
    expect(rebound!.slice(32)).toBe("ab12cd34")
    expect(rebound!.slice(0, 32)).not.toBe(ANON_PREFIX)
    expect(await isValidWebSessionId("user-42", rebound!)).toBe(true)
    expect(await isValidWebSessionId(ANON_USER, rebound!)).toBe(false)
  })
})
