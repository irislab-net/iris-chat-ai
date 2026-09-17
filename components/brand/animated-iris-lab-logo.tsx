"use client"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { IRIS_LAB_LOGO_MARK_PATH, IRIS_LAB_LOGO_VIEWBOX } from "@/lib/iris-lab-logo-path"
import { cn } from "@/lib/utils"

type AnimatedIrisLabLogoProps = {
  className?: string
  scrollTrigger?: boolean
  play?: boolean
  replayOnHover?: boolean
  shimmer?: boolean
  variant?: "on-light" | "on-hero"
}

export function AnimatedIrisLabLogo({
  className,
  scrollTrigger = false,
  play = true,
  replayOnHover = false,
  shimmer = false,
  variant = "on-light",
}: AnimatedIrisLabLogoProps) {
  const colorClass = variant === "on-hero" ? "text-white" : "text-[#171717]"

  const icon = (
    <AnimatedSvgIcon
      kind="logo"
      className={cn(colorClass, shimmer ? "size-full" : className)}
      scrollTrigger={scrollTrigger}
      play={play}
      replayOnHover={replayOnHover}
    >
      <svg
        viewBox={IRIS_LAB_LOGO_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        className="size-full overflow-visible"
        fill="none"
        aria-hidden
      >
        <path data-logo-mark d={IRIS_LAB_LOGO_MARK_PATH} fill="currentColor" />
      </svg>
    </AnimatedSvgIcon>
  )

  if (!shimmer) return icon

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[0.72rem]",
        className
      )}
    >
      {icon}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <span
          className={cn(
            "absolute inset-y-[-12%] left-0 w-[62%]",
            "bg-linear-to-r from-transparent via-white/55 to-transparent",
            "animate-iris-logo-shimmer will-change-transform",
            variant === "on-hero" && "via-white/35"
          )}
        />
      </span>
    </div>
  )
}
