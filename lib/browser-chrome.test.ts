import { describe, expect, it } from "vitest"

import {
  browserChromeColor,
  browserChromeEdgesForState,
  BROWSER_CHROME_COLORS,
  HORIZON_CHROME_COLORS,
  prefersToolbarThemeColor,
  resolveBrowserChromeTheme,
} from "@/lib/browser-chrome"

describe("browser chrome colors", () => {
  it("maps resolved theme to surface hex", () => {
    expect(resolveBrowserChromeTheme("light")).toBe("light")
    expect(resolveBrowserChromeTheme("dark")).toBe("dark")
    expect(resolveBrowserChromeTheme(undefined)).toBe("dark")
    expect(browserChromeColor("light")).toBe(BROWSER_CHROME_COLORS.light)
    expect(browserChromeColor("dark")).toBe(BROWSER_CHROME_COLORS.dark)
  })

  it("splits top/bottom edges when the horizon wash is visible", () => {
    expect(
      browserChromeEdgesForState({ theme: "light", horizonVisible: false })
    ).toEqual({
      top: BROWSER_CHROME_COLORS.light,
      bottom: BROWSER_CHROME_COLORS.light,
    })
    expect(
      browserChromeEdgesForState({ theme: "light", horizonVisible: true })
    ).toEqual(HORIZON_CHROME_COLORS.light)
    expect(
      browserChromeEdgesForState({ theme: "dark", horizonVisible: true })
    ).toEqual(HORIZON_CHROME_COLORS.dark)
  })

  it("uses theme-color for the iOS toolbar, not Android Chrome", () => {
    expect(
      prefersToolbarThemeColor(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"
      )
    ).toBe(true)
    expect(
      prefersToolbarThemeColor(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0.0.0"
      )
    ).toBe(false)
    expect(prefersToolbarThemeColor("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5, "MacIntel")).toBe(true)
  })
})
