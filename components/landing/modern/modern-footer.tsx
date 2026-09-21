"use client"

import { AnimatedIrisLabLogo } from "@/components/brand/animated-iris-lab-logo"
import { XIcon } from "@/components/brand/x-icon"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import { FOOTER_TAGLINE } from "@/lib/landing-modern-data"
import { scrollToSection } from "@/lib/landing-motion"
import { getLaunchAppHref, SITE_NAME, SOCIAL_X_URL } from "@/lib/site"
import {
  landingCard,
  landingFooterCard,
  landingInner,
  landingTitleFooter,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@exur.ai"

/** `section` scrolls the one-pager, `href` routes, `external` opens a new tab. */
type FooterLink =
  | { label: string; section: string }
  | { label: string; href: string; external?: boolean }

type FooterColumn = {
  heading: string
  links: readonly FooterLink[]
}

const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Why Exur", section: "features" },
      { label: "How it works", section: "how-it-works" },
      { label: "Pricing", section: "pricing" },
      { label: "Open app", href: getLaunchAppHref() },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQ", section: "faq" },
      { label: "About Exur", href: "/about" },
      { label: "AI trading signals", href: "/ai-trading-signals" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: true },
      { label: "Exur on X", href: SOCIAL_X_URL, external: true },
    ],
  },
]

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Settings", href: "/privacy" },
] as const

const linkClass =
  "w-fit text-left text-sm text-muted-foreground transition-colors hover:text-foreground"

function FooterColumnLink({ link }: { link: FooterLink }) {
  if ("section" in link) {
    return (
      <button type="button" onClick={() => scrollToSection(link.section)} className={linkClass}>
        {link.label}
      </button>
    )
  }

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {link.label}
      </a>
    )
  }

  if (/^https?:\/\//i.test(link.href)) {
    return (
      <a href={link.href} className={linkClass}>
        {link.label}
      </a>
    )
  }

  return (
    <Link href={link.href} className={linkClass}>
      {link.label}
    </Link>
  )
}

export function ModernFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={cn(landingFooterCard, landingCard)}>
      <ScrollReveal className="relative z-10 py-9 sm:py-10">
        <div className={cn(landingInner, "flex flex-col")}>
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
            <div className="max-w-sm">
              <Button
                type="button"
                variant="ghost"
                onClick={() => scrollToSection("top")}
                aria-label={SITE_NAME}
                className="h-auto w-fit gap-2.5 rounded-full px-0 py-0 text-foreground hover:bg-transparent"
              >
                <AnimatedIrisLabLogo scrollTrigger replayOnHover shimmer className="size-10" />
                <span className={landingTitleFooter}>{SITE_NAME}</span>
              </Button>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {FOOTER_TAGLINE}
              </p>
              <a
                href={SOCIAL_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${SITE_NAME} on X`}
                className="mt-5 inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <XIcon className="size-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:gap-x-16">
              {FOOTER_COLUMNS.map((column) => (
                <nav key={column.heading} className="flex flex-col gap-3" aria-label={column.heading}>
                  <p className="text-sm font-semibold text-foreground">{column.heading}</p>
                  {column.links.map((link) => (
                    <FooterColumnLink key={link.label} link={link} />
                  ))}
                </nav>
              ))}
            </div>
          </div>

          <Separator className="mt-10 mb-6 bg-border" />

          <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              © {year} {SITE_NAME}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  )
}
