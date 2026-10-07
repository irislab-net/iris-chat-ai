"use client"

import * as React from "react"

import { ExurLogo } from "@/components/brand/exur-logo"
import { EXUR_LOGO_MARK_PATH, EXUR_LOGO_VIEWBOX } from "@/lib/exur-logo-path"
import { cn } from "@/lib/utils"

/** Chat empty-state / PWA splash mark — kept out of chat-message to avoid CSS/JS bleed. */
export function IrisMark({
  className,
  imageClassName,
  variant = "default",
}: {
  className?: string
  imageClassName?: string
  /**
   * `hero` — glass-shell empty-state mark.
   * `glyph` — bare mark with no shell (mobile chat hero).
   */
  variant?: "default" | "hero" | "glyph"
}) {
  const isHero = variant === "hero"
  const gradientId = React.useId().replace(/:/g, "")

  if (variant === "glyph") {
    return (
      <span
        className={cn(
          "chat-empty-hero-glyph relative inline-flex size-11 shrink-0 items-center justify-center",
          className
        )}
      >
        <svg
          viewBox={EXUR_LOGO_VIEWBOX}
          className={cn("size-full overflow-visible", imageClassName)}
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`exur-glyph-black-${gradientId}`}
              x1="33.15"
              y1="7"
              x2="33.15"
              y2="63"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#000000" />
              <stop offset="1" stopColor="#3F3F3F" />
            </linearGradient>
            <linearGradient
              id={`exur-glyph-white-${gradientId}`}
              x1="33.15"
              y1="7"
              x2="33.15"
              y2="63"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D4D4D4" />
            </linearGradient>
          </defs>
          <path
            className="dark:hidden"
            d={EXUR_LOGO_MARK_PATH}
            fill={`url(#exur-glyph-black-${gradientId})`}
          />
          <path
            className="hidden dark:block"
            d={EXUR_LOGO_MARK_PATH}
            fill={`url(#exur-glyph-white-${gradientId})`}
          />
        </svg>
      </span>
    )
  }

  if (!isHero) {
    return (
      <ExurLogo
        decorative
        variant="gradient"
        size={28}
        className={cn("size-7 overflow-hidden rounded-full", className)}
        imageClassName={imageClassName}
      />
    )
  }

  // Hero double-shell: outer element IS the glass rim (padding = rim).
  // Do not paint opaque absolute frost at inset-0 of a padded wrapper — that
  // fills the gutter and reads as a dead bezel. Sheen stays under content.
  return (
    <span
      className={cn(
        "chat-empty-hero-mark relative inline-flex size-14 shrink-0 items-center justify-center",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 z-0 rounded-full bg-foreground/10 blur-xl dark:bg-black/40"
      />
      <span
        className={cn(
          "relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full p-0.75",
          "border-0 bg-white/44 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_88%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_14px_36px_-14px_color-mix(in_oklch,var(--foreground)_14%,transparent)]",
          "backdrop-blur-2xl backdrop-saturate-180 supports-backdrop-filter:bg-white/28",
          "dark:bg-white/10 dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_16%,transparent),0_14px_40px_-16px_color-mix(in_oklch,black_55%,transparent)] dark:supports-backdrop-filter:bg-white/7"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-full bg-linear-to-br from-white/72 via-white/18 to-transparent dark:from-white/16 dark:via-white/5 dark:to-transparent"
        />
        <span
          className={cn(
            "relative z-10 isolate flex size-full items-center justify-center overflow-hidden rounded-full p-[8%]",
            "bg-white/72 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_90%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_6%,transparent)]",
            "backdrop-blur-md supports-backdrop-filter:bg-white/55",
            "dark:bg-[oklch(0.18_0_0_/0.92)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_8%,transparent),0_6px_18px_-10px_color-mix(in_oklch,black_50%,transparent)] dark:supports-backdrop-filter:bg-[oklch(0.16_0_0_/0.78)]"
          )}
        >
          <svg
            viewBox={EXUR_LOGO_VIEWBOX}
            className={cn(
              "relative z-0 size-full overflow-visible",
              imageClassName
            )}
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`exur-mark-black-${gradientId}`}
                x1="33.15"
                y1="7"
                x2="33.15"
                y2="63"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#000000" />
                <stop offset="1" stopColor="#3F3F3F" />
              </linearGradient>
              <linearGradient
                id={`exur-mark-white-${gradientId}`}
                x1="33.15"
                y1="7"
                x2="33.15"
                y2="63"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#D4D4D4" />
              </linearGradient>
            </defs>
            <path
              className="dark:hidden"
              d={EXUR_LOGO_MARK_PATH}
              fill={`url(#exur-mark-black-${gradientId})`}
            />
            <path
              className="hidden dark:block"
              d={EXUR_LOGO_MARK_PATH}
              fill={`url(#exur-mark-white-${gradientId})`}
            />
          </svg>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
          >
            <span
              className={cn(
                "absolute inset-y-[-12%] left-0 w-[62%]",
                "bg-linear-to-r from-transparent via-white/55 to-transparent",
                "animate-exur-logo-shimmer will-change-transform",
                "dark:via-white/70"
              )}
            />
          </span>
        </span>
      </span>
    </span>
  )
}
