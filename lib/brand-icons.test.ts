import { describe, expect, it } from "vitest"

import { BRAND_ICON_VERSION, brandIconUrl } from "@/lib/brand-icons"

describe("brandIconUrl", () => {
  it("appends the Exur cache-bust version", () => {
    expect(brandIconUrl("/favicon-48.png")).toBe(
      `/favicon-48.png?v=${BRAND_ICON_VERSION}`
    )
    expect(BRAND_ICON_VERSION).toMatch(/^exur-/)
  })

  it("keeps an existing query string", () => {
    expect(brandIconUrl("/favicon.ico?x=1")).toBe(
      `/favicon.ico?x=1&v=${BRAND_ICON_VERSION}`
    )
  })
})
