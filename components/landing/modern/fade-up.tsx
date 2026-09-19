"use client"

import type { CSSProperties, ReactNode } from "react"
import { createElement } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"

type FadeUpAs = "div" | "section" | "span" | "h1" | "h2" | "h3" | "p" | "nav"

type FadeUpProps = {
  children: ReactNode
  delay?: number
  /** Ignored — duration is the landing GSAP standard. Kept so call sites stay valid. */
  duration?: number
  y?: number
  className?: string
  style?: CSSProperties
  as?: FadeUpAs
  once?: boolean
}

/**
 * Thin GSAP wrapper around `ScrollReveal`.
 *
 * Older call sites used Motion. They now run the same reveal as every other
 * landing block — same ease, same start, same reduced-motion path.
 */
export function FadeUp({
  children,
  delay = 0,
  y,
  className,
  style,
  as = "div",
}: FadeUpProps) {
  return (
    <ScrollReveal delay={delay} y={y} className={className}>
      {createElement(as, { style }, children)}
    </ScrollReveal>
  )
}
