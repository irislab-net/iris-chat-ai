import { describe, expect, it } from "vitest"

import {
  buildPushTokenPayload,
  FIREBASE_WEB_CONFIG,
  pushSessionId,
  pushSyncPair,
  pushTargetPath,
  shouldShowPushPrompt,
} from "@/lib/web-push"

describe("web push contract (parity with exur-mobile-app)", () => {
  it("registers with the same payload shape as Android/iOS", () => {
    expect(buildPushTokenPayload("fcm-token")).toEqual({
      token: "fcm-token",
      platform: "web",
      provider: "fcm",
      app_id: FIREBASE_WEB_CONFIG.appId,
    })
  })

  it("dedupes sync attempts on the bearer|token pair", () => {
    expect(pushSyncPair("jwt", "tok")).toBe("jwt|tok")
  })

  it("deep-links a tapped push to its chat session", () => {
    expect(pushTargetPath({ session_id: "s 1" })).toBe("/?session_id=s%201")
    expect(pushTargetPath({ sessionId: "s2" })).toBe("/?session_id=s2")
    expect(pushSessionId({ session_id: "s1" })).toBe("s1")
  })

  it("shows the soft prompt only when the native prompt can be asked", () => {
    const base = { configured: true, supported: true, now: 100_000_000 }
    expect(shouldShowPushPrompt({ ...base, permission: "default" })).toBe(true)
    expect(shouldShowPushPrompt({ ...base, permission: "granted" })).toBe(false)
    expect(shouldShowPushPrompt({ ...base, permission: "denied" })).toBe(false)
    expect(
      shouldShowPushPrompt({ ...base, permission: "default", configured: false })
    ).toBe(false)
    expect(
      shouldShowPushPrompt({
        ...base,
        permission: "default",
        dismissedAt: 100_000_000 - 1_000,
      })
    ).toBe(false)
    expect(
      shouldShowPushPrompt({
        ...base,
        permission: "default",
        now: 700_000_000,
        dismissedAt: 0,
      })
    ).toBe(true)
  })

  it("honours an explicit in-app url and falls back to home", () => {
    expect(pushTargetPath({ url: "/billing" })).toBe("/billing")
    expect(pushTargetPath({ url: "https://evil.example" })).toBe("/")
    expect(pushTargetPath(undefined)).toBe("/")
    expect(pushTargetPath({})).toBe("/")
  })
})
