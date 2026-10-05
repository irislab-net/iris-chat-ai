"use client"

import * as React from "react"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { cn } from "@/lib/utils"

const LITE_GLASS_QUERY = "(max-width: 767px)"

function subscribeLiteGlass(onStoreChange: () => void) {
  const media = window.matchMedia(LITE_GLASS_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getLiteGlassSnapshot() {
  return window.matchMedia(LITE_GLASS_QUERY).matches
}

/** SSR + first paint assume lite — safer for mobile WebKit scroll stability. */
function getLiteGlassServerSnapshot() {
  return true
}

/** True below Tailwind `md` — skip animated / backdrop-filter glass. */
export function useFeaturesLiteGlass() {
  return React.useSyncExternalStore(
    subscribeLiteGlass,
    getLiteGlassSnapshot,
    getLiteGlassServerSnapshot
  )
}

/**
 * Static blue wash — no orbs, no CSS filter blur loops, no backdrop-filter.
 * Used on Features stages for phone scroll stability (Chrome/WebKit OOM).
 */
export function FeaturesStaticGlassWash({
  className,
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#F8FAFC] to-[#EFF6FF] dark:from-background dark:via-background dark:to-card" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 8% 0%, rgba(37,99,235,0.14), transparent 58%), radial-gradient(80% 60% at 100% 100%, rgba(147,197,253,0.2), transparent 55%)",
        }}
      />
      <div className="absolute inset-0 bg-white/18 dark:bg-black/14" />
    </div>
  )
}

/**
 * Full liquid mesh only when near the viewport and not on a phone.
 * Off-screen stages unmount the animated tree so scroll does not keep
 * dozens of filter/blur layers compositing.
 */
export function FeaturesViewportGlassBg({
  tone = "blue",
  className,
}: {
  tone?: "blue"
  className?: string
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const lite = useFeaturesLiteGlass()
  const [near, setNear] = React.useState(false)

  React.useEffect(() => {
    if (lite) return
    const el = rootRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => setNear(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px 0px", threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [lite])

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      {lite || !near ? (
        <FeaturesStaticGlassWash />
      ) : (
        <HeroLiquidGlassBg tone={tone} />
      )}
    </div>
  )
}
