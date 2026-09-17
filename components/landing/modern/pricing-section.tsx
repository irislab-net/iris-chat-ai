"use client"

import { ArrowUpRightIcon, CheckIcon } from "lucide-react"
import type { ReactNode } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { PRICING_PLANS, PRICING_SECTION, type PricingPlan } from "@/lib/landing-modern-data"
import {
  landingCtaLight,
  landingCtaPrimary,
  landingGlassBlueSheen,
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingSection,
  landingSectionBody,
  landingTitlePlan,
  landingTitlePrice,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@irislab.info"

function planHref(plan: PricingPlan) {
  if (plan.key === "starter") return APP_NEWS_PATH
  if (plan.key === "pro") return UPGRADE_PATH
  return `mailto:${CONTACT_EMAIL}`
}

function PlanCtaIcon({ featured }: { featured?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
        featured ? "bg-white/20 text-white" : "bg-[#0F172A] text-white"
      )}
    >
      <ArrowUpRightIcon className="size-3.5" />
    </span>
  )
}

function PlanCtaContent({ children, featured }: { children: ReactNode; featured?: boolean }) {
  return (
    <span className="relative z-10 inline-flex w-full items-center justify-center gap-2">
      {children}
      <PlanCtaIcon featured={featured} />
    </span>
  )
}

function PlanCta({ plan }: { plan: PricingPlan }) {
  const href = planHref(plan)
  const featured = plan.featured
  const isExternal = plan.key === "ultimate"
  const className = cn(
    featured ? landingCtaPrimary : landingCtaLight,
    "group relative mt-8 h-auto w-full overflow-hidden px-6 py-3"
  )

  if (isExternal) {
    return (
      <Button nativeButton={false} render={<a href={href} />} className={className}>
        <PlanCtaContent featured={featured}>{plan.cta}</PlanCtaContent>
      </Button>
    )
  }

  return (
    <SphereCta
      href={href}
      variant={featured ? "primary" : "light"}
      className="mt-8 w-full justify-center px-6 py-3"
      iconClassName={featured ? undefined : "bg-[#0F172A] text-white"}
    >
      {plan.cta}
    </SphereCta>
  )
}

function PlanFeatures({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-[#64748B]">
          <span
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#94A3B8] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
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

function PlanCard({ plan }: { plan: PricingPlan }) {
  const featured = plan.featured

  return (
    <article
      className={cn(
        landingGlassSurface,
        "relative flex h-full flex-col overflow-hidden rounded-[1.75rem]",
        featured
          ? "bg-white/55 shadow-[0_28px_80px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-1 ring-[#2563EB]/10 lg:-my-1"
          : "bg-white/42"
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
          <h3 className={landingTitlePlan}>{plan.name}</h3>
          {plan.badge ? (
            <span className="rounded-full bg-white/75 px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#64748B] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              {plan.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <p className={landingTitlePrice}>
            {plan.price}
            {plan.key === "pro" ? (
              <span className="ml-1 text-lg font-normal text-[#94A3B8]">/mo</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{plan.desc}</p>
        </div>

        <PlanCta plan={plan} />

        <div className="mt-8 flex-1 border-t border-white/55 pt-8">
          <PlanFeatures features={plan.features} />
        </div>
      </div>
    </article>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={PRICING_SECTION.title}
            subtitle={PRICING_SECTION.subtitle}
          />
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:mt-16 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          {PRICING_PLANS.map((plan, index) => (
            <ScrollReveal key={plan.key} delay={0.08 + index * 0.04}>
              <PlanCard plan={plan} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
