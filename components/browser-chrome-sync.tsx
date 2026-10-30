"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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

/**
 * Safari 26+ ignores `theme-color` and tints toolbars from `html`/`body` or a
 * qualifying `position: fixed` strip at the edge. Pseudo-elements are skipped.
 * These real tint nodes keep the Safari chin/forehead matched to each page.
 */
function BrowserChromeTintBars() {
  return (
    <>
      <div
        aria-hidden
        data-slot="browser-chrome-top-tint"
        className="pointer-events-none fixed inset-x-0 top-0 z-[29]"
        style={{
          height: "max(12px, var(--app-safe-top, env(safe-area-inset-top, 0px)))",
          backgroundColor:
            "var(--browser-chrome-top, var(--browser-chrome-color, var(--background)))",
        }}
      />
      <div
        aria-hidden
        data-slot="browser-chrome-bottom-tint"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[29]"
        style={{
          height:
            "max(12px, var(--app-safe-bottom, env(safe-area-inset-bottom, 0px)))",
          backgroundColor:
            "var(--browser-chrome-bottom, var(--browser-chrome-color, var(--background)))",
        }}
      />
    </>
  )
}

function BrowserChromeSync() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  // Root ThemeProvider sits outside next-intl — use Next's pathname, not i18n's.
  const pathname = usePathname()

  const sync = React.useCallback(() => {
    syncBrowserChromeTheme(resolvedTheme)
  }, [resolvedTheme])

  React.useLayoutEffect(() => {
    sync()
  }, [sync, pathname])

  // Re-assert after paint so late theme scripts cannot leave a stale white bar.
  React.useEffect(() => {
    sync()
    const raf = window.requestAnimationFrame(sync)
    const t = window.setTimeout(sync, 120)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [sync, pathname])

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
        "data-desk-bottom-nav",
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

  return <BrowserChromeTintBars />
}

export { BrowserChromeSync }
