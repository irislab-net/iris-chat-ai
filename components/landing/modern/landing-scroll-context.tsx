"use client"

import { ScrollTrigger } from "gsap/ScrollTrigger"
import * as React from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_SCROLL_SECTIONS } from "@/lib/landing-modern-data"
import { LANDING_MOTION } from "@/lib/landing-motion"

type LandingScrollContextValue = {
  activeSectionId: string
}

const LandingScrollContext = React.createContext<LandingScrollContextValue>({
  activeSectionId: LANDING_SCROLL_SECTIONS[0].id,
})

export function LandingScrollProvider({ children }: { children: React.ReactNode }) {
  const [activeSectionId, setActiveSectionId] = React.useState<string>(
    LANDING_SCROLL_SECTIONS[0].id
  )

  React.useEffect(() => {
    ensureGsapScroll()

    const triggers: ScrollTrigger[] = []

    for (const section of LANDING_SCROLL_SECTIONS) {
      const el = document.getElementById(section.id)
      if (!el) continue

      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: LANDING_MOTION.spyStart,
          end: LANDING_MOTION.spyEnd,
          onEnter: () => setActiveSectionId(section.id),
          onEnterBack: () => setActiveSectionId(section.id),
        })
      )
    }

    // Reveals measure after first paint, fonts, and late images — refresh so
    // start positions stay honest as the page settles.
    const refresh = () => ScrollTrigger.refresh()
    const frame = requestAnimationFrame(refresh)
    const onLoad = () => refresh()
    window.addEventListener("load", onLoad)
    const fonts = document.fonts?.ready.then(refresh)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("load", onLoad)
      void fonts
      for (const trigger of triggers) trigger.kill()
    }
  }, [])

  return (
    <LandingScrollContext.Provider value={{ activeSectionId }}>
      {children}
    </LandingScrollContext.Provider>
  )
}

export function useLandingActiveSection() {
  return React.useContext(LandingScrollContext)
}
