import { describe, expect, it } from "vitest"

import {
  browserChromeColor,
  BROWSER_CHROME_COLORS,
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
})
