import { ArrowRightIcon, MailIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import { APP_NEWS_PATH, LANDING_PATH, SITE_NAME, SOCIAL_X_URL } from "@/lib/site"
import { LANDING_CONTAINER } from "@/lib/landing-layout"
import { cn } from "@/lib/utils"

type FooterLink = {
  label: string
  href: string
  external?: boolean
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const LINK_CLASS =
  "text-sm text-muted-foreground transition-colors hover:text-foreground"

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        className={LINK_CLASS}
        {...(link.href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link href={link.href} className={LINK_CLASS}>
      {link.label}
    </Link>
  )
}

export async function SiteFooter() {
  const t = await getTranslations("landing.footer")
  const common = await getTranslations("common")

  const columns = [
    {
      title: t("columns.product"),
      links: [
        { label: t("columns.features"), href: "/#features" },
        { label: t("columns.comingSoon"), href: "/#coming-soon" },
        { label: t("columns.pricing"), href: "/#pricing" },
        { label: t("columns.testimonials"), href: "/#testimonials" },
        { label: t("columns.faq"), href: "/#faq" },
        { label: common("launchApp"), href: APP_NEWS_PATH },
      ],
    },
    {
      title: t("columns.company"),
      links: [
        { label: t("columns.about"), href: "/about" },
        { label: t("columns.signalsPage"), href: "/ai-trading-signals" },
        {
          label: t("columns.contact"),
          href: "mailto:support@irislab.info",
          external: true,
        },
      ],
    },
    {
      title: t("columns.resources"),
      links: [
        { label: t("columns.privacy"), href: "/privacy" },
        { label: t("columns.terms"), href: "/terms" },
        { label: "llms.txt", href: "/llms.txt", external: true },
      ],
    },
  ]

  return (
    <footer className="relative w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/80 to-transparent"
      />

      <div className={cn("relative pt-16 pb-10 md:pt-20 md:pb-12 lg:pt-24", LANDING_CONTAINER)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-border/60 bg-card",
            "shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)]"
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklch,var(--foreground)_6%,transparent),transparent)]"
          />

          <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-lg">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {t("getStarted")}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {t("title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>

            <Button
              size="lg"
              className="h-11 shrink-0 rounded-2xl px-5"
              nativeButton={false}
              render={<Link href={APP_NEWS_PATH} />}
            >
              {common("launchApp")}
              <ArrowRightIcon data-icon="inline-end" className="rtl:rotate-180" />
            </Button>
          </div>
        </div>

        <Separator className="my-12 md:my-14" />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href={LANDING_PATH}
              aria-label={SITE_NAME}
              className="inline-flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
            >
              <IrisLabLogo decorative size={40} className="size-10 rounded-full" />
              <span className="text-base font-semibold tracking-tight text-foreground">
                {SITE_NAME}
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>

            <div className="mt-6 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                nativeButton={false}
                render={
                  <TrackedContactLink
                    href={SOCIAL_X_URL}
                    channel="x"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Exur on X"
                  />
                }
              >
                <XIcon className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                nativeButton={false}
                render={
                  <a
                    href="mailto:support@irislab.info"
                    aria-label="Email Exur support"
                  />
                }
              >
                <MailIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {column.title}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. {t("rights")}
          </p>
          <p className="text-xs text-muted-foreground">{common("analysisNotAdvice")}</p>
        </div>
      </div>
    </footer>
  )
}
