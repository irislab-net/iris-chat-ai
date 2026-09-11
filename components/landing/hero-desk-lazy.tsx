"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { HeroAppSkeleton } from "@/components/landing/hero-app-frame"
import { LANDING_DESK_MAX } from "@/lib/landing-layout"

const HeroAppMock = dynamic(
  () =>
    import("@/components/landing/hero-app-mock").then((m) => m.HeroAppMock),
  { ssr: false, loading: () => <HeroAppSkeleton /> }
)

const PaperTilt = dynamic(
  () => import("@/components/landing/paper-tilt").then((m) => m.PaperTilt),
  { ssr: false }
)

/** Mounts once the placeholder is within a screen of the viewport. */
function useNearViewport() {
  const [near, setNear] = React.useState(false)
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  const ref = React.useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setNear(true))
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setNear(true)
        io.disconnect()
      },
      { rootMargin: "400px 0px" }
    )
    io.observe(node)
    observerRef.current = io
  }, [])

  return { ref, near }
}

/**
 * Reserved box + lazy island. No paint containment here — that clips the
 * paper glow. The mock still pauses itself when it leaves the viewport.
 */
export function HeroDeskLazy() {
  const { ref, near } = useNearViewport()

  React.useEffect(() => {
    if (!near) return
    const warm = () => {
      void import("@/components/landing/hero-app-mock")
      void import("@/components/landing/paper-tilt")
    }
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm)
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 250)
    return () => window.clearTimeout(id)
  }, [near])

  return (
    <div
      ref={ref}
      className="mt-10 w-full pb-10 sm:mt-12 sm:pb-12 md:mt-14 md:pb-14 lg:mt-16"
    >
      <div className={LANDING_DESK_MAX}>
        {near ? (
          <PaperTilt disableTiltOnCoarsePointer>
            <HeroAppMock />
          </PaperTilt>
        ) : (
          <HeroAppSkeleton />
        )}
      </div>
    </div>
  )
}
