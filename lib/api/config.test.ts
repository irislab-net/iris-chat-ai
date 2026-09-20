import { describe, expect, it } from "vitest"

import { isChatAppHost, loginWithGoogleUrl } from "@/lib/api/config"

describe("loginWithGoogleUrl", () => {
  it("hits the Google login host with destination and legal accept flags", () => {
    const url = new URL(
      loginWithGoogleUrl("https://intel.exur.ai/auth/success", {
        legalAccepted: true,
      })
    )

    expect(url.origin + url.pathname).toBe(
      "https://api.exur.ai/v1/auth/google/login"
    )
    expect(url.searchParams.get("destination")).toBe(
      "https://intel.exur.ai/auth/success"
    )
    expect(url.searchParams.get("terms")).toBe("accepted")
    expect(url.searchParams.get("privacy_notice")).toBe("accepted")
  })

  it("detects chat.exur.ai as the chat app host", () => {
    expect(isChatAppHost("chat.exur.ai")).toBe(true)
    expect(isChatAppHost("intel.exur.ai")).toBe(false)
  })

  it("uses app=chat for chat OAuth without destination", () => {
    const url = new URL(
      loginWithGoogleUrl(null, {
        app: "chat",
        legalAccepted: true,
      })
    )

    expect(url.searchParams.get("app")).toBe("chat")
    expect(url.searchParams.get("destination")).toBeNull()
    expect(url.searchParams.get("terms")).toBe("accepted")
    expect(url.searchParams.get("privacy_notice")).toBe("accepted")
  })
})
