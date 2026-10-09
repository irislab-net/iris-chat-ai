import type React from "react"
import type { AnimationHandle } from "./animation"

export type SVGIcon = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement>
>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AnimatedIcon<P = {}> = React.ForwardRefExoticComponent<
  React.HTMLAttributes<P> & React.RefAttributes<AnimationHandle>
>
