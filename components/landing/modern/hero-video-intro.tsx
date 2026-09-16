"use client"

import { FadeUp } from "@/components/landing/modern/fade-up"
import { HERO_VIDEO } from "@/lib/landing-modern-data"
import { landingInner } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function HeroVideoIntro() {
  const words = HERO_VIDEO.heading.split(" ")

  return (
    <section
      className={cn(
        "hero-video-intro relative z-1 flex flex-col items-center justify-center text-center",
        "px-4.5 pb-4 pt-14 max-[900px]:px-4.5",
        "min-[901px]:px-8 min-[901px]:pb-4 min-[901px]:pt-12"
      )}
    >
      <div className={cn(landingInner, "flex w-full max-w-105 flex-col items-center")}>
        <h2
          className="m-0 flex flex-wrap justify-center gap-[0.2em] text-[clamp(16px,1.5vw,24px)] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-white"
        >
          {words.map((word, index) => (
            <FadeUp
              key={`${word}-${index}`}
              as="span"
              delay={0.15 + index * 0.08}
              y={12}
              className="inline-block"
            >
              {word}
            </FadeUp>
          ))}
        </h2>

        <FadeUp as="p" delay={0.9} className="mt-3 max-w-70 text-xs leading-[1.55] text-white/80">
          {HERO_VIDEO.subtext}
        </FadeUp>
      </div>
    </section>
  )
}
