import { cn } from "@/lib/utils"
import React from "react"
import AnimatedText from "./animatedText"

function Heading({
  id,
  level,
  animate,
  scrollTrigger,
  children,
  className,
  ...props
}: {
  id?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  animate?: true | "scroll"
  scrollTrigger?: boolean
  children?: React.ReactNode
  className?: string
  props?: React.HTMLAttributes<HTMLHeadingElement>
}) {
  return React.createElement(
    level ? `h${level}` : "strong",
    {
      id,
      className: cn("font-semibold tracking-tight font-brand", className),
      ...props,
    },
    animate || scrollTrigger ? (
      <AnimatedText scrollTrigger={scrollTrigger}>{children}</AnimatedText>
    ) : (
      children
    )
  )
}

export default Heading
