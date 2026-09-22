"use client"

import { CheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  PRICING_PLAN_META,
  type PricingPlanKey,
} from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContentWide,
  landingCta,
  landingGlassBlueSheen,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSectionBody,
  landingTitlePlan,
  landingTitlePrice,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"
import { CHAT_APP_ORIGIN } from "@/lib/hosts"

const CONTACT_EMAIL = "hello@exur.ai"

function planHref(key: PricingPlanKey) {
  if (key === "free") return getLaunchAppHref()
  if (key === "plus") {
    if (process.env.NODE_ENV === "development") return UPGRADE_PATH
    return `${CHAT_APP_ORIGIN}${UPGRADE_PATH}`
  }
  return `mailto:${CONTACT_EMAIL}`
}

function PlanCta({
  planKey,
  featured,
  label,
}: {
  planKey: PricingPlanKey
  featured?: boolean
  label: string
}) {
  const href = planHref(planKey)
  const className = cn(landingCta(featured ? "primary" : "light"), "mt-8 w-full")
  const external = /^https?:\/\//i.test(href) || href.startsWith("mailto:")

  if (external) {
    return (
      <Button nativeButton={false} render={<a href={href} />} className={className}>
        {label}
      </Button>
    )
  }

  return (
    <Button nativeButton={false} render={<Link href={href} />} className={className}>
      {label}
    </Button>
  )
}

function PlanFeatures({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <span
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            aria-hidden
          >
            <CheckIcon className="size-2.5" strokeWidth={2} />
          </span>
          {feature}
        </li>
      ))}
    </ul>
  )
}

function PlanCard({
  planKey,
  featured,
  featureCount,
  hasPriceWas,
  hasBadge,
}: {
  planKey: PricingPlanKey
  featured?: boolean
  featureCount: number
  hasPriceWas?: boolean
  hasBadge?: boolean
}) {
  const t = useTranslations("modern.pricing")
  const badge = hasBadge ? t(`plans.${planKey}.badge`) : null
  const features = Array.from({ length: featureCount }, (_, i) =>
    t(`plans.${planKey}.features.${i}`)
  )

  return (
    <article
      className={cn(
        landingGlassSurface,
        "relative flex h-full flex-col overflow-hidden rounded-[1.75rem]",
        featured
          ? "bg-white/55 shadow-[0_28px_80px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-1 ring-[#2563EB]/10 dark:bg-white/10 dark:shadow-[0_28px_80px_rgba(37,99,235,0.16),inset_0_1px_1px_rgba(255,255,255,0.12)] lg:-my-1"
          : "bg-white/42 dark:bg-white/8"
      )}
    >
      {featured && (
        <span
          aria-hidden
          className={cn(landingGlassBlueSheen, "pointer-events-none absolute inset-0 opacity-40")}
        />
      )}
      <span
        aria-hidden
        className={cn(landingGlassSheen, "pointer-events-none absolute inset-0 rounded-[1.75rem]")}
      />

      <div className="relative z-10 flex h-full flex-col p-8 sm:p-9">
        <div className="flex items-start justify-between gap-3">
          <h3 className={landingTitlePlan}>{t(`plans.${planKey}.name`)}</h3>
          {badge ? (
            <span className="rounded-full bg-white/75 px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:bg-white/10">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <p className={cn(landingTitlePrice, "flex flex-wrap items-baseline gap-x-2.5")}>
            {hasPriceWas ? (
              <span className="text-2xl font-normal tracking-[-0.02em] text-muted-foreground/55 line-through decoration-muted-foreground/40">
                {t(`plans.${planKey}.priceWas`)}
              </span>
            ) : null}
            <span>
              {t(`plans.${planKey}.price`)}
              {planKey === "plus" ? (
                <span className="ml-1 text-lg font-normal text-muted-foreground">
                  {t("perMonth")}
                </span>
              ) : null}
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(`plans.${planKey}.desc`)}
          </p>
        </div>

        <PlanCta
          planKey={planKey}
          featured={featured}
          label={t(`plans.${planKey}.cta`)}
        />

        <div className="mt-8 flex-1 border-t border-white/55 pt-8 dark:border-white/10">
          <PlanFeatures features={features} />
        </div>
      </div>
    </article>
  )
}

export function PricingSection() {
  const t = useTranslations("modern.pricing")

  return (
    <section id="pricing" className={cn(landingSection, landingSectionBody)}>
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollRevealGroup className={cn(landingContentWide, "grid gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-5", landingAfterHeader)}>
        <ul className="contents list-none">
          {PRICING_PLAN_META.map((plan) => (
            <li key={plan.key} className="min-h-0 h-full">
              <PlanCard
                planKey={plan.key}
                featured={plan.featured}
                featureCount={plan.featureCount}
                hasPriceWas={plan.hasPriceWas}
                hasBadge={plan.hasBadge}
              />
            </li>
          ))}
        </ul>
      </ScrollRevealGroup>
    </section>
  )
}
