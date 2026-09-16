"use client"

import { Button } from "@/components/ui/button"
import { useLandingActiveSection } from "@/components/landing/modern/landing-scroll-context"
import { LANDING_DOT_SECTIONS, scrollToSection } from "@/lib/landing-modern-data"
import { cn } from "@/lib/utils"

export function LandingSectionDots() {
  const { activeSectionId } = useLandingActiveSection()

  return (
    <nav
      className="fixed top-1/2 right-4 z-50 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex xl:right-6"
      aria-label="Section navigation"
    >
      {LANDING_DOT_SECTIONS.map((section) => {
        const isActive = activeSectionId === section.id
        return (
          <Button
            key={section.id}
            type="button"
            variant="ghost"
            onClick={() => scrollToSection(section.id)}
            aria-label={section.label}
            aria-current={isActive ? "true" : undefined}
            className="size-3 rounded-full p-0 hover:bg-transparent"
          >
            <span
              className={cn(
                "block rounded-full transition-all duration-300",
                isActive
                  ? "size-2.5 bg-[#0F172A] shadow-[0_0_0_4px_rgba(15,23,42,0.1)]"
                  : "size-2 bg-[#CBD5E1] hover:bg-[#94A3B8]"
              )}
            />
          </Button>
        )
      })}
    </nav>
  )
}
