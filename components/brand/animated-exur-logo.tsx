"use client"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { EXUR_LOGO_MARK_PATH, EXUR_LOGO_VIEWBOX } from "@/lib/exur-logo-path"
import { cn } from "@/lib/utils"

type AnimatedExurLogoProps = {
  className?: string
  scrollTrigger?: boolean
  play?: boolean
  replayOnHover?: boolean
  shimmer?: boolean
  variant?: "on-light" | "on-hero"
}

export function AnimatedExurLogo({
  className,
  scrollTrigger = false,
  play = true,
  replayOnHover = false,
  shimmer = false,
  variant = "on-light",
}: AnimatedExurLogoProps) {
  const colorClass = variant === "on-hero" ? "text-white" : "text-foreground"

  const icon = (
    <AnimatedSvgIcon
      kind="logo"
      className={cn(colorClass, shimmer ? "size-full" : className)}
      scrollTrigger={scrollTrigger}
      play={play}
      replayOnHover={replayOnHover}
    >
      <svg
        viewBox={EXUR_LOGO_VIEWBOX}
        className="size-full overflow-visible"
        fill="none"
        aria-hidden
      >
        <path data-logo-mark d={EXUR_LOGO_MARK_PATH} fill="currentColor" />
      </svg>
    </AnimatedSvgIcon>
  )

  if (!shimmer) return icon

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-full",
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
            "animate-exur-logo-shimmer will-change-transform",
            variant === "on-hero" && "via-white/35"
          )}
        />
      </span>
    </div>
  )
}
