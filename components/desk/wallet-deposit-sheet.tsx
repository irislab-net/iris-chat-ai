"use client"

import * as React from "react"
import { CheckCircle2Icon, DollarSignIcon, Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { PaymentMethodPicker } from "@/components/billing/payment-method-picker"
import {
  WalletLiquidField,
  walletFieldInputClass,
} from "@/components/desk/wallet-liquid-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  createMeDeposit,
  fetchMeStableRoutes,
  preferStableRoute,
  type MeDepositInvoice,
  type MeStableRoute,
} from "@/lib/api/wallet"
import { notifyDeskWalletChanged } from "@/lib/desk-events"
import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const NETWORKS = ["TRC20", "BEP20", "ERC20"] as const

function DepositWatchStatus({ confirming }: { confirming: boolean }) {
  const t = useTranslations("deskProfile")

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        landingGlassSurface,
        "relative flex items-center gap-3 rounded-2xl bg-white/55 px-3.5 py-3 dark:bg-white/10"
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
      <span
        className={cn(
          "relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          confirming
            ? "bg-[#2563EB]/15 text-[#1D4ED8] dark:bg-[#2563EB]/25 dark:text-[#93C5FD]"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        )}
        aria-hidden
      >
        <Loader2Icon className="size-4 animate-spin" />
      </span>
      <p className="relative z-10 min-w-0 text-[13px] font-semibold tracking-tight text-foreground">
        {confirming ? t("depositConfirming") : t("depositWaiting")}
      </p>
    </div>
  )
}

type WalletDepositSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DepositBody({
  onClose,
  footerClassName,
}: {
  onClose: () => void
  footerClassName?: string
}) {
  const t = useTranslations("deskProfile")
  const [currency, setCurrency] = React.useState<PaymentCurrency>("USDT")
  const [network, setNetwork] = React.useState<string>("TRC20")
  const [amount, setAmount] = React.useState("20")
  const [routes, setRoutes] = React.useState<MeStableRoute[]>([])
  const [invoice, setInvoice] = React.useState<MeDepositInvoice | null>(null)
  const [loadingRoutes, setLoadingRoutes] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const next = await fetchMeStableRoutes()
        if (cancelled) return
        setRoutes(next)
        const preferred = preferStableRoute(next, "USDT", "TRC20")
        if (preferred) setNetwork(preferred.network)
      } catch {
        if (!cancelled) setError(t("depositError"))
      } finally {
        if (!cancelled) setLoadingRoutes(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const availableNetworks = React.useMemo(() => {
    const set = new Set(
      routes
        .filter(
          (route) =>
            route.enabled && route.token.toUpperCase() === currency.toUpperCase()
        )
        .map((route) => route.network.toUpperCase())
    )
    return NETWORKS.filter((name) => set.has(name))
  }, [currency, routes])

  const activeNetwork =
    availableNetworks.length > 0 &&
    !availableNetworks.includes(network as (typeof NETWORKS)[number])
      ? availableNetworks[0]!
      : network

  const selectedRoute = preferStableRoute(routes, currency, activeNetwork)
  const amountNum = Number(amount)
  const canCreate =
    Boolean(selectedRoute) &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    !submitting

  async function onCreate() {
    if (!selectedRoute || !canCreate) return
    setSubmitting(true)
    setError(null)
    try {
      const next = await createMeDeposit({
        route: selectedRoute.code,
        amountUsd: amountNum,
      })
      setInvoice(next)
      notifyDeskWalletChanged()
    } catch (err) {
      const message =
        err && typeof err === "object" && "body" in err
          ? String(
              (err as { body?: { error?: string } }).body?.error ??
                t("depositError")
            )
          : t("depositError")
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirming =
    invoice?.status === "confirming" || invoice?.status === "confirming_chain"
  const credited =
    invoice?.status === "credited" ||
    invoice?.status === "settled" ||
    invoice?.status === "paid"

  return (
    <>
      <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-5")}>
        <div className="flex flex-col gap-4">
          {credited ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">{t("depositPaid")}</p>
            </div>
          ) : invoice ? (
            <>
              <DepositAddressCard
                address={invoice.address}
                currency={currency}
                compact
              />
              <p className="px-3 text-[12px] text-muted-foreground">
                {t("depositRouteHint", {
                  currency,
                  network: selectedRoute?.network ?? activeNetwork,
                  amount: amountNum.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }),
                })}
              </p>
              <DepositWatchStatus confirming={confirming} />
            </>
          ) : (
            <>
              <PaymentMethodPicker
                currency={currency}
                disabled={loadingRoutes || submitting}
                fullWidth
                onCurrencyChange={(next) => {
                  setCurrency(next)
                  setError(null)
                }}
              />

              <div>
                <p
                  className={cn(
                    chatMobileSheetSectionLabelClass,
                    "mb-2 block px-3"
                  )}
                >
                  {t("depositNetwork")}
                </p>
                <div className="flex flex-wrap gap-2 px-3">
                  {(availableNetworks.length
                    ? availableNetworks
                    : [...NETWORKS]
                  ).map((name) => {
                    const active = activeNetwork === name
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={loadingRoutes || submitting}
                        onClick={() => setNetwork(name)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                          active
                            ? "bg-[#2563EB] text-white"
                            : "bg-white/55 text-foreground/70 dark:bg-white/10"
                        )}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label
                  className={cn(
                    chatMobileSheetSectionLabelClass,
                    "mb-2 block px-3"
                  )}
                  htmlFor="desk-deposit-amount"
                >
                  {t("depositAmount")}
                </label>
                <WalletLiquidField className="flex items-center ps-3 pe-1.5">
                  <DollarSignIcon
                    className="relative z-10 size-4 shrink-0 stroke-[1.75] text-foreground/35"
                    aria-hidden
                  />
                  <Input
                    id="desk-deposit-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    value={amount}
                    disabled={loadingRoutes || submitting}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(
                      walletFieldInputClass,
                      "ps-2 pe-3 text-[16px]! max-md:text-[16px]!"
                    )}
                  />
                </WalletLiquidField>
              </div>

              {loadingRoutes ? (
                <div className="flex justify-center py-6">
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : null}
            </>
          )}

          {error ? (
            <p className="px-3 text-[12px] text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
        <div className={cn(chatMobileSheetFooterBarClass, "pt-3 pb-0")}>
          {credited || invoice ? (
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={onClose}
            >
              {t("done")}
            </Button>
          ) : (
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              disabled={!canCreate || loadingRoutes}
              onClick={() => void onCreate()}
            >
              {submitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("depositCreating")}
                </>
              ) : (
                t("depositCreate")
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

function WalletDepositSheet({ open, onOpenChange }: WalletDepositSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()
  const title = t("depositTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,40rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("depositIntro")}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <DepositBody
              onClose={() => onOpenChange(false)}
              footerClassName="pb-2"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={chatMobileSheetCompactContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 pe-5")}>
          <div className="flex items-center gap-2">
            <SheetTitle className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}>
              {title}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={() => onOpenChange(false)} />
          </div>
          <SheetDescription className="sr-only">
            {t("depositIntro")}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <DepositBody onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { WalletDepositSheet }
