"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

import { LANDING_EASE } from "@/lib/landing-modern-styles"
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
  y = 30,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: LANDING_EASE }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
