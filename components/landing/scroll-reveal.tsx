"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const ctx = gsap.context(() => {
      const items = root.querySelectorAll<HTMLElement>("[data-reveal]")
      const targets = items.length > 0 ? items : Array.from(root.children)

      gsap.fromTo(
        targets,
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          overwrite: true,
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            once: true,
          },
        }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "**:data-reveal:invisible motion-reduce:**:data-reveal:visible",
        className
      )}
    >
      {children}
    </div>
  )
}
