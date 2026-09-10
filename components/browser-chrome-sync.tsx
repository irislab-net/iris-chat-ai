"use client"

import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { syncBrowserChromeTheme } from "@/lib/browser-chrome"

function BrowserChromeSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    syncBrowserChromeTheme(resolvedTheme)
  }, [resolvedTheme])

  return null
}

export { BrowserChromeSync }
