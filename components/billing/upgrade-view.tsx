"use client"

import * as React from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { Clock3Icon, XIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { markPlanUpgradePendingRefresh } from "@/lib/api/auth"
import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
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
import { chatMobileSheetFooterBarClass, chatMobileSheetPrimaryButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  trackCheckoutStart,
  trackContactClick,
  trackPurchase,
  trackUpgradePlanSelect,
  trackUpgradeView,
} from "@/lib/analytics"
import { cn } from "@/lib/utils"

function continueLabel(
  plan: PlanKey,
  current: ReturnType<typeof displayPlanName>,
  plusLocked: boolean
) {
  if (plan === "free") {
    return current === "Free" ? "Continue with Free" : "Back to desk"
  }
  if (plan === "plus") {
    return plusLocked ? "Current plan" : "Pay with crypto"
  }
  return current === "Ultimate" ? "Current plan" : "Contact us"
}

function isCurrentPlan(plan: PlanKey, current: ReturnType<typeof displayPlanName>) {
  if (plan === "plus") return current === "Plus"
  if (plan === "ultimate") return current === "Ultimate"
  return current === "Free"
}

function footerHint({
  selected,
  hasPendingPayment,
  pendingMsRemaining,
  isAuthenticated,
  prices,
}: {
  selected: PlanKey
  hasPendingPayment: boolean
  pendingMsRemaining: number
  isAuthenticated: boolean
  prices: (typeof BILLING_PRICES)[BillingCycle]
}) {
  if (selected === "plus" && hasPendingPayment) {
    return `Finish your payment · ${formatCountdown(pendingMsRemaining)} left`
  }
  if (selected === "plus") {
    return isAuthenticated
      ? `${prices.plus}${prices.cadence} · USDT or USDC on Ethereum`
      : "Sign in to continue to payment"
  }
  if (selected === "ultimate") {
    return "We’ll set Ultimate up with you on X"
  }
  return "No charge on Free"
}

function UpgradeView() {
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
  const cta =
    selected === "plus" && hasPendingPayment
      ? "Finish payment"
      : continueLabel(selected, currentPlan, plusLocked)

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4 sm:px-6">
        <IrisLabLogo alt="Exur" size={32} className="size-8 rounded-full" priority />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none">Upgrade</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Current plan: {currentPlan}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={<Link href={APP_NEWS_PATH} aria-label="Back to desk" />}
        >
          <XIcon />
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Choose a plan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start free, or upgrade to Plus for the full desk. Pay with crypto in
            a few simple steps.
          </p>
        </div>

        <Tabs
          value={billing}
          onValueChange={(value) => setBilling(value as BillingCycle)}
          className="mt-8 items-center"
        >
          <TabsList className="h-11 rounded-full p-1.5 group-data-horizontal/tabs:h-11">
            <TabsTrigger value="monthly" className="h-8 rounded-full px-5 text-sm">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="annual" className="h-8 rounded-full px-5 text-sm">
              Annual
              <span className="text-muted-foreground">Save 17%</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {pendingInvoice && !isProUser ? (
          <button
            type="button"
            onClick={resumePendingCheckout}
            className="mt-6 w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-left transition-colors hover:bg-primary/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">You have a payment in progress</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send {pendingAmountLabel} to finish upgrading to Plus.
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
          aria-label="Plans"
          className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-start"
        >
          {UPGRADE_PLANS.map((plan) => (
            <UpgradePlanCard
              key={plan.key}
              planKey={plan.key}
              name={plan.name}
              description={plan.description}
              price={prices[plan.key]}
              cadence={prices.cadence}
              features={plan.features}
              selected={selected === plan.key}
              isCurrent={isCurrentPlan(plan.key, currentPlan)}
              badge={"badge" in plan ? plan.badge : undefined}
              featured={"featured" in plan ? plan.featured : undefined}
              onSelect={() => {
                if (selected !== plan.key) {
                  trackUpgradePlanSelect({ plan: plan.key })
                }
                setSelected(plan.key)
              }}
            />
          ))}
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
          <p className="text-sm text-muted-foreground">
            {footerHint({
              selected,
              hasPendingPayment,
              pendingMsRemaining,
              isAuthenticated,
              prices,
            })}
          </p>
          <Button
            size="lg"
            className={cn(
              "h-11 px-8",
              isDesktop ? "rounded-xl" : cn(chatMobileSheetPrimaryButtonClass, "h-12")
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
            {busy ? "Continuing…" : cta}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export { UpgradeView }
