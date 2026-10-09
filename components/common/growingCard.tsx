import { cn } from "@/lib/utils"
import Frame from "./frame"
import React from "react"

const GrowingCard = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<
    React.ComponentPropsWithoutRef<"div"> & { bgClassName?: string }
  >
>(({ className, bgClassName, children, ...props }, ref) => {
  return (
    <Frame
      ref={ref}
      className={cn("group/growing-card relative", className)}
      {...props}
    >
      <div
        className={cn(
          "absolute !m-0 inset-0 -z-10 pointer-events-none rounded-[inherit] group-hover/growing-card:scale-105 transition-all duration-300 bg-neutral-50",
          bgClassName
        )}
      />

      {children}
    </Frame>
  )
})

export default GrowingCard
