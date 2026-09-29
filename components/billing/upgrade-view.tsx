"use client"

import * as React from "react"
import { useRouter } from "@/i18n/navigation"
import { Clock3Icon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { markPlanUpgradePendingRefresh } from "@/lib/api/auth"
import { BillingPageHeader } from "@/components/billing/billing-page-header"
import { BillingGlassPanel } from "@/components/billing/billing-glass"
import type { CryptoCheckoutRequest } from "@/components/billing/crypto-payment-sheet"
import { CryptoPaymentSheet } from "@/components/billing/crypto-payment-sheet"
import { UpgradePlanCard } from "@/components/billing/upgrade-plan-card"
import { Button } from "@/components/ui/button"
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
  landingGlassSheen,
  landingGlassSurface,
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

  const handleInvoicePaid = React.useCallback(async () => {
    if (paidHandledRef.current) return
    paidHandledRef.current = true

    if (checkout?.billing) {
      trackPurchase({
        billing: checkout.billing,
        ...(plusMonthlyUsd != null ? { value: plusMonthlyUsd } : {}),
      })
    }
    // Flag first so desk can mint a fresh JWT even if this refresh throws
    // (common after 100% coupons that skip the pending poll).
    markPlanUpgradePendingRefresh()
    try {
      await refreshAfterUpgrade()
    } catch {
      // ChatAside / AuthProvider consume the pending flag and retry.
    } finally {
      setPaymentOpen(false)
      router.push(APP_NEWS_PATH)
    }
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
      if (!isAuthenticated) return t("hintPlusGuest")
      return t.rich("hintPlusAuth", {
        price: plusPriceLabel,
        cadence,
        amount: (chunks) => (
          <span className="font-medium tabular-nums tracking-tight text-foreground">
            {chunks}
          </span>
        ),
      })
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
      className="landing-modern min-h-dvh bg-background font-sans text-foreground antialiased selection:bg-foreground/10 selection:text-foreground"
    >
      <div className={cn(landingShell, "relative z-10 pb-32 sm:pb-36")}>
        <BillingPageHeader
          isAuthenticated={isAuthenticated}
          user={user}
          page="upgrade"
        />

        <div className="mt-4 pt-1.5 pb-6 sm:mt-6 sm:py-8">
          <header className="mx-auto max-w-3xl text-center sm:text-start">
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {SITE_NAME}
            </p>
            <h1 className={cn(landingTitleSection, "mt-3")}>
              {t("heading")}
            </h1>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {t("subtitle")}
            </p>
          </header>

          <div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-8">
            {pendingInvoice && !isProUser ? (
              <button
                type="button"
                onClick={resumePendingCheckout}
                className="w-full text-start"
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
                      <span className="font-medium text-foreground tabular-nums">
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
              className="grid w-full gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-4"
            >
              {UPGRADE_PLANS.map((plan) => {
                const features = t.raw(
                  `plans.${plan.key}.features`
                ) as string[]
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
                      "badge" in plan && plan.badge
                        ? t("mostChosen")
                        : undefined
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
      </div>

      <CryptoPaymentSheet
        checkout={checkout}
        open={paymentOpen}
        onOpenChange={onPaymentOpenChange}
        onPaid={handleInvoicePaid}
      />

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4.5 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-3 lg:px-4">
        <div
          className={cn(
            landingGlassSurface,
            "pointer-events-auto mx-auto w-full max-w-5xl rounded-[1.75rem] bg-white/55 px-6 py-3.5 sm:px-7 dark:bg-white/10"
          )}
        >
          <span
            aria-hidden
            className={cn(landingGlassSheen, "rounded-[1.75rem]")}
          />
          <div className="relative z-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 px-0.5 text-[13px] leading-snug text-muted-foreground sm:px-1 sm:text-sm">
              {footerHint()}
            </p>
            <Button
              className={cn(
                landingCta("glass", "md"),
                "w-full shrink-0 sm:w-auto sm:min-w-44"
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
