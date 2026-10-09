import type { LucideIcon } from "lucide-react"
import type { AnimatedIcon } from "./icon"

interface BaseMenuItem {
  title: string
  link?: string
  icon?: LucideIcon
  animatedIcon?: AnimatedIcon
  iconClassName?: string
}

export interface SubMenuItem extends BaseMenuItem {
  description?: string
  largeInMobile?: boolean
}

export interface MenuItem extends BaseMenuItem {
  subItems?: SubMenuItem[]
}
