import type { ReactNode } from "react"

import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/** Shared liquid-glass panel for billing / upgrade / payment UI. */
function BillingGlassPanel({
  children,
  className,
  radius = "rounded-[1.75rem]",
}: {
  children: ReactNode
  className?: string
  radius?: string
}) {
  return (
    <div
      className={cn(
        landingGlassSurface,
        "overflow-hidden bg-white/42 dark:bg-white/8",
        radius,
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          landingGlassSheen,
          "pointer-events-none absolute inset-0",
          radius
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export { BillingGlassPanel }
