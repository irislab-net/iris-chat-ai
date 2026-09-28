"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { IrisMark } from "@/components/app-shell/chat-message"
import { isStandaloneDisplay } from "@/lib/display-mode"
import { SITE_NAME } from "@/lib/seo"
import { cn } from "@/lib/utils"

const SPLASH_MIN_MS = 920
const SPLASH_EXIT_MS = 480
const SPLASH_MAX_MS = 3400
const BOOT_KEY = "exur-pwa-splash-seen"

/**
 * Standalone PWA splash — liquid-glass mark (empty-hero), app name, three-dot loader.
 * Markup is SSR’d so chrome-init’s `display-standalone` class can reveal it
 * before hydration; native OS splash stays static.
 */
export function PwaSplash() {
  const t = useTranslations("workspace")
  const [exiting, setExiting] = React.useState(false)
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    if (!isStandaloneDisplay()) {
      document.documentElement.classList.add("pwa-splash-done")
      setDone(true)
      return
    }

    try {
      if (sessionStorage.getItem(BOOT_KEY) === "1") {
        document.documentElement.classList.add("pwa-splash-done")
        setDone(true)
        return
      }
    } catch {
      // private mode / blocked storage — still show once this mount
    }

    const started = Date.now()
    let exitTimer = 0
    let hideTimer = 0
    let maxTimer = 0
    let finished = false

    const complete = () => {
      if (finished) return
      finished = true
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - started))
      exitTimer = window.setTimeout(() => {
        setExiting(true)
        hideTimer = window.setTimeout(() => {
          document.documentElement.classList.add("pwa-splash-done")
          setDone(true)
          try {
            sessionStorage.setItem(BOOT_KEY, "1")
          } catch {
            // ignore
          }
        }, SPLASH_EXIT_MS)
      }, wait)
    }

    if (document.readyState === "complete") {
      complete()
    } else {
      window.addEventListener("load", complete, { once: true })
    }
    maxTimer = window.setTimeout(complete, SPLASH_MAX_MS)

    return () => {
      window.removeEventListener("load", complete)
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(maxTimer)
    }
  }, [])

  if (done) return null

  return (
    <div
      className={cn("pwa-splash", exiting && "pwa-splash--exit")}
      role="status"
      aria-live="polite"
      aria-label={t("loadingExur")}
    >
      <div className="pwa-splash-inner">
        <IrisMark variant="hero" className="pwa-splash-mark size-16" />
        <p className="pwa-splash-title">
          <span className="pwa-splash-name">{SITE_NAME}</span>
        </p>
        <div className="pwa-splash-dots" aria-hidden>
          <span className="pwa-splash-dot" />
          <span className="pwa-splash-dot" />
          <span className="pwa-splash-dot" />
        </div>
      </div>
    </div>
  )
}
