"use client"

import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { syncBrowserChromeTheme } from "@/lib/browser-chrome"

function isHorizonChromeTarget(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (node.hasAttribute("data-gemini-phase")) return true

  const className = node.getAttribute("class") ?? ""
  return (
    className.includes("chat-gemini-bg") ||
    className.includes("chat-gemini-horizon")
  )
}

function BrowserChromeSync() {
  const { theme, resolvedTheme, systemTheme } = useTheme()

  const sync = React.useCallback(() => {
    syncBrowserChromeTheme(resolvedTheme)
  }, [resolvedTheme])

  React.useLayoutEffect(() => {
    sync()
  }, [sync])

  // Re-assert after paint so late theme scripts cannot leave a stale white bar.
  React.useEffect(() => {
    sync()
    const raf = window.requestAnimationFrame(sync)
    const t = window.setTimeout(sync, 120)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [sync])

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

  React.useEffect(() => {
    if (typeof document === "undefined") return

    let timer = 0
    const schedule = () => {
      if (timer) return
      timer = window.setTimeout(() => {
        timer = 0
        sync()
      }, 80)
    }

    const root = document.documentElement
    const rootObserver = new MutationObserver(schedule)
    rootObserver.observe(root, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-overlay-open",
        "data-app-shell",
        "data-keyboard-open",
      ],
    })

    const treeObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          if (record.attributeName === "data-gemini-phase") {
            schedule()
            return
          }
          if (
            record.attributeName === "class" &&
            isHorizonChromeTarget(record.target)
          ) {
            schedule()
            return
          }
        }

        if (record.type === "childList") {
          const nodes = [...record.addedNodes, ...record.removedNodes]
          if (
            nodes.some(
              (node) =>
                isHorizonChromeTarget(node) ||
                (node instanceof HTMLElement &&
                  (node.querySelector("[data-gemini-phase]") ||
                    node.querySelector(".chat-gemini-horizon-dome")))
            )
          ) {
            schedule()
            return
          }
        }
      }
    })

    treeObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-gemini-phase", "class"],
    })

    window.addEventListener("pageshow", schedule)
    window.visualViewport?.addEventListener("resize", schedule)

    return () => {
      window.clearTimeout(timer)
      rootObserver.disconnect()
      treeObserver.disconnect()
      window.removeEventListener("pageshow", schedule)
      window.visualViewport?.removeEventListener("resize", schedule)
    }
  }, [sync])

  // Tint strips are owned imperatively by `applySafariEdgeTintStrips` —
  // do not portal onto <html> (React root teardown crashes).
  return null
}

export { BrowserChromeSync }
