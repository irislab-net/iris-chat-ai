"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, LoaderCircleIcon, TimerIcon } from "lucide-react"

import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { PaymentMethodPicker } from "@/components/billing/payment-method-picker"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  chatMobileSheetCardClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
import { cn } from "@/lib/utils"

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

function planSummary(billing: BillingCycle) {
  return billing === "annual" ? "Plus · billed annually" : "Plus · billed monthly"
}

function PaymentStep({
  number,
  title,
  active,
  complete,
  compact,
}: {
  number: number
  title: string
  active: boolean
  complete: boolean
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold",
          compact ? "size-5 text-[10px]" : "size-6 text-xs",
          complete
            ? "bg-foreground text-background"
            : active
              ? "bg-foreground/10 text-foreground"
              : "bg-muted text-muted-foreground"
        )}
      >
        {complete ? (
          <CheckIcon className={compact ? "size-3" : "size-3.5"} />
        ) : (
          number
        )}
      </span>
      <span
        className={cn(
          compact ? "text-xs" : "text-sm",
          active || complete ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        {title}
      </span>
    </div>
  )
}

function PaymentQuoteSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="mt-3 h-10 w-44 rounded-lg" />
        <Skeleton className="mt-2 h-3 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <div className="flex justify-center border-b border-border/50 px-4 py-5">
          <Skeleton className="size-40 rounded-xl" />
        </div>
        <div className="space-y-3 p-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
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
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
            Waiting for payment
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-muted-foreground">
              We&apos;ll unlock Plus as soon as the transfer arrives.
            </p>
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
                {compact ? null : "Time left "}
                <span className="font-medium tabular-nums text-foreground">
                  {expiresIn}
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <LoaderCircleIcon className="size-3 shrink-0 animate-spin opacity-60" />
              <span>{compact ? "Checking…" : "Checking"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyAmountButton({ value }: { value: string }) {
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
      variant="outline"
      size="sm"
      className="rounded-lg"
      onClick={() => void onCopy()}
    >
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copied ? "Copied" : "Copy amount"}
    </Button>
  )
}

export function CryptoPaymentSheet({
  checkout,
  open,
  onOpenChange,
  onPaid,
}: CryptoPaymentSheetProps) {
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
          caught instanceof Error ? caught.message : "Could not create invoice"
        )
        return null
      } finally {
        setLoading(false)
      }
    },
    []
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
          "flex w-full flex-col gap-0 p-0",
          isDesktop
            ? "border-l border-border/60 bg-background sm:max-w-95"
            : cn(
                chatMobileSheetContentClass,
                "max-h-[92dvh] overflow-hidden pb-0"
              )
        )}
      >
        {!isDesktop ? (
          <div aria-hidden className={chatMobileSheetHandleClass} />
        ) : null}
        <SheetHeader
          className={cn(
            isDesktop
              ? "space-y-2 border-b border-border/50 p-0 px-5 py-5"
              : cn(
                  chatMobileSheetHeaderClass,
                  "border-b border-black/[0.06] pb-3 dark:border-border/50"
                )
          )}
        >
          <SheetTitle
            className={cn(
              isDesktop ? "text-lg font-semibold tracking-tight" : chatMobileSheetTitleClass
            )}
          >
            Pay for Plus
          </SheetTitle>
          <SheetDescription
            className={cn(
              isDesktop ? "text-sm leading-relaxed" : chatMobileSheetDescriptionClass
            )}
          >
            {checkout ? planSummary(checkout.billing) : "Plus upgrade"}
            {isDesktop
              ? " · send from any wallet and we'll unlock access automatically."
              : " · send from your wallet."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "flex flex-col overflow-y-auto",
              isDesktop ? "gap-5 px-5 py-5" : "gap-3.5 px-3.5 py-3"
            )}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <PaymentStep
                number={1}
                title="Choose coin"
                active={!hasQuote}
                complete={hasQuote}
                compact={isDesktop === false}
              />
              <div className="h-px bg-border" />
              <PaymentStep
                number={2}
                title="Send payment"
                active={hasQuote}
                complete={current?.status === "paid"}
                compact={isDesktop === false}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Pay with</Label>
              <PaymentMethodPicker
                currency={paymentCurrency}
                disabled={loading || !checkout}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>

            <Accordion
              value={couponOpen ? ["coupon"] : []}
              onValueChange={(value) => setCouponOpen(value.includes("coupon"))}
            >
              <AccordionItem value="coupon" className="border-0">
                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                  Have a promo code?
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex gap-2 pt-1">
                    <Input
                      id="payment-coupon"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Enter code"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={loading || !checkout}
                      className="h-10 rounded-xl"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleApplyCoupon()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 shrink-0 rounded-xl px-4"
                      disabled={loading || !checkout}
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {error ? (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
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
                    Getting your payment details…
                  </div>
                ) : null}
                <PaymentQuoteSkeleton />
              </div>
            ) : (
              <div className="space-y-5">
                <section className={cn(isDesktop ? "rounded-2xl border border-border/60 bg-card p-5" : cn(chatMobileSheetCardClass, "p-4"))}>
                  <p className="text-sm text-muted-foreground">Send exactly</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                        {amountLabel}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>About {formatUsd(current!.amount_usd)}</span>
                        {current!.original_amount_usd > current!.amount_usd ? (
                          <span className="line-through">
                            {formatUsd(current!.original_amount_usd)}
                          </span>
                        ) : null}
                        {current!.coupon_code ? (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                            {current!.coupon_code}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <CopyAmountButton value={amountLabel} />
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-sm font-medium">To this wallet address</p>
                  <DepositAddressCard
                    address={payAddress}
                    currency={paymentCurrency}
                  />
                </section>

                {current!.status === "paid" ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    Payment received. Plus is being activated now.
                  </div>
                ) : null}

                {(current!.status === "failed" || expired) &&
                current!.status !== "paid" ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {expired
                      ? "This payment window expired. Choose a coin again to get a new address."
                      : "This payment could not be completed. Try again or switch coin."}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isAwaitingPayment ? (
            <div
              className={cn(
                "shrink-0",
                isDesktop
                  ? "border-t border-border/50 px-5 py-4"
                  : cn(chatMobileSheetFooterBarClass, "px-3.5 py-2")
              )}
            >
              <PaymentWatcherBanner
                expiresIn={formatCountdown(msRemaining)}
                compact={isDesktop === false}
              />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
