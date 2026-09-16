"use client"

import { ArrowUpRightIcon, CheckIcon, StarIcon } from "lucide-react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { PRICING_PLANS, PRICING_SECTION, type PricingPlan } from "@/lib/landing-modern-data"
import { landingCard, landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@irislab.info"

const planCtaClass =
  "mt-6 h-auto w-full justify-between rounded-full bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8]"

function planHref(plan: PricingPlan) {
  if (plan.key === "starter") return APP_NEWS_PATH
  if (plan.key === "pro") return UPGRADE_PATH
  return `mailto:${CONTACT_EMAIL}`
}

function PlanFeatures({ features, className }: { features: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm text-[#475569]">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckIcon className="size-3" strokeWidth={2.5} />
          </span>
          {feature}
        </li>
      ))}
    </ul>
  )
}

function SimplePlanCard({ plan }: { plan: PricingPlan }) {
  const href = planHref(plan)
  const isExternal = plan.key === "ultimate"

  return (
    <article className={cn("flex h-full flex-col p-8 sm:p-9", landingCard)}>
      <h3 className="font-(family-name:--font-display) text-xl font-semibold text-[#0F172A]">
        {plan.name}
      </h3>
      <p className="mt-4 font-(family-name:--font-display) text-5xl font-semibold text-[#0F172A]">
        {plan.price}
      </p>
      <p className="mt-3 text-sm text-[#64748B]">{plan.desc}</p>

      <Button
        nativeButton={false}
        render={isExternal ? <a href={href} /> : <Link href={href} />}
        className={planCtaClass}
      >
        {plan.cta}
        <ArrowUpRightIcon className="size-4" />
      </Button>

      <PlanFeatures features={plan.features} className="mt-8" />
    </article>
  )
}

function ProCard({ plan }: { plan: PricingPlan }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden lg:-mt-2 lg:mb-2",
        landingCard,
        "shadow-[0_32px_80px_rgba(15,23,42,0.1)]"
      )}
    >
      <div className="bg-[#F1F5F9] p-8 sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-(family-name:--font-display) text-xl font-semibold text-[#0F172A]">
            {plan.name}
          </h3>
          {plan.badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#0F172A] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
              <StarIcon className="size-3 fill-[#0F172A]" />
              {plan.badge}
            </span>
          )}
        </div>
        <p className="mt-4 font-(family-name:--font-display) text-5xl font-semibold text-[#0F172A]">
          {plan.price}
          <span className="text-lg font-medium text-[#64748B]">/mo</span>
        </p>
        <p className="mt-3 text-sm text-[#64748B]">{plan.desc}</p>

        <Button
          nativeButton={false}
          render={<Link href={planHref(plan)} />}
          className={planCtaClass}
        >
          {plan.cta}
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white">
            <ArrowUpRightIcon className="size-3.5" />
          </span>
        </Button>
      </div>

      <PlanFeatures features={plan.features} className="flex-1 p-8 sm:p-9" />
    </article>
  )
}

export function PricingSection() {
  const [starter, pro, ultimate] = PRICING_PLANS

  return (
    <section id="pricing" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={PRICING_SECTION.title}
            subtitle={PRICING_SECTION.subtitle}
          />
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:mt-16 lg:grid-cols-3 lg:items-center lg:gap-8">
          <ScrollReveal delay={0.08}>
            <SimplePlanCard plan={starter} />
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <ProCard plan={pro} />
          </ScrollReveal>

          <ScrollReveal delay={0.16}>
            <SimplePlanCard plan={ultimate} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
