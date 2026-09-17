"use client"

import { AnimatedIrisLabLogo } from "@/components/brand/animated-iris-lab-logo"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { FOOTER_CTA, NAV_LINKS, scrollToSection } from "@/lib/landing-modern-data"
import { SITE_NAME } from "@/lib/site"
import {
  landingCard,
  landingFooterCard,
  landingInner,
  landingTitleFooter,
  landingTitleFooterLg,
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
    <footer className={cn(landingFooterCard, landingCard, "bg-white text-[#0F172A]")}>
      <div className="relative z-10 py-8 sm:py-10 lg:py-12">
        <div className={cn(landingInner, "flex flex-col gap-10 sm:gap-12")}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => scrollToSection("top")}
              aria-label={SITE_NAME}
              className="h-auto w-fit gap-2.5 rounded-full px-0 py-0 text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <AnimatedIrisLabLogo scrollTrigger className="size-14 shrink-0" />
              <span className={landingTitleFooter}>
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
                      className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <SphereCta href={`mailto:${CONTACT_EMAIL}`} className="shrink-0 rounded-full px-5 py-2.5 text-sm">
                  Contact Us
                </SphereCta>
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-[#94A3B8] transition-colors hover:text-[#0F172A]"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <h2 className={cn("max-w-3xl", landingTitleFooterLg)}>
            {FOOTER_CTA.title}
          </h2>

          <div className="flex flex-col gap-6 rounded-[1.5rem] bg-[#F8FAFC] p-6 text-sm text-[#64748B] sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="max-w-xl text-left lg:max-w-2xl">
              <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
                {FOOTER_CTA.subtitle}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#94A3B8]">
                {FOOTER_CTA.tagline}
              </p>
              <p className="mt-4 shrink-0 text-[#94A3B8]">
                © {year} {SITE_NAME}. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-8">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="underline decoration-black/20 underline-offset-4 transition-colors hover:text-[#0F172A] hover:decoration-black/40"
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
