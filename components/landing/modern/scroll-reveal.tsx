"use client"

import { gsap } from "gsap"
import * as React from "react"
import type { ReactNode } from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { cn } from "@/lib/utils"

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 40,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.remove("invisible")
      return
    }

    let ctx: gsap.Context | undefined
    const frame = requestAnimationFrame(() => {
      const target = ref.current
      if (!target) return

      ensureGsapScroll()
      ctx = gsap.context(() => {
        gsap.fromTo(
          target,
          { y, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            delay,
            ease: "power3.out",
            overwrite: true,
            scrollTrigger: {
              trigger: target,
              start: "top 88%",
              once: true,
            },
          }
        )
      }, target)
    })

    return () => {
      cancelAnimationFrame(frame)
      ctx?.revert()
    }
  }, [delay, y])

  return (
    <div
      ref={ref}
      className={cn("invisible motion-reduce:visible", className)}
    >
      {children}
    </div>
  )
}
