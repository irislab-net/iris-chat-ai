"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { landingCtaDark, landingCtaLight } from "@/lib/landing-modern-styles"
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
        <span className="absolute inset-0 rounded-full bg-[#38BDF8]/35 blur-xl" />
      )}
      <span
        className={cn(
          "relative block size-full rounded-full",
          "bg-[radial-gradient(circle_at_32%_28%,#E0F2FE_0%,#38BDF8_35%,#2563EB_68%,#1D4ED8_100%)]",
          "shadow-[inset_-6px_-10px_18px_rgba(15,23,42,0.35),inset_8px_8px_16px_rgba(255,255,255,0.45),0_12px_32px_rgba(37,99,235,0.35)]"
        )}
      />
      <span className="absolute inset-[18%] rounded-full bg-gradient-to-br from-white/55 to-transparent blur-[1px]" />
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
        "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium",
        light
          ? "border-white/25 bg-white/10 text-white/90 backdrop-blur-md"
          : "border-black/8 bg-white text-[#64748B] shadow-sm",
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
  variant = "dark",
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  iconClassName?: string
  variant?: "dark" | "light"
}) {
  const isLight = variant === "light"
  const buttonClass = isLight ? landingCtaLight : landingCtaDark

  const content = (
    <>
      {children}
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
          isLight ? "bg-[#0F172A] text-white" : "bg-white text-[#0F172A]",
          iconClassName
        )}
      >
        <ArrowUpRightIcon className="size-3.5" />
      </span>
    </>
  )

  if (href) {
    return (
      <Button
        nativeButton={false}
        render={<Link href={href} />}
        className={cn(buttonClass, className)}
      >
        {content}
      </Button>
    )
  }

  return (
    <Button type="button" onClick={onClick} className={cn(buttonClass, className)}>
      {content}
    </Button>
  )
}

export function GoalOrbIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mb-8 inline-flex">
      <span className="absolute -inset-3 rounded-full bg-[#38BDF8]/20 blur-2xl" aria-hidden />
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
  badge: string
  title: ReactNode
  subtitle?: string
  className?: string
  light?: boolean
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <LandingBadge light={light}>{badge}</LandingBadge>
      <h2
        className={cn(
          "mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]",
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
  return <SparklesIcon className={cn("size-3.5 text-[#38BDF8]", className)} aria-hidden />
}
