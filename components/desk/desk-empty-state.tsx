"use client"

import type { LucideIcon } from "lucide-react"

import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/** Quiet empty — icon, one title, one short line. No outer frame. */
function DeskEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14",
        className
      )}
    >
      <span
        className={cn(
          "relative isolate flex size-12 items-center justify-center overflow-hidden rounded-full",
          "border border-white/75 dark:border-white/20",
          "bg-white/55 backdrop-blur-[28px] dark:bg-white/12",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55)]",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_8px_20px_-8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.12)]",
          "text-muted-foreground"
        )}
        aria-hidden
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <Icon className="relative z-10 size-5 stroke-[1.6]" />
      </span>
      <p className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export { DeskEmptyState }
