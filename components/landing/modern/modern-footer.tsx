"use client"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { FOOTER_CTA, NAV_LINKS, scrollToSection } from "@/lib/landing-modern-data"
import { SITE_NAME } from "@/lib/site"
import {
  landingDisplay,
  landingFooterCard,
  landingInner,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Settings", href: "/privacy" },
] as const

const CONTACT_EMAIL = "hello@irislab.info"

export function ModernFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={cn(landingFooterCard, "text-white")}>
      <div aria-hidden className="sphere-hero-bg absolute inset-0 z-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(255,255,255,0.2),transparent_55%),radial-gradient(ellipse_70%_60%_at_100%_20%,rgba(255,255,255,0.12),transparent_50%)]"
      />

      <div className="relative z-10 py-8 sm:py-10 lg:py-12">
        <div className={cn(landingInner, "flex flex-col gap-10 sm:gap-12")}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => scrollToSection("top")}
              aria-label={SITE_NAME}
              className="h-auto w-fit gap-2.5 rounded-full px-0 py-0 text-white hover:bg-white/10"
            >
              <IrisLabLogo decorative size={56} variant="on-hero" className="size-14 shrink-0" />
              <span
                className={cn(
                  landingDisplay,
                  "text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                )}
              >
                {SITE_NAME}
              </span>
            </Button>

            <div className="flex flex-col gap-4 sm:items-end">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
                <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
                  {NAV_LINKS.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => scrollToSection(link.id)}
                      className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <SphereCta
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="shrink-0 rounded-full bg-black px-5 py-2.5 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-black/90"
                  iconClassName="bg-white/15 text-white"
                >
                  Contact Us
                </SphereCta>
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <h2
            className={cn(
              landingDisplay,
              "max-w-3xl text-[1.65rem] font-semibold leading-[1.2] tracking-tight sm:text-3xl lg:text-[2.25rem] lg:leading-[1.12]"
            )}
          >
            {FOOTER_CTA.title}
          </h2>

          <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/75 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="max-w-xl text-left lg:max-w-2xl">
              <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                {FOOTER_CTA.subtitle}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                {FOOTER_CTA.tagline}
              </p>
              <p className="mt-4 shrink-0 text-white/65">
                © {year} {SITE_NAME}. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-8">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white/75"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
