"use client"

import { ArrowUpRightIcon, CheckIcon, StarIcon } from "lucide-react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { PRICING_PLANS, type PricingPlan } from "@/lib/landing-modern-data"
import { landingCard, landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@irislab.info"

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
      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#0F172A]">
        {plan.name}
      </h3>
      <p className="mt-4 font-[family-name:var(--font-display)] text-5xl font-semibold text-[#0F172A]">
        {plan.price}
      </p>
      <p className="mt-3 text-sm text-[#64748B]">{plan.desc}</p>

      <Button
        nativeButton={false}
        render={isExternal ? <a href={href} /> : <Link href={href} />}
        className="mt-6 h-auto w-full justify-between rounded-full bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1E293B]"
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
        "shadow-[0_30px_80px_rgba(37,99,235,0.18)]"
      )}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#67E8F9] p-8 text-white sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.25),transparent_55%)]"
        />
        <div className="relative flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">{plan.name}</h3>
          {plan.badge && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/35 px-2.5 py-1 text-xs font-medium">
              <StarIcon className="size-3 fill-white" />
              {plan.badge}
            </span>
          )}
        </div>
        <p className="relative mt-4 font-[family-name:var(--font-display)] text-5xl font-semibold">
          {plan.price}
          <span className="text-lg font-medium text-white/75">/mo</span>
        </p>
        <p className="relative mt-3 text-sm text-white/85">{plan.desc}</p>

        <Button
          nativeButton={false}
          render={<Link href={planHref(plan)} />}
          className="relative mt-6 h-auto w-full justify-between rounded-full border border-white/30 bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/25"
        >
          {plan.cta}
          <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#2563EB]">
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
            badge="Pricing"
            title="Pricing that grows with you"
            subtitle="Whether you're watching markets or running a desk, Exur scales from free intelligence to full co-pilot depth."
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
