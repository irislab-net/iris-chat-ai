"use client"

import * as React from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { Clock3Icon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { markPlanUpgradePendingRefresh } from "@/lib/api/auth"
import { ExurLogo } from "@/components/brand/exur-logo"
import type { CryptoCheckoutRequest } from "@/components/billing/crypto-payment-sheet"
import { CryptoPaymentSheet } from "@/components/billing/crypto-payment-sheet"
import { UpgradePlanCard } from "@/components/billing/upgrade-plan-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BILLING_PRICES,
  UPGRADE_PLANS,
  displayPlanName,
  type BillingCycle,
  type PlanKey,
} from "@/lib/billing/catalog"
import { parsePriceAmount } from "@/lib/billing/prices"
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
import { APP_NEWS_PATH, SOCIAL_X_URL } from "@/lib/site"
import { chatMobileSheetFooterBarClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  trackCheckoutStart,
  trackContactClick,
  trackPurchase,
  trackUpgradePlanSelect,
  trackUpgradeView,
} from "@/lib/analytics"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const {
    user,
    isAuthenticated,
    isProUser,
    login,
    loginPending,
    refreshAfterUpgrade,
  } = useAuth()
  const [billing, setBilling] = React.useState<BillingCycle>("monthly")
  const [selected, setSelected] = React.useState<PlanKey>("plus")
  const [checkout, setCheckout] = React.useState<CryptoCheckoutRequest | null>(
    null
  )
  const [paymentOpen, setPaymentOpen] = React.useState(false)

  React.useEffect(() => {
    trackUpgradeView()
  }, [])

  const currentPlan = displayPlanName(user?.tier)
  const prices = BILLING_PRICES[billing]
  const cadence = t("cadence")
  const canTrackPendingPayment = isAuthenticated && !isProUser

  const paidHandledRef = React.useRef(false)

  const handleInvoicePaid = React.useCallback(async () => {
    if (paidHandledRef.current) return
    paidHandledRef.current = true

    if (checkout?.billing) {
      trackPurchase({ billing: checkout.billing })
    }
    markPlanUpgradePendingRefresh()
    await refreshAfterUpgrade()
    setPaymentOpen(false)
    router.push(APP_NEWS_PATH)
  }, [checkout, refreshAfterUpgrade, router])

  const pendingInvoice = usePendingPaymentInvoice({
    enabled: canTrackPendingPayment,
    onPaid: handleInvoicePaid,
  })
  const now = useNow(canTrackPendingPayment)
  const pendingMsRemaining = pendingInvoice
    ? invoiceMsRemaining(pendingInvoice, now)
    : 0

  function beginPlusCheckout(cycle: BillingCycle) {
    trackCheckoutStart({ billing: cycle })
    setCheckout({ billing: cycle })
    setPaymentOpen(true)
  }

  function resumePendingCheckout() {
    if (!pendingInvoice) return
    const cycle = billingCycleForInvoice(pendingInvoice)
    if (!cycle) return
    setBilling(cycle)
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
        ? t("hintPlusAuth", { price: prices.plus, cadence })
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
    const raw = prices[key]
    if (key === "ultimate" && parsePriceAmount(raw) === null) {
      return t("customPrice")
    }
    return raw
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4 sm:px-6">
        <ExurLogo alt="Exur" size={32} className="size-8 rounded-full" priority />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none">{t("title")}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t("currentPlanLine", { plan: currentPlan })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={<Link href={APP_NEWS_PATH} aria-label={t("backToDesk")} />}
        >
          <XIcon />
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <Tabs
          value={billing}
          onValueChange={(value) => setBilling(value as BillingCycle)}
          className="mt-8 items-center"
        >
          <TabsList className="h-11 rounded-full p-1.5 group-data-horizontal/tabs:h-11">
            <TabsTrigger value="monthly" className="h-8 rounded-full px-5 text-sm">
              {t("monthly")}
            </TabsTrigger>
            <TabsTrigger value="annual" className="h-8 rounded-full px-5 text-sm">
              {t("annual")}
              <span className="text-muted-foreground">{t("annualSave")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {pendingInvoice && !isProUser ? (
          <button
            type="button"
            onClick={resumePendingCheckout}
            className="mt-6 w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-start transition-colors hover:bg-primary/10"
          >
            <div className="flex items-start justify-between gap-3">
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
          </button>
        ) : null}

        <div
          role="radiogroup"
          aria-label={t("plansAria")}
          className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-start"
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
      </main>

      <CryptoPaymentSheet
        checkout={checkout}
        open={paymentOpen}
        onOpenChange={onPaymentOpenChange}
        onPaid={handleInvoicePaid}
      />

      <footer
        className={cn(
          "sticky bottom-0 px-4 py-4 sm:px-6",
          isDesktop
            ? "border-t border-border/60 bg-background/95 backdrop-blur-sm"
            : cn(
                chatMobileSheetFooterBarClass,
                "border-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-4"
              )
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </footer>
    </div>
  )
}

export { UpgradeView }
