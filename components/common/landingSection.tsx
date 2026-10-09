"use client"
import { cn } from "@/lib/utils"

function LandingSection({
  ref,
  children,
  id,
  className,
}: {
  ref?: React.RefObject<HTMLDivElement | null>
  children?: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "first:pb-0",
        "px-(--section-px) md:px-(--section-px-md)",
        "py-(--section-py) md:py-(--section-py-md)",
        "first:pt-(--section-pt-first) first:md:pt-(--section-pt-first-md)",
        className
      )}
    >
      {children}
    </div>
  )
}

export default LandingSection
