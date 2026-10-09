import type { AnimationConfig } from "./animation"
import type { AnimatedIcon, SVGIcon } from "./icon"

export interface CardData<T = unknown> {
  title?: string
  description?: string
  icon?: SVGIcon
  animatedIcon?: AnimatedIcon
  number?: number
  list?: string[]
  listType?: "ordered" | "unordered"
  listIcon?: SVGIcon
  badges?: string[]
  className?: string
  bgClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  iconClassName?: string
  numberClassName?: string
  listClassName?: string
  listIconClassName?: string
  badgeClassName?: string
  contentClassName?: string
  data?: T
}

export interface FeatureCardData extends CardData {
  graphic?: React.ExoticComponent
}

export interface AnimationCardData extends CardData {
  graphic?: React.ExoticComponent<React.ComponentPropsWithoutRef<"svg">>
  repeat?: boolean
  yoyo?: boolean
  initialAnimations?: AnimationConfig[]
  hoverAnimations?: AnimationConfig[]
}

export interface StatCard {
  description: string
  title?: string
  value?: number
  iconClass?: string
  valueSuffix?: string
  valuePrefix?: string
}
