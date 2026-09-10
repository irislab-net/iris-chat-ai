"use client"

import * as React from "react"
import { CheckIcon, CrownIcon, RadarIcon, SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Link } from "@/i18n/navigation"
import {
  LANDING_CONTAINER_WIDE,
  LANDING_SECTION_CONTENT_MT,
  LANDING_SECTION_PY,
  LANDING_SECTION_TITLE,
} from "@/lib/landing-layout"
import { APP_NEWS_PATH, SOCIAL_X_URL, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const BILLING = {
  monthly: {
    free: "$0",
    plus: "$49",
    ultimate: "Custom",
  },
  annual: {
    free: "$0",
    plus: "$41",
    ultimate: "Custom",
  },
} as const

const PLAN_META = [
  { key: "free" as const, icon: RadarIcon, href: APP_NEWS_PATH },
  {
    key: "plus" as const,
    icon: SparklesIcon,
    href: UPGRADE_PATH,
    featured: true,
    badge: true,
  },
  { key: "ultimate" as const, icon: CrownIcon, href: SOCIAL_X_URL, external: true },
]

type BillingCycle = keyof typeof BILLING

export function LandingPricing() {
  const t = useTranslations("landing.pricing")
  const [billing, setBilling] = React.useState<BillingCycle>("monthly")

  const plans = PLAN_META.map((plan) => ({
    ...plan,
    name: t(`plans.${plan.key}Name`),
    eyebrow: t(`plans.${plan.key}Eyebrow`),
    description: t(`plans.${plan.key}Description`),
    features: t.raw(`plans.${plan.key}Features`) as string[],
    cta: t(`plans.${plan.key}Cta`),
  }))

  return (
    <section
      id="pricing"
      aria-labelledby="landing-pricing-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <ScrollReveal className={LANDING_CONTAINER_WIDE}>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full px-3">
            {t("badge")}
          </Badge>
          <h2
            id="landing-pricing-heading"
            className={cn("mt-4", LANDING_SECTION_TITLE)}
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:mt-4 md:text-base">
            {t("subtitle")}
          </p>
        </div>

        <Tabs
          value={billing}
          onValueChange={(value) => setBilling(value as BillingCycle)}
          className={cn("w-full", LANDING_SECTION_CONTENT_MT)}
        >
          <TabsList
            data-reveal
            className="mx-auto h-11 rounded-full p-1.5 group-data-horizontal/tabs:h-11"
          >
            <TabsTrigger value="monthly" className="h-8 rounded-full px-5 text-sm">
              {t("monthly")}
            </TabsTrigger>
            <TabsTrigger value="annual" className="h-8 rounded-full px-5 text-sm">
              {t("annual")}
              <span className="text-muted-foreground">{t("annualSave")}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-16 grid w-full gap-6 md:mt-20 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon
              const price = BILLING[billing][plan.key]

              return (
                <TabsPriceCard
                  key={plan.key}
                  billingKey={plan.key}
                  name={plan.name}
                  eyebrow={plan.eyebrow}
                  description={plan.description}
                  price={price}
                  cadence={t("perMonth")}
                  customLabel={t("custom")}
                  icon={<Icon className="size-4" strokeWidth={1.75} />}
                  features={plan.features}
                  cta={plan.cta}
                  href={plan.href}
                  external={plan.external}
                  featured={plan.featured}
                  badge={plan.badge ? t("mostChosen") : undefined}
                />
              )
            })}
          </div>
        </Tabs>
      </ScrollReveal>
    </section>
  )
}

function TabsPriceCard({
  billingKey,
  name,
  eyebrow,
  description,
  price,
  cadence,
  customLabel,
  icon,
  features,
  cta,
  href,
  external,
  featured,
  badge,
}: {
  billingKey: "free" | "plus" | "ultimate"
  name: string
  eyebrow: string
  description: string
  price: string
  cadence: string
  customLabel: string
  icon: React.ReactNode
  features: readonly string[]
  cta: string
  href: string
  external?: boolean
  featured?: boolean
  badge?: string
}) {
  return (
    <div data-reveal className="relative h-full">
      {badge ? (
        <div className="absolute inset-x-0 -top-3 z-20 flex justify-center">
          <Badge className="rounded-full px-3 shadow-sm">{badge}</Badge>
        </div>
      ) : null}

      <Card
        className={cn(
          "h-full border-border/70 bg-card/80 py-0 backdrop-blur-sm",
          featured &&
            "border-foreground/80 bg-muted/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_28px_80px_-42px_rgba(255,255,255,0.35)]"
        )}
      >
        <CardHeader className="gap-4 border-b border-border/60 pt-7 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {eyebrow}
              </p>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {name}
              </CardTitle>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground">
              {icon}
            </div>
          </div>
          <CardDescription className="min-h-10 text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-6 pt-6 pb-6">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              {price === "Custom" ? customLabel : price}
            </span>
            {price === "Custom" ? null : (
              <span className="pb-1 text-sm text-muted-foreground">{cadence}</span>
            )}
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={`${billingKey}-${feature}`} className="flex gap-3">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-foreground">
                  <CheckIcon className="size-3" strokeWidth={2.25} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-auto border-t border-border/60 bg-transparent p-5">
          <Button
            size="lg"
            variant={featured ? "default" : "outline"}
            className="h-11 w-full rounded-xl text-sm"
            nativeButton={false}
            render={
              external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" />
              ) : (
                <Link href={href} />
              )
            }
          >
            {cta}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
