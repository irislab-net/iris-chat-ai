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
  aboutUsdFromCryptoLabel,
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
import { PAYMENT_NETWORK } from "@/lib/billing/payment-options"
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

function PaymentQuoteSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        compact ? "gap-4" : "gap-5"
      )}
      aria-busy="true"
    >
      {/* Amount — mirrors BillingGlassPanel send-exactly row */}
      <BillingGlassPanel>
        <div
          className={cn(
            "flex items-center gap-3",
            compact ? "px-3 py-2.5" : "px-3.5 py-3"
          )}
        >
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-20 rounded-full" />
            <div className="mt-2 flex items-baseline gap-2">
              <Skeleton className="h-6 w-[7.5rem] rounded-md" />
              <Skeleton className="h-3.5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </div>
      </BillingGlassPanel>

      {/* Promo — toggle + input, same stack as live coupon block */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <Skeleton className="h-3.5 w-36 rounded-full" />
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
        <div className="px-0.5">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Deposit — same chrome + padding as DepositAddressCard area */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center",
          compact ? "gap-3.5 px-4" : "gap-4 px-4"
        )}
      >
        <Skeleton
          className={cn(
            "shrink-0 rounded-md",
            compact ? "size-[12.5rem]" : "size-[13.25rem]"
          )}
        />
        <div className="flex w-full min-w-0 items-center gap-2.5">
          <Skeleton className="h-3.5 min-w-0 flex-1 rounded-full" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48 rounded-full" />
      </div>
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
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col", compact ? "gap-2.5" : "gap-3")}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2563EB]/50 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#2563EB]" />
        </span>
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {t("watchingTitle")}
        </p>
      </div>

      <p
        className={cn(
          "text-muted-foreground",
          compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed"
        )}
      >
        {t("footerGuide", { network: PAYMENT_NETWORK.name })}
      </p>

      <div
        className={cn(
          "flex items-center justify-between gap-3 text-muted-foreground",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <TimerIcon className="size-3.5 shrink-0 opacity-70" />
          <span className="font-medium text-foreground">{expiresIn}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin opacity-60" />
          <span>{compact ? t("checkingShort") : t("checking")}</span>
        </span>
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
  const isMobileSheet = isDesktop === false

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={sheetSide}
        showCloseButton={isDesktop === true}
        className={cn(
          "landing-modern flex w-full flex-col gap-0 border-0 bg-transparent p-0 shadow-none",
          isDesktop
            ? "sm:max-w-95"
            : "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-[var(--keyboard-inset-bottom,0px)] data-[side=bottom]:h-[var(--app-height,100dvh)] data-[side=bottom]:max-h-[var(--app-height,100dvh)]"
        )}
      >
        <div
          className={cn(
            landingGlassSurface,
            "flex h-full min-h-0 flex-col overflow-hidden bg-white/78 dark:bg-white/10",
            isDesktop
              ? "rounded-none rounded-s-[1.75rem]"
              : "rounded-t-[1.75rem] rounded-b-none"
          )}
        >
          <span
            aria-hidden
            className={cn(
              landingGlassSheen,
              isDesktop
                ? "rounded-s-[1.75rem]"
                : "rounded-t-[1.75rem] rounded-b-none"
            )}
          />

          {isMobileSheet ? (
            <div
              aria-hidden
              className="relative z-10 mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/15"
            />
          ) : null}

          <SheetHeader
            className={cn(
              "relative z-10 shrink-0 space-y-1 border-b border-white/55 p-0 dark:border-white/10",
              isDesktop ? "px-5 py-5" : "px-4 pb-2.5 pt-2"
            )}
          >
            <SheetTitle
              className={cn(landingTitleCard, isDesktop ? "text-lg" : "text-base")}
            >
              {t("title")}
            </SheetTitle>
            <SheetDescription
              className={cn(
                "leading-snug text-muted-foreground",
                isDesktop ? "text-sm" : "text-xs"
              )}
            >
              {t("subtitle")}
            </SheetDescription>
          </SheetHeader>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                isDesktop
                  ? "gap-5 overflow-y-auto px-5 py-5"
                  : "gap-4 overflow-hidden px-4 py-3.5"
              )}
            >
              <PaymentMethodPicker
                currency={paymentCurrency}
                disabled={loading || !checkout}
                onCurrencyChange={handleCurrencyChange}
              />

              {error ? (
                <p
                  className="shrink-0 rounded-2xl bg-destructive/8 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {showQuoteSkeleton ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {loading ? (
                    <div
                      className="mb-3.5 flex shrink-0 items-center gap-2 text-sm text-muted-foreground"
                      role="status"
                    >
                      <LoaderCircleIcon className="size-4 animate-spin" />
                      {t("gettingDetails")}
                    </div>
                  ) : null}
                  <PaymentQuoteSkeleton compact={isMobileSheet} />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    isDesktop ? "gap-5" : "gap-4"
                  )}
                >
                  <BillingGlassPanel>
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        isDesktop ? "px-3.5 py-3" : "px-3 py-2.5"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("sendExactly")}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <p
                            className={cn(
                              "font-semibold leading-none tracking-tight tabular-nums text-foreground",
                              isDesktop ? "text-[1.375rem]" : "text-[1.25rem]"
                            )}
                          >
                            {amountLabel}
                          </p>
                          <span
                            className="text-sm leading-none tabular-nums text-muted-foreground"
                            aria-label={t("approxUsd", {
                              amount: formatUsd(
                                aboutUsdFromCryptoLabel(
                                  amountLabel,
                                  current!.amount_usd
                                )
                              ),
                            })}
                          >
                            ≈{" "}
                            {formatUsd(
                              aboutUsdFromCryptoLabel(
                                amountLabel,
                                current!.amount_usd
                              )
                            )}
                          </span>
                          {current!.original_amount_usd > current!.amount_usd ? (
                            <span className="text-sm leading-none text-muted-foreground line-through">
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

                  <div className="shrink-0 space-y-2.5">
                    <div className="flex items-center justify-between gap-3 px-0.5">
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
                      <div className="relative px-0.5">
                        <Input
                          id="payment-coupon"
                          value={couponCode}
                          onChange={(event) => setCouponCode(event.target.value)}
                          placeholder={t("enterCode")}
                          autoComplete="off"
                          spellCheck={false}
                          disabled={loading || !checkout}
                          className="h-10 rounded-xl border-white/50 bg-white/45 pe-20 dark:border-white/10 dark:bg-white/8"
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
                            "absolute top-1/2 inset-e-2 h-7 -translate-y-1/2 px-3 text-xs"
                          )}
                          disabled={loading || !checkout || !couponCode.trim()}
                          onClick={handleApplyCoupon}
                        >
                          {t("apply")}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {/* Inset to match inner padding of rounded select/amount panels */}
                  <div className="flex min-h-0 flex-1 flex-col justify-center px-4">
                    <DepositAddressCard
                      address={payAddress}
                      currency={paymentCurrency}
                      compact={isMobileSheet}
                    />
                  </div>

                  {current!.status === "paid" ? (
                    <div className="shrink-0 rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                      {t("paymentReceived")}
                    </div>
                  ) : null}

                  {(current!.status === "failed" || expired) &&
                  current!.status !== "paid" ? (
                    <div className="shrink-0 rounded-2xl bg-destructive/8 px-3 py-2 text-sm text-destructive">
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
                  isDesktop
                    ? "px-5 py-4"
                    : "px-4 pb-[max(1.1rem,env(safe-area-inset-bottom,0px))] pt-3.5"
                )}
              >
                <PaymentWatcherBanner
                  expiresIn={formatCountdown(msRemaining)}
                  compact={isMobileSheet}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
