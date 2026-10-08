import React from "react"
import type { AnimatedIcon, SVGIcon } from "./icon"

export interface DocCategory {
  title: string
  pages: DocPage[]
}

export interface DocPage {
  title: string
  path: string
  element?: React.ReactNode
  icon?: SVGIcon
  /** Sidebar icon — may be `React.lazy` for smaller docs entry. */
  animatedIcon?: AnimatedIcon
  iconClassName?: string
  children?: DocPage[]
}
