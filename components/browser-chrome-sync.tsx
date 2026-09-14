"use client"

import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  observeBrowserChromeTheme,
  syncBrowserChromeTheme,
} from "@/lib/browser-chrome"

function BrowserChromeSync() {
  const { resolvedTheme } = useTheme()

  React.useLayoutEffect(() => {
    syncBrowserChromeTheme(resolvedTheme)
  }, [resolvedTheme])

  React.useEffect(() => observeBrowserChromeTheme(), [])

  return null
}

export { BrowserChromeSync }
