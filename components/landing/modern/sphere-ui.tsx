"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  landingCtaLight,
  landingCtaPrimary,
  landingGlassBlueSheen,
  landingGlassNavCta,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type SphereOrbProps = {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  glow?: boolean
}

const ORB_SIZES = {
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
  xl: "size-28 sm:size-32",
}

export function SphereOrb({ className, size = "md", glow = true }: SphereOrbProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", ORB_SIZES[size], className)}
      aria-hidden
    >
      {glow && (
        <span className="absolute inset-0 rounded-full bg-[#CBD5E1]/40 blur-xl" />
      )}
      <span
        className={cn(
          "relative block size-full rounded-full",
          "bg-[radial-gradient(circle_at_32%_28%,#F8FAFC_0%,#E2E8F0_35%,#94A3B8_68%,#64748B_100%)]",
          "shadow-[inset_-6px_-10px_18px_rgba(15,23,42,0.2),inset_8px_8px_16px_rgba(255,255,255,0.6),0_12px_32px_rgba(15,23,42,0.12)]"
        )}
      />
      <span className="absolute inset-[18%] rounded-full bg-linear-to-br from-white/55 to-transparent blur-[1px]" />
    </span>
  )
}

export function LandingBadge({
  children,
  className,
  light,
}: {
  children: ReactNode
  className?: string
  light?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium",
        light
          ? "bg-white/10 text-white/90 backdrop-blur-md"
          : "bg-[#F1F5F9] text-[#64748B]",
        className
      )}
    >
      {children}
    </span>
  )
}

export function SphereCta({
  children,
  href,
  onClick,
  className,
  iconClassName,
  variant = "primary",
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  iconClassName?: string
  variant?: "primary" | "light" | "glass"
}) {
  const isLight = variant === "light"
  const isGlass = variant === "glass"
  const buttonClass = isGlass
    ? landingGlassNavCta
    : isLight
      ? landingCtaLight
      : landingCtaPrimary

  const content = (
    <>
      {isGlass && <span aria-hidden className={cn(landingGlassBlueSheen, "rounded-full")} />}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            isGlass
              ? "bg-white/20 text-white"
              : isLight
                ? "bg-[#0F172A] text-white"
                : "bg-white/20 text-white",
            iconClassName
          )}
        >
          <ArrowUpRightIcon className="size-3.5" />
        </span>
      </span>
    </>
  )

  if (href) {
    return (
      <Button
        nativeButton={false}
        render={<Link href={href} />}
        className={cn(buttonClass, isGlass && "h-auto min-h-8", className)}
      >
        {content}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={onClick}
        className={cn(buttonClass, isGlass && "h-auto min-h-8", className)}
    >
      {content}
    </Button>
  )
}

export function GoalOrbIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mb-8 inline-flex">
      <span className="absolute -inset-3 rounded-full bg-[#CBD5E1]/30 blur-2xl" aria-hidden />
      <span className="relative flex size-16 items-center justify-center">
        <SphereOrb size="lg" glow={false} />
        <Icon className="absolute size-6 text-white drop-shadow-sm" strokeWidth={1.75} />
      </span>
    </div>
  )
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  className,
  light,
}: {
  badge?: string
  title: ReactNode
  subtitle?: string
  className?: string
  light?: boolean
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      {badge ? <LandingBadge light={light}>{badge}</LandingBadge> : null}
      <h2
        className={cn(
          "font-(family-name:--font-display) text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]",
          badge ? "mt-6" : "mt-0",
          light ? "text-white" : "text-[#0F172A]"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed sm:text-lg",
            light ? "text-white/75" : "text-[#64748B]"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function SparkleAccent({ className }: { className?: string }) {
  return <SparklesIcon className={cn("size-3.5 text-[#94A3B8]", className)} aria-hidden />
}
