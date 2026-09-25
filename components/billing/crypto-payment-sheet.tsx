"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, LoaderCircleIcon, TimerIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { BillingGlassPanel } from "@/components/billing/billing-glass"
import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { PaymentMethodPicker } from "@/components/billing/payment-method-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useNow } from "@/hooks/use-now"
import { useIsDesktop } from "@/hooks/use-media-query"
import type { BillingCycle } from "@/lib/billing/catalog"
import {
  formatCountdown,
  formatCryptoAmount,
  formatUsd,
} from "@/lib/billing/crypto-format"
import type { PaymentCurrency, PaymentInvoice } from "@/lib/billing/invoice-types"
import { isPaymentCurrency } from "@/lib/billing/invoice-types"
import { fetchPaymentInvoice, resolvePlusCryptoCheckout } from "@/lib/billing/invoices"
import {
  isInvoiceExpired,
  invoiceMsRemaining,
  paymentCurrencyForInvoice,
} from "@/lib/billing/invoice-session"
import {
  landingCta,
  landingGlassSheen,
  landingGlassSurface,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

import "@/app/styles/landing-modern.css"

const POLL_MS = 5_000

export type CryptoCheckoutRequest = {
  billing: BillingCycle
}

type CryptoPaymentSheetProps = {
  checkout: CryptoCheckoutRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid: () => void | Promise<void>
}

function PaymentQuoteSkeleton() {
  return (
    <div className="space-y-4">
      <BillingGlassPanel>
        <div className="px-3.5 py-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="mt-1.5 h-7 w-40 rounded-md" />
          <Skeleton className="mt-1.5 h-3.5 w-28 rounded-full" />
        </div>
      </BillingGlassPanel>
      <BillingGlassPanel>
        <div className="flex justify-center border-b border-white/55 px-4 py-5 dark:border-white/10">
          <Skeleton className="size-40 rounded-xl" />
        </div>
        <div className="space-y-3 p-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </BillingGlassPanel>
    </div>
  )
}

function PaymentWatcherBanner({
  expiresIn,
  compact,
}: {
  expiresIn: string
  compact?: boolean
}) {
  const t = useTranslations("upgradePage.crypto")

  return (
    <div role="status" aria-live="polite">
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2563EB]/50 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#2563EB]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
            {t("watchingTitle")}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-muted-foreground">{t("watchingBody")}</p>
          ) : null}
          <div
            className={cn(
              "flex items-center justify-between gap-2 text-muted-foreground",
              compact ? "mt-1 text-[11px]" : "mt-2 h-4 text-xs"
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-1">
              <TimerIcon className="size-3 shrink-0" />
              <span className="truncate">
                {compact ? null : t("timeLeft")}
                <span className="font-medium tabular-nums text-foreground">
                  {expiresIn}
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <LoaderCircleIcon className="size-3 shrink-0 animate-spin opacity-60" />
              <span>{compact ? t("checkingShort") : t("checking")}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyAmountButton({ value }: { value: string }) {
  const t = useTranslations("upgradePage.crypto")
  const [copied, setCopied] = React.useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value.split(" ")[0] ?? value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      className={cn(landingCta("secondary", "sm"), "size-8 shrink-0 px-0")}
      onClick={() => void onCopy()}
      aria-label={copied ? t("copied") : t("copyAmount")}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </Button>
  )
}

export function CryptoPaymentSheet({
  checkout,
  open,
  onOpenChange,
  onPaid,
}: CryptoPaymentSheetProps) {
  const t = useTranslations("upgradePage.crypto")
  const isDesktop = useIsDesktop()
  const [currency, setCurrency] = React.useState<PaymentCurrency>("USDT")
  const [couponCode, setCouponCode] = React.useState(
    () => process.env.NEXT_PUBLIC_BILLING_COUPON_CODE?.trim() ?? ""
  )
  const [invoice, setInvoice] = React.useState<PaymentInvoice | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const now = useNow(open)
  const defaultCoupon = process.env.NEXT_PUBLIC_BILLING_COUPON_CODE?.trim() ?? ""
  const [couponOpen, setCouponOpen] = React.useState(Boolean(defaultCoupon))

  const loadInvoice = React.useCallback(
    async (
      request: CryptoCheckoutRequest,
      nextCurrency: PaymentCurrency,
      nextCouponCode: string
    ) => {
      setLoading(true)
      setError(null)
      try {
        const resolved = await resolvePlusCryptoCheckout({
          billing: request.billing,
          couponCode: nextCouponCode.trim() || undefined,
          currency: nextCurrency,
        })
        setInvoice(resolved)
        setCurrency(paymentCurrencyForInvoice(resolved, nextCurrency))
        if (resolved.coupon_code?.trim()) {
          setCouponCode(resolved.coupon_code.trim())
          setCouponOpen(true)
        }
        return resolved
      } catch (caught) {
        setInvoice(null)
        setError(
          caught instanceof Error ? caught.message : t("createInvoiceError")
        )
        return null
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCurrency("USDT")
        setCouponCode(defaultCoupon)
        setCouponOpen(Boolean(defaultCoupon))
        setInvoice(null)
        setError(null)
        setLoading(false)
      }
      onOpenChange(nextOpen)
    },
    [defaultCoupon, onOpenChange]
  )

  const handleCurrencyChange = React.useCallback(
    (nextCurrency: PaymentCurrency) => {
      if (!checkout) return
      void loadInvoice(checkout, nextCurrency, couponCode)
    },
    [checkout, couponCode, loadInvoice]
  )

  const handleApplyCoupon = React.useCallback(() => {
    if (!checkout) return
    void loadInvoice(checkout, currency, couponCode)
  }, [checkout, couponCode, currency, loadInvoice])

  const checkoutBilling = checkout?.billing ?? null
  const invoiceUid = invoice?.uid ?? null

  React.useEffect(() => {
    if (!open || !checkout || !checkoutBilling) return

    let cancelled = false

    void Promise.resolve().then(() => {
      if (cancelled) return
      return loadInvoice(checkout, "USDT", defaultCoupon)
    })

    return () => {
      cancelled = true
    }
  }, [open, checkoutBilling, checkout, defaultCoupon, loadInvoice])

  React.useEffect(() => {
    if (!open || !invoiceUid || invoice?.status !== "pending") return

    let cancelled = false

    const check = () => {
      if (cancelled) return
      void fetchPaymentInvoice(invoiceUid)
        .then((next) => {
          if (cancelled || !next) return
          setInvoice((current) => {
            if (
              current?.uid === next.uid &&
              current.status === next.status &&
              current.updated_at === next.updated_at
            ) {
              return current
            }
            return next
          })
          if (next.status === "paid") void Promise.resolve(onPaid())
        })
        .catch(() => {
          // keep polling through transient failures
        })
    }

    check()
    const poll = window.setInterval(check, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [open, invoiceUid, invoice?.status, onPaid])

  const current = invoice
  const paymentCurrency: PaymentCurrency =
    current && isPaymentCurrency(current.currency) ? current.currency : currency
  const payAddress = current?.pay_address?.trim() ?? ""
  const hasQuote = Boolean(current && payAddress)
  const showQuoteSkeleton = loading || !hasQuote
  const msRemaining = current ? invoiceMsRemaining(current, now) : 0
  const expired = current ? isInvoiceExpired(current, now) : false
  const amountLabel = current
    ? formatCryptoAmount(current.amount_crypto, paymentCurrency)
    : ""
  const isAwaitingPayment =
    Boolean(current?.status === "pending" && payAddress && !expired)
  const sheetSide = isDesktop ? "right" : "bottom"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={sheetSide}
        showCloseButton={isDesktop === true}
        className={cn(
          "landing-modern flex w-full flex-col gap-0 border-0 bg-transparent p-0 shadow-none",
          isDesktop ? "sm:max-w-95" : "max-h-[92dvh]"
        )}
      >
        <div
          className={cn(
            landingGlassSurface,
            "flex h-full min-h-0 flex-col overflow-hidden bg-white/72 dark:bg-white/10",
            isDesktop
              ? "rounded-none rounded-s-[1.75rem]"
              : "mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom,0px))] rounded-[1.75rem]"
          )}
        >
          <span
            aria-hidden
            className={cn(
              landingGlassSheen,
              isDesktop ? "rounded-s-[1.75rem]" : "rounded-[1.75rem]"
            )}
          />

          {!isDesktop ? (
            <div
              aria-hidden
              className="relative z-10 mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/15"
            />
          ) : null}

          <SheetHeader
            className={cn(
              "relative z-10 space-y-2 border-b border-white/55 p-0 px-5 py-5 dark:border-white/10",
              !isDesktop && "pb-3"
            )}
          >
            <SheetTitle className={cn(landingTitleCard, "text-lg")}>
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </SheetDescription>
          </SheetHeader>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "flex flex-col overflow-y-auto",
                isDesktop ? "gap-5 px-5 py-5" : "gap-3.5 px-3.5 py-3"
              )}
            >
              <PaymentMethodPicker
                currency={paymentCurrency}
                disabled={loading || !checkout}
                onCurrencyChange={handleCurrencyChange}
              />

              {error ? (
                <p
                  className="rounded-2xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {showQuoteSkeleton ? (
                <div className="space-y-3">
                  {loading ? (
                    <div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      role="status"
                    >
                      <LoaderCircleIcon className="size-4 animate-spin" />
                      {t("gettingDetails")}
                    </div>
                  ) : null}
                  <PaymentQuoteSkeleton />
                </div>
              ) : (
                <div className="space-y-5">
                  <BillingGlassPanel>
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        isDesktop ? "px-3.5 py-3" : "px-3 py-3"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("sendExactly")}
                        </p>
                        <p className="mt-1 text-[1.375rem] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                          {amountLabel}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            {t("aboutUsd", {
                              amount: formatUsd(current!.amount_usd),
                            })}
                          </span>
                          {current!.original_amount_usd > current!.amount_usd ? (
                            <span className="line-through">
                              {formatUsd(current!.original_amount_usd)}
                            </span>
                          ) : null}
                          {current!.coupon_code ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-white/50 bg-white/50 px-1.5 py-0 text-[10px] dark:border-white/15 dark:bg-white/10"
                            >
                              {current!.coupon_code}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <CopyAmountButton value={amountLabel} />
                    </div>
                  </BillingGlassPanel>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor="payment-coupon-toggle"
                        id="payment-coupon-label"
                        className="cursor-pointer text-sm font-medium text-muted-foreground"
                      >
                        {t("havePromo")}
                      </Label>
                      <Switch
                        id="payment-coupon-toggle"
                        checked={couponOpen}
                        disabled={loading || !checkout}
                        aria-labelledby="payment-coupon-label"
                        className={cn(
                          "bg-foreground/12 dark:bg-white/15",
                          couponOpen &&
                            "bg-[#2563EB] hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]/40 dark:bg-[#2563EB]"
                        )}
                        onCheckedChange={(checked) => {
                          setCouponOpen(checked)
                          if (!checked && checkout) {
                            setCouponCode(defaultCoupon)
                            void loadInvoice(checkout, currency, "")
                          }
                        }}
                      />
                    </div>
                    {couponOpen ? (
                      <div className="relative">
                        <Input
                          id="payment-coupon"
                          value={couponCode}
                          onChange={(event) => setCouponCode(event.target.value)}
                          placeholder={t("enterCode")}
                          autoComplete="off"
                          spellCheck={false}
                          disabled={loading || !checkout}
                          className="h-11 rounded-xl border-white/50 bg-white/45 pe-20 dark:border-white/10 dark:bg-white/8"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              handleApplyCoupon()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            landingCta("glass", "sm"),
                            "absolute top-1/2 inset-e-1.5 h-8 -translate-y-1/2 px-3 text-xs"
                          )}
                          disabled={loading || !checkout || !couponCode.trim()}
                          onClick={handleApplyCoupon}
                        >
                          {t("apply")}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <DepositAddressCard
                    address={payAddress}
                    currency={paymentCurrency}
                  />

                  {current!.status === "paid" ? (
                    <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                      {t("paymentReceived")}
                    </div>
                  ) : null}

                  {(current!.status === "failed" || expired) &&
                  current!.status !== "paid" ? (
                    <div className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
                      {expired ? t("windowExpired") : t("paymentFailed")}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {isAwaitingPayment ? (
              <div
                className={cn(
                  "shrink-0 border-t border-white/55 dark:border-white/10",
                  isDesktop ? "px-5 py-4" : "px-3.5 py-2"
                )}
              >
                <PaymentWatcherBanner
                  expiresIn={formatCountdown(msRemaining)}
                  compact={isDesktop === false}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
