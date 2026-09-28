"use client"

import * as React from "react"

import { EXUR_LOGO_MARK_PATH, EXUR_LOGO_VIEWBOX } from "@/lib/exur-logo-path"
import { cn } from "@/lib/utils"

export const EXUR_LOGO_LIGHT_SRC = "/exur-logo-light.svg"
export const EXUR_LOGO_DARK_SRC = "/exur-logo-dark.svg"
export const EXUR_LOGO_BRAND_SRC = "/exur-logo-brand.svg"
export const EXUR_LOGO_MARK_WHITE_SRC = "/exur-logo-mark-white.svg"
export const EXUR_LOGO_GRADIENT_SRC = "/exur-logo-gradient.svg"

type ExurLogoProps = {
  className?: string
  imageClassName?: string
  /** Intrinsic pixel size (layout scales via className). */
  size?: number
  priority?: boolean
  alt?: string
  /** Hide from assistive tech when parent link/button already names the brand. */
  decorative?: boolean
  /** Sweep highlight across the liquid-glass mark (brand / gradient). */
  shimmer?: boolean
  /** `on-hero` = white mark on transparent; `on-light` = black mark; `brand` / `gradient` = mark on liquid-glass disc. */
  variant?: "auto" | "on-hero" | "on-light" | "on-dark" | "brand" | "gradient"
}

function LogoPicture({
  src,
  size,
  className,
  priority,
}: {
  src: string
  size: number
  className?: string
  priority?: boolean
}) {
  return (
    <picture>
      <source srcSet={src} type="image/svg+xml" />
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
      />
    </picture>
  )
}

function ExurMarkSvg({
  fill,
  className,
  gradient,
}: {
  fill?: string
  className?: string
  gradient?: boolean
}) {
  const gradientId = React.useId().replace(/:/g, "")

  return (
    <svg
      viewBox={EXUR_LOGO_VIEWBOX}
      className={cn("relative z-10 size-full overflow-visible", className)}
      fill="none"
      aria-hidden
    >
      {gradient ? (
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
      ) : null}
      {gradient ? (
        <>
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
        </>
      ) : (
        <path d={EXUR_LOGO_MARK_PATH} fill={fill} />
      )}
    </svg>
  )
}

/** Compact liquid-glass disc — light plate / dark charcoal plate. */
const exurMarkLiquidShellClass =
  "relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-white/80 p-[6%] shadow-[0_2px_8px_-4px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_8px_20px_-10px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md backdrop-saturate-150 supports-backdrop-filter:bg-white/62 dark:bg-[oklch(0.2_0_0_/0.9)] dark:shadow-[0_2px_10px_-4px_color-mix(in_oklch,black_40%,transparent),0_8px_22px_-10px_color-mix(in_oklch,black_48%,transparent)] dark:supports-backdrop-filter:bg-[oklch(0.18_0_0_/0.78)]"

function ExurMarkLiquidShell({
  className,
  label,
  shimmer = false,
  children,
}: {
  className?: string
  label?: string
  shimmer?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(exurMarkLiquidShellClass, "isolate", className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-linear-to-br from-white/95 via-white/30 to-transparent dark:from-white/12 dark:via-white/3 dark:to-transparent"
      />
      {children}
      {shimmer ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
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
      ) : null}
    </span>
  )
}

function ExurLogo({
  className,
  imageClassName,
  size = 32,
  priority,
  alt = "Exur",
  decorative = false,
  shimmer = false,
  variant = "auto",
}: ExurLogoProps) {
  const label = decorative ? undefined : alt
  const shared = cn("size-full object-contain", imageClassName)
  const showThemePair = variant === "auto"

  if (variant === "brand") {
    return (
      <ExurMarkLiquidShell className={className} label={label} shimmer={shimmer}>
        <ExurMarkSvg fill="#2563EB" className={imageClassName} />
      </ExurMarkLiquidShell>
    )
  }

  if (variant === "gradient") {
    return (
      <ExurMarkLiquidShell className={className} label={label} shimmer={shimmer}>
        <ExurMarkSvg gradient className={imageClassName} />
      </ExurMarkLiquidShell>
    )
  }

  return (
    <span
      className={cn("relative inline-flex aspect-square shrink-0", className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      {(variant === "auto" || variant === "on-dark") && (
        <LogoPicture
          src={EXUR_LOGO_LIGHT_SRC}
          size={size}
          priority={priority}
          className={cn(
            shared,
            showThemePair ? "absolute inset-0 hidden dark:block" : undefined
          )}
        />
      )}
      {variant === "on-hero" && (
        <LogoPicture
          src={EXUR_LOGO_MARK_WHITE_SRC}
          size={size}
          priority={priority}
          className={shared}
        />
      )}
      {(variant === "auto" || variant === "on-light") && (
        <LogoPicture
          src={EXUR_LOGO_DARK_SRC}
          size={size}
          priority={priority}
          className={cn(shared, showThemePair && "dark:hidden")}
        />
      )}
    </span>
  )
}

export { ExurLogo }
