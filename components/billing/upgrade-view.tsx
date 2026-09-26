"use client"

import * as React from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { Clock3Icon, XIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { markPlanUpgradePendingRefresh } from "@/lib/api/auth"
import { AnimatedExurLogo } from "@/components/brand/animated-exur-logo"
import { BillingGlassPanel } from "@/components/billing/billing-glass"
import type { CryptoCheckoutRequest } from "@/components/billing/crypto-payment-sheet"
import { CryptoPaymentSheet } from "@/components/billing/crypto-payment-sheet"
import { UpgradePlanCard } from "@/components/billing/upgrade-plan-card"
import { plusJakarta } from "@/components/landing/modern/fonts"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  UPGRADE_PLANS,
  displayPlanName,
  type BillingCycle,
  type PlanKey,
} from "@/lib/billing/catalog"
import { usePaymentPlans } from "@/hooks/use-payment-plans"
import {
  formatCountdown,
  formatCryptoAmount,
} from "@/lib/billing/crypto-format"
import {
  billingCycleForInvoice,
  invoiceMsRemaining,
  paymentCurrencyForInvoice,
} from "@/lib/billing/invoice-session"
import { useNow } from "@/hooks/use-now"
import { usePendingPaymentInvoice } from "@/hooks/use-pending-payment-invoice"
import { APP_NEWS_PATH, SITE_NAME, SOCIAL_X_URL } from "@/lib/site"
import {
  trackCheckoutStart,
  trackContactClick,
  trackPurchase,
  trackUpgradePlanSelect,
  trackUpgradeView,
} from "@/lib/analytics"
import { localeDirection } from "@/lib/i18n/locale"
import {
  landingCta,
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
  landingHeroGlass,
  landingInner,
  landingShell,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

import "@/app/styles/landing-modern.css"

function isCurrentPlan(
  plan: PlanKey,
  current: ReturnType<typeof displayPlanName>
) {
  if (plan === "plus") return current === "Plus"
  if (plan === "ultimate") return current === "Ultimate"
  return current === "Free"
}

function UpgradeView() {
  const t = useTranslations("upgradePage")
  const locale = useLocale()
  const dir = localeDirection(locale)
  const isRtl = dir === "rtl"
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isProUser,
    login,
    loginPending,
    refreshAfterUpgrade,
  } = useAuth()
  // Annual billing is temporarily disabled in the UI.
  const billing: BillingCycle = "monthly"
  const [selected, setSelected] = React.useState<PlanKey>("plus")
  const [checkout, setCheckout] = React.useState<CryptoCheckoutRequest | null>(
    null
  )
  const [paymentOpen, setPaymentOpen] = React.useState(false)
  const {
    plusMonthlyDisplay,
    plusMonthlyUsd,
    loading: pricesLoading,
  } = usePaymentPlans()

  React.useEffect(() => {
    trackUpgradeView()
  }, [])

  const currentPlan = displayPlanName(user?.tier)
  const cadence = t("cadence")
  const canTrackPendingPayment = isAuthenticated && !isProUser

  const paidHandledRef = React.useRef(false)

  const displayFont = isRtl
    ? '"IRIS Sans"'
    : (plusJakarta.style.fontFamily.split(",")[0]?.trim() ??
      '"Plus Jakarta Sans"')
  const fontVariables = isRtl ? undefined : plusJakarta.variable

  const handleInvoicePaid = React.useCallback(async () => {
    if (paidHandledRef.current) return
    paidHandledRef.current = true

    if (checkout?.billing) {
      trackPurchase({
        billing: checkout.billing,
        ...(plusMonthlyUsd != null ? { value: plusMonthlyUsd } : {}),
      })
    }
    markPlanUpgradePendingRefresh()
    await refreshAfterUpgrade()
    setPaymentOpen(false)
    router.push(APP_NEWS_PATH)
  }, [checkout, plusMonthlyUsd, refreshAfterUpgrade, router])

  const pendingInvoice = usePendingPaymentInvoice({
    enabled: canTrackPendingPayment,
    onPaid: handleInvoicePaid,
  })
  const now = useNow(canTrackPendingPayment)
  const pendingMsRemaining = pendingInvoice
    ? invoiceMsRemaining(pendingInvoice, now)
    : 0

  function beginPlusCheckout(cycle: BillingCycle) {
    trackCheckoutStart({
      billing: cycle,
      ...(plusMonthlyUsd != null ? { value: plusMonthlyUsd } : {}),
    })
    setCheckout({ billing: cycle })
    setPaymentOpen(true)
  }

  function resumePendingCheckout() {
    if (!pendingInvoice) return
    const cycle = billingCycleForInvoice(pendingInvoice) ?? "monthly"
    setSelected("plus")
    beginPlusCheckout(cycle)
  }

  const onPaymentOpenChange = React.useCallback((nextOpen: boolean) => {
    setPaymentOpen(nextOpen)
  }, [])

  async function onContinue() {
    if (selected === "free") {
      router.push(APP_NEWS_PATH)
      return
    }

    if (selected === "ultimate") {
      if (currentPlan === "Ultimate") {
        router.push(APP_NEWS_PATH)
        return
      }
      trackContactClick("x")
      window.open(SOCIAL_X_URL, "_blank", "noopener,noreferrer")
      return
    }

    if (currentPlan === "Plus" || isProUser) {
      router.push(APP_NEWS_PATH)
      return
    }

    if (!isAuthenticated) {
      login({ source: "upgrade" })
      return
    }

    beginPlusCheckout(billing)
  }

  const plusLocked = selected === "plus" && isProUser
  const busy = loginPending
  const hasPendingPayment = Boolean(pendingInvoice)
  const pendingAmountLabel = pendingInvoice
    ? formatCryptoAmount(
        pendingInvoice.amount_crypto,
        paymentCurrencyForInvoice(pendingInvoice)
      )
    : ""
  const plusPriceLabel = plusMonthlyDisplay ?? (pricesLoading ? "…" : "—")

  function continueLabel(plan: PlanKey) {
    if (plan === "free") {
      return currentPlan === "Free" ? t("continueFree") : t("backToDeskCta")
    }
    if (plan === "plus") {
      return plusLocked ? t("currentPlanCta") : t("payWithCrypto")
    }
    return currentPlan === "Ultimate" ? t("currentPlanCta") : t("contactUs")
  }

  function footerHint() {
    if (selected === "plus" && hasPendingPayment) {
      return t("hintPending", { time: formatCountdown(pendingMsRemaining) })
    }
    if (selected === "plus") {
      return isAuthenticated
        ? t("hintPlusAuth", { price: plusPriceLabel, cadence })
        : t("hintPlusGuest")
    }
    if (selected === "ultimate") {
      return t("hintUltimate")
    }
    return t("hintFree")
  }

  const cta =
    selected === "plus" && hasPendingPayment
      ? t("finishPayment")
      : continueLabel(selected)

  function planPrice(key: PlanKey) {
    if (key === "free") return "$0"
    if (key === "ultimate") return t("customPrice")
    return plusPriceLabel
  }

  return (
    <div
      dir={dir}
      className={cn(
        fontVariables,
        "landing-modern flex min-h-dvh flex-col bg-background text-foreground antialiased selection:bg-foreground/10 selection:text-foreground",
        isRtl ? "font-sans" : null
      )}
      style={{
        ["--font-display" as string]: displayFont,
        ...(isRtl
          ? {}
          : {
              ["--font-sans" as string]: displayFont,
              fontFamily: `var(--font-display), ${displayFont}, ui-sans-serif, system-ui, sans-serif`,
            }),
      }}
    >
      <div className={cn(landingShell, "relative z-10 flex flex-1 flex-col pb-28 sm:pb-32")}>
        <header className="mt-3 flex items-center gap-3 sm:mt-5">
          <div
            className={cn(
              landingGlassSurface,
              "flex min-w-0 flex-1 items-center gap-3 rounded-full bg-white/44 px-3 py-2.5 dark:bg-white/10 sm:px-4"
            )}
          >
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            <AnimatedExurLogo
              className="relative z-10 size-9 shrink-0"
              scrollTrigger
            />
            <div className="relative z-10 min-w-0 flex-1">
              <p className="text-sm font-medium leading-none tracking-tight">
                {t("title")}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t("currentPlanLine", { plan: currentPlan })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(landingGlassNavIcon, "text-foreground")}
            nativeButton={false}
            render={<Link href={APP_NEWS_PATH} aria-label={t("backToDesk")} />}
          >
            <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
            <XIcon className="relative z-10 size-4" />
          </Button>
        </header>

        <article
          className={cn(
            landingHeroGlass,
            "mt-6 min-h-0 flex-1 rounded-[2rem] sm:rounded-[2.5rem]"
          )}
        >
          <div className={cn(landingInner, "py-10 sm:py-12 lg:py-14")}>
            <header className="mx-auto max-w-3xl text-center sm:text-start">
              <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {SITE_NAME}
              </p>
              <h1 className={cn(landingTitleSection, "mt-3")}>{t("heading")}</h1>
              <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
                {t("subtitle")}
              </p>
            </header>

            <Separator className="mx-auto my-8 max-w-3xl bg-foreground/8 sm:my-10" />

            <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
              {pendingInvoice && !isProUser ? (
                <button
                  type="button"
                  onClick={resumePendingCheckout}
                  className="w-full max-w-3xl text-start"
                >
                  <BillingGlassPanel className="bg-white/50 transition-colors hover:bg-white/58 dark:bg-white/10 dark:hover:bg-white/14">
                    <div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t("pendingTitle")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("pendingBody", { amount: pendingAmountLabel })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3Icon className="size-3.5" />
                        <span className="font-medium tabular-nums text-foreground">
                          {formatCountdown(pendingMsRemaining)}
                        </span>
                      </div>
                    </div>
                  </BillingGlassPanel>
                </button>
              ) : null}

              <div
                role="radiogroup"
                aria-label={t("plansAria")}
                className={cn(
                  "grid w-full gap-4 lg:grid-cols-3 lg:items-stretch",
                  pendingInvoice && !isProUser ? "mt-8" : "mt-0"
                )}
              >
                {UPGRADE_PLANS.map((plan) => {
                  const features = t.raw(`plans.${plan.key}.features`) as string[]
                  return (
                    <UpgradePlanCard
                      key={plan.key}
                      planKey={plan.key}
                      name={t(`plans.${plan.key}.name`)}
                      description={t(`plans.${plan.key}.description`)}
                      price={planPrice(plan.key)}
                      cadence={cadence}
                      features={features}
                      selected={selected === plan.key}
                      isCurrent={isCurrentPlan(plan.key, currentPlan)}
                      currentLabel={t("currentBadge")}
                      badge={
                        "badge" in plan && plan.badge ? t("mostChosen") : undefined
                      }
                      featured={"featured" in plan ? plan.featured : undefined}
                      onSelect={() => {
                        if (selected !== plan.key) {
                          trackUpgradePlanSelect({ plan: plan.key })
                        }
                        setSelected(plan.key)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </article>
      </div>

      <CryptoPaymentSheet
        checkout={checkout}
        open={paymentOpen}
        onOpenChange={onPaymentOpenChange}
        onPaid={handleInvoicePaid}
      />

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-4 sm:px-6">
        <div
          className={cn(
            landingGlassSurface,
            "pointer-events-auto mx-auto w-full max-w-5xl rounded-[1.75rem] bg-white/55 px-4 py-3.5 dark:bg-white/10 sm:px-5"
          )}
        >
          <span
            aria-hidden
            className={cn(landingGlassSheen, "rounded-[1.75rem]")}
          />
          <div className="relative z-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{footerHint()}</p>
            <Button
              className={cn(
                landingCta("glass", "md"),
                "w-full sm:w-auto sm:min-w-44"
              )}
              disabled={busy || plusLocked}
              onClick={() => {
                if (selected === "plus" && hasPendingPayment) {
                  resumePendingCheckout()
                  return
                }
                void onContinue()
              }}
            >
              {busy ? t("continuing") : cta}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { UpgradeView }
