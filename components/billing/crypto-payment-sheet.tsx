"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  TimerIcon,
  XIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { BillingGlassPanel } from "@/components/billing/billing-glass"
import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { PaymentMethodPicker } from "@/components/billing/payment-method-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import type {
  PaymentCurrency,
  PaymentInvoice,
} from "@/lib/billing/invoice-types"
import { isPaymentCurrency } from "@/lib/billing/invoice-types"
import {
  fetchPaymentInvoice,
  resolvePlusCryptoCheckout,
} from "@/lib/billing/invoices"
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

function PaymentQuoteSkeleton({
  compact,
  currencyPicker,
}: {
  compact?: boolean
  currencyPicker: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        compact ? "gap-4" : "gap-5"
      )}
      aria-busy="true"
    >
      {/* Amount + token picker — mirrors live amount row */}
      <BillingGlassPanel>
        <div
          className={cn(
            "flex items-center gap-2",
            compact ? "py-1 ps-6 pe-1" : "py-1.5 ps-7 pe-1.5"
          )}
        >
          <div className="min-w-0 flex-1 space-y-1.5 pe-0.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-30 rounded-md" />
              <Skeleton className="size-8 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-12 rounded-full" />
          </div>
          {currencyPicker}
        </div>
      </BillingGlassPanel>

      {/* Promo — always-visible coupon field */}
      <div className="shrink-0">
        <Skeleton className="h-12 w-full rounded-2xl" />
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
            "shrink-0 rounded-[1.25rem]",
            compact ? "size-52" : "size-55"
          )}
        />
        <div className="mx-auto flex w-[calc(12.5rem)] items-center gap-2">
          <Skeleton className="h-8 min-w-0 flex-1 rounded-lg" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  )
}

type PaymentUiStatus = "pending" | "paid" | "failed" | "expired"

const STATUS_ICON: Record<
  PaymentUiStatus,
  { icon: React.ReactNode; className: string }
> = {
  pending: {
    icon: <LoaderCircleIcon className="size-3.5 animate-spin" />,
    className: "text-amber-500",
  },
  paid: {
    icon: <CheckIcon className="size-3.5" />,
    className: "text-emerald-500",
  },
  failed: {
    icon: <XIcon className="size-3.5" />,
    className: "text-destructive",
  },
  expired: {
    icon: <TimerIcon className="size-3.5" />,
    className: "text-destructive",
  },
}

function PaymentWatcherBanner({
  expiresIn,
  compact,
  status = "pending",
}: {
  expiresIn: string
  compact?: boolean
  status?: PaymentUiStatus
}) {
  const t = useTranslations("upgradePage.crypto")
  const visual = STATUS_ICON[status]
  const title =
    status === "paid"
      ? t("statusPaid")
      : status === "failed"
        ? t("statusFailed")
        : status === "expired"
          ? t("statusExpired")
          : t("watchingTitle")

  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn("shrink-0", visual.className)} aria-hidden>
            {visual.icon}
          </span>
          <p
            className={cn(
              "font-medium text-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {title}
          </p>
        </div>

        {status === "pending" ? (
          <p
            className={cn(
              "text-muted-foreground",
              compact
                ? "text-[11px] leading-relaxed"
                : "text-xs leading-relaxed"
            )}
          >
            {t("footerGuide", { network: PAYMENT_NETWORK.name })}
          </p>
        ) : null}
      </div>

      {status === "pending" ? (
        <div className="flex shrink-0 items-center justify-self-end">
          <span
            className={cn(
              landingGlassSurface,
              "inline-flex items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1 text-muted-foreground tabular-nums dark:bg-white/10",
              compact ? "text-[11px]" : "text-xs"
            )}
          >
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            <TimerIcon className="relative z-10 size-3.5 shrink-0 opacity-70" />
            <span className="relative z-10 font-medium text-foreground">
              {expiresIn}
            </span>
          </span>
        </div>
      ) : null}
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
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
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
  const defaultCoupon =
    process.env.NEXT_PUBLIC_BILLING_COUPON_CODE?.trim() ?? ""

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
  const isAwaitingPayment = Boolean(
    current?.status === "pending" && payAddress && !expired
  )
  const paymentStatus: PaymentUiStatus | null = !hasQuote
    ? null
    : current?.status === "paid"
      ? "paid"
      : current?.status === "failed"
        ? "failed"
        : expired
          ? "expired"
          : isAwaitingPayment
            ? "pending"
            : null
  const sheetSide = isDesktop ? "right" : "bottom"
  const isMobileSheet = isDesktop === false

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={sheetSide}
        showCloseButton
        className={cn(
          "landing-modern flex w-full flex-col gap-0 border-0 bg-transparent p-0 shadow-none",
          "**:data-[slot=sheet-close]:z-20",
          isDesktop
            ? "sm:max-w-95"
            : "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-(--keyboard-inset-bottom,0px) data-[side=bottom]:h-auto data-[side=bottom]:max-h-[min(90dvh,calc(var(--app-height,100dvh)-0.75rem))]"
        )}
      >
        <div
          className={cn(
            landingGlassSurface,
            "flex max-h-[inherit] min-h-0 flex-col overflow-hidden bg-white/78 dark:bg-white/10",
            isDesktop
              ? "h-full rounded-none rounded-s-[1.75rem]"
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
              "relative z-10 shrink-0 border-b border-white/55 p-0 dark:border-white/10",
              isDesktop ? "px-5 py-5 pe-14" : "px-4 pe-12 pt-2 pb-2.5"
            )}
          >
            <SheetTitle
              className={cn(
                landingTitleCard,
                isDesktop ? "text-lg" : "text-base"
              )}
            >
              {t("title")}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("subtitle")}
            </SheetDescription>
          </SheetHeader>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                isDesktop
                  ? "gap-5 overflow-y-auto px-5 py-5"
                  : "gap-4 overflow-y-auto px-4 py-3.5"
              )}
            >
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
                  <PaymentQuoteSkeleton
                    compact={isMobileSheet}
                    currencyPicker={
                      <PaymentMethodPicker
                        currency={paymentCurrency}
                        disabled={loading || !checkout}
                        onCurrencyChange={handleCurrencyChange}
                      />
                    }
                  />
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
                        "flex items-center gap-2",
                        isDesktop ? "py-1.5 ps-7 pe-1.5" : "py-1 ps-6 pe-1"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 pe-0.5">
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "leading-none font-semibold tracking-tight text-foreground tabular-nums",
                              isDesktop ? "text-[1.375rem]" : "text-[1.25rem]"
                            )}
                          >
                            {amountLabel}
                          </p>
                          <p
                            className="mt-px text-[10px] leading-none text-muted-foreground tabular-nums dark:text-foreground/70"
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
                            {current!.original_amount_usd >
                            current!.amount_usd ? (
                              <span className="ms-1.5 line-through opacity-70">
                                {formatUsd(current!.original_amount_usd)}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <CopyAmountButton value={amountLabel} />
                        {current!.coupon_code ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-white/50 bg-white/50 px-1.5 py-0 text-[10px] dark:border-white/15 dark:bg-white/10"
                          >
                            {current!.coupon_code}
                          </Badge>
                        ) : null}
                      </div>
                      <PaymentMethodPicker
                        currency={paymentCurrency}
                        disabled={loading || !checkout}
                        onCurrencyChange={handleCurrencyChange}
                      />
                    </div>
                  </BillingGlassPanel>

                  <div className="shrink-0">
                    <div
                      className={cn(
                        landingGlassSurface,
                        "relative rounded-2xl bg-white/55 dark:bg-white/10"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(landingGlassSheen, "rounded-2xl")}
                      />
                      <Input
                        id="payment-coupon"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder={t("enterCode")}
                        autoComplete="off"
                        spellCheck={false}
                        className={cn(
                          "relative z-10 h-12 rounded-2xl border-0 bg-transparent ps-4 pe-22 shadow-none",
                          "placeholder:text-muted-foreground/55 focus-visible:border-0 focus-visible:ring-0",
                          "dark:bg-transparent dark:placeholder:text-muted-foreground/70"
                        )}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            if (couponCode.trim()) handleApplyCoupon()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className={cn(
                          landingCta("glass", "sm"),
                          "absolute inset-e-2 top-1/2 z-10 h-8 -translate-y-1/2 px-3.5 text-xs"
                        )}
                        disabled={!couponCode.trim()}
                        onClick={handleApplyCoupon}
                      >
                        {t("apply")}
                      </Button>
                    </div>
                  </div>

                  {/* Inset to match inner padding of rounded select/amount panels */}
                  <div className="flex min-h-0 flex-1 flex-col justify-center px-4">
                    <DepositAddressCard
                      address={payAddress}
                      currency={paymentCurrency}
                      compact={isMobileSheet}
                    />
                  </div>
                </div>
              )}
            </div>

            {paymentStatus ? (
              <div
                className={cn(
                  "shrink-0",
                  isDesktop
                    ? "px-5 pt-2 pb-5"
                    : "px-4 pt-2 pb-[max(1.1rem,env(safe-area-inset-bottom,0px))]"
                )}
              >
                <div
                  className={cn(
                    landingGlassSurface,
                    "rounded-[1.25rem] bg-white/62 px-3.5 py-3 dark:bg-white/10"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(landingGlassSheen, "rounded-[1.25rem]")}
                  />
                  <div className="relative z-10">
                    <PaymentWatcherBanner
                      expiresIn={formatCountdown(msRemaining)}
                      compact={isMobileSheet}
                      status={paymentStatus}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
