import { describe, expect, it } from "vitest"

import {
  browserChromeColor,
  BROWSER_CHROME_COLORS,
  BROWSER_CHROME_INIT_SCRIPT,
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

  it("marks Android and iOS UA hooks for mobile sheet blur workarounds", () => {
    expect(BROWSER_CHROME_INIT_SCRIPT).toContain("ua-android")
    expect(BROWSER_CHROME_INIT_SCRIPT).toContain("ua-ios")
    expect(BROWSER_CHROME_INIT_SCRIPT).toMatch(/Android/i)
    expect(BROWSER_CHROME_INIT_SCRIPT).toMatch(/iPhone\|iPad\|iPod/)
  })
})
