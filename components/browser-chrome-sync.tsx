"use client"

import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { syncBrowserChromeTheme } from "@/lib/browser-chrome"

function BrowserChromeSync() {
  const { theme, resolvedTheme, systemTheme } = useTheme()

  React.useLayoutEffect(() => {
    syncBrowserChromeTheme(resolvedTheme)
  }, [resolvedTheme])

  // When preference is "system", re-sync phone chrome if OS theme flips
  // (resolvedTheme usually updates too; this covers the race).
  React.useEffect(() => {
    if (theme !== "system" && theme !== undefined) return
    if (typeof window === "undefined" || !window.matchMedia) return

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      syncBrowserChromeTheme(mq.matches ? "dark" : "light")
    }

    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme, systemTheme])

  return null
}

export { BrowserChromeSync }
