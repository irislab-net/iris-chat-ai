"use client"

import { ScrollTrigger } from "gsap/ScrollTrigger"
import * as React from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_DOT_SECTIONS } from "@/lib/landing-modern-data"

type LandingScrollContextValue = {
  activeSectionId: string
}

const LandingScrollContext = React.createContext<LandingScrollContextValue>({
  activeSectionId: LANDING_DOT_SECTIONS[0].id,
})

export function LandingScrollProvider({ children }: { children: React.ReactNode }) {
  const [activeSectionId, setActiveSectionId] = React.useState<string>(
    LANDING_DOT_SECTIONS[0].id
  )

  React.useEffect(() => {
    ensureGsapScroll()
    const triggers: ScrollTrigger[] = []

    for (const section of LANDING_DOT_SECTIONS) {
      const el = document.getElementById(section.id)
      if (!el) continue

      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => setActiveSectionId(section.id),
          onEnterBack: () => setActiveSectionId(section.id),
        })
      )
    }

    return () => {
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
