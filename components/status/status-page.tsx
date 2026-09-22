"use client"

import type { ReactNode } from "react"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import { Button } from "@/components/ui/button"
import type { StatusPageAction } from "@/components/status/status-page-actions"
import {
  landingCta,
  landingDisplay,
  landingGlassBlueSheen,
  landingHeroGlass,
  landingInner,
  landingShell,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { getLandingHref, SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

export type { StatusPageAction }

type StatusPageProps = {
  code: string
  title: string
  body: string
  primary: StatusPageAction
  secondary?: StatusPageAction
  /** Optional footer note under the CTAs. */
  note?: ReactNode
}

function StatusAction({ action }: { action: StatusPageAction }) {
  const tone = action.tone ?? "glass"
  const isGlass = tone === "glass"
  const buttonClass = landingCta(tone, "md")
  const content = (
    <>
      {isGlass ? (
        <span aria-hidden className={cn(landingGlassBlueSheen, "rounded-full")} />
      ) : null}
      <span className="relative z-10">{action.label}</span>
    </>
  )

  // Plain anchors — status pages can render outside `[locale]` (no next-intl Link).
  if (action.href) {
    return (
      <Button
        nativeButton={false}
        render={<a href={action.href} />}
        className={buttonClass}
      >
        {content}
      </Button>
    )
  }

  return (
    <Button type="button" onClick={action.onClick} className={buttonClass}>
      {content}
    </Button>
  )
}

/**
 * Shared 404 / error shell — same glass card + mesh language as the landing hero.
 */
export function StatusPage({
  code,
  title,
  body,
  primary,
  secondary,
  note,
}: StatusPageProps) {
  const homeHref = getLandingHref()
  const watermark = /^\d+$/.test(code.trim()) ? code.trim() : "!"

  return (
    <div
      className={cn(
        plusJakarta.variable,
        jetbrainsMono.variable,
        "landing-modern relative flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-[#2563EB]/12 blur-3xl dark:bg-[#2563EB]/18" />
        <div className="absolute right-[-10%] bottom-[-10%] size-[28rem] rounded-full bg-[#93C5FD]/20 blur-3xl dark:bg-[#1E3A8A]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div
        className={cn(
          landingShell,
          "relative z-10 flex flex-1 flex-col justify-center py-10 sm:py-14"
        )}
      >
        <a
          href={homeHref}
          className="mb-8 inline-flex w-fit items-center gap-2.5 self-center rounded-full px-2 py-1 transition-opacity hover:opacity-80 sm:self-start"
        >
          <IrisLabLogo variant="brand" size={28} className="size-7" decorative />
          <span className={cn(landingDisplay, "text-base tracking-[-0.02em]")}>
            {SITE_NAME}
          </span>
        </a>

        <section
          className={cn(
            landingHeroGlass,
            "relative flex min-h-[22rem] flex-col justify-center overflow-hidden rounded-[2.5rem] sm:min-h-[24rem]",
            "animate-in fade-in zoom-in-95 duration-500"
          )}
        >
          <HeroLiquidGlassBg tone="blue" />

          <div
            className={cn(
              landingInner,
              "relative z-10 flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16"
            )}
          >
            <p className="font-[family-name:var(--font-mono-modern)] text-[0.7rem] font-medium tracking-[0.28em] text-muted-foreground uppercase">
              {code}
            </p>

            <p
              aria-hidden
              className={cn(
                landingDisplay,
                "pointer-events-none mt-2 select-none text-[5.5rem] leading-none tracking-[-0.06em] text-foreground/8 sm:text-[7.5rem] dark:text-foreground/10"
              )}
            >
              {watermark}
            </p>

            <h1 className={cn(landingTitleSection, "-mt-10 max-w-xl sm:-mt-12")}>
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {body}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <StatusAction action={primary} />
              {secondary ? <StatusAction action={secondary} /> : null}
            </div>

            {note ? (
              <div className="mt-5 text-xs text-muted-foreground">{note}</div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
