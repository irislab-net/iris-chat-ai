"use client"

import { motion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"

type FadeUpAs = "div" | "section" | "span" | "h1" | "h2" | "h3" | "p" | "nav"

type FadeUpProps = {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
  style?: CSSProperties
  as?: FadeUpAs
  once?: boolean
}

const FADE_EASE = [0.22, 1, 0.36, 1] as const

export function FadeUp({
  children,
  delay = 0,
  duration = 0.7,
  y = 24,
  className,
  style,
  as = "div",
  once = true,
}: FadeUpProps) {
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: FADE_EASE }}
    >
      {children}
    </Tag>
  )
}
