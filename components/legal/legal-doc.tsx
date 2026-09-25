import type { ReactNode } from "react"

import { MarketingPageShell } from "@/components/landing/modern/marketing-page-shell"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import {
  landingCta,
  landingGlassSurface,
  landingHeroGlass,
  landingInner,
  landingTitleCard,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

const legalLinkClass =
  "font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground/55"

function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="scroll-mt-28 space-y-3.5" aria-labelledby={id}>
      <h2 id={id} className={cn(landingTitleCard, "text-[1.125rem] sm:text-lg")}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function LegalP({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base",
        className
      )}
    >
      {children}
    </p>
  )
}

function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2.5 ps-5 text-[0.9375rem] leading-relaxed text-muted-foreground marker:text-foreground/35 sm:text-base">
      {children}
    </ul>
  )
}

function LegalOrderedList({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-2.5 ps-5 text-[0.9375rem] leading-relaxed text-muted-foreground marker:text-foreground/45 sm:text-base">
      {children}
    </ol>
  )
}

function LegalDocShell({
  eyebrow,
  title,
  meta,
  intro,
  children,
  footerLinks,
}: {
  eyebrow?: string
  title: string
  meta: ReactNode
  intro: ReactNode
  children: ReactNode
  footerLinks?: ReactNode
}) {
  return (
    <MarketingPageShell>
      <article
        className={cn(
          landingHeroGlass,
          "rounded-[2rem] sm:rounded-[2.5rem]"
        )}
      >
        <div className={cn(landingInner, "py-10 sm:py-12 lg:py-14")}>
          <header className="mx-auto max-w-3xl text-center sm:text-start">
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {eyebrow ?? SITE_NAME}
            </p>
            <h1 className={cn(landingTitleSection, "mt-3")}>{title}</h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {meta}
            </div>
            <div className="mt-6 space-y-3 text-start">{intro}</div>
          </header>

          <Separator className="mx-auto my-10 max-w-3xl bg-foreground/8" />

          <div className="mx-auto flex max-w-3xl flex-col gap-10">{children}</div>

          {footerLinks ? (
            <>
              <Separator className="mx-auto my-10 max-w-3xl bg-foreground/8" />
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                {footerLinks}
              </div>
            </>
          ) : null}
        </div>
      </article>
    </MarketingPageShell>
  )
}

function LegalMetaChip({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        landingGlassSurface,
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function LegalNavButtons({
  showTerms = true,
  showPrivacy = true,
  showRefund = true,
  showAbout = true,
}: {
  showTerms?: boolean
  showPrivacy?: boolean
  showRefund?: boolean
  showAbout?: boolean
}) {
  return (
    <>
      <Button
        className={landingCta("primary", "sm")}
        nativeButton={false}
        render={<Link href={APP_NEWS_PATH} />}
      >
        Launch App
      </Button>
      {showTerms ? (
        <Button
          className={landingCta("secondary", "sm")}
          nativeButton={false}
          render={<Link href="/terms" />}
        >
          Terms of Service
        </Button>
      ) : null}
      {showPrivacy ? (
        <Button
          className={landingCta("secondary", "sm")}
          nativeButton={false}
          render={<Link href="/privacy" />}
        >
          Privacy Policy
        </Button>
      ) : null}
      {showRefund ? (
        <Button
          className={landingCta("secondary", "sm")}
          nativeButton={false}
          render={<Link href="/refund" />}
        >
          Refund Policy
        </Button>
      ) : null}
      {showAbout ? (
        <Button
          className={landingCta("light", "sm")}
          nativeButton={false}
          render={<Link href="/about" />}
        >
          About Exur
        </Button>
      ) : null}
    </>
  )
}

export {
  LegalDocShell,
  LegalList,
  LegalMetaChip,
  LegalNavButtons,
  LegalOrderedList,
  LegalP,
  LegalSection,
  legalLinkClass,
}
