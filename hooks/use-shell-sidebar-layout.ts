"use client"

import * as React from "react"

import {
  shellSidebarLayoutForWidth,
  type ShellSidebarLayout,
} from "@/lib/shell-sidebar-layout"

/**
 * Sidebar defaults for the app shell resizable columns.
 * Returns `null` until mounted so SSR does not assume a wide desktop.
 */
function useShellSidebarLayout(): ShellSidebarLayout | null {
  const [layout, setLayout] = React.useState<ShellSidebarLayout | null>(null)

  React.useEffect(() => {
    const update = () => {
      setLayout(shellSidebarLayoutForWidth(window.innerWidth))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return layout
}

export { useShellSidebarLayout }
