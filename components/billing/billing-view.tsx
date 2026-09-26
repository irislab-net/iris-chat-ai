"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  ArrowUpRightIcon,
  ReceiptIcon,
  RefreshCwIcon,
  WalletIcon,
  XIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { AnimatedExurLogo } from "@/components/brand/animated-exur-logo"
import { BillingGlassPanel } from "@/components/billing/billing-glass"
import {
  CreditUsageStatusPanel,
  useCreditUsage,
} from "@/components/billing/credit-usage-status"
import { plusJakarta } from "@/components/landing/modern/fonts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { displayPlanName } from "@/lib/billing/catalog"
import { formatCryptoAmount } from "@/lib/billing/crypto-format"
import {
  formatInvoiceDate,
  formatInvoicePlanLabel,
  formatInvoiceUsd,
  invoiceHistoryRows,
  normalizeInvoiceStatus,
  paymentHistoryRows,
} from "@/lib/billing/invoice-history"
import { InvoiceError, listPaymentInvoices } from "@/lib/billing/invoices"
import type { PaymentInvoice } from "@/lib/billing/invoice-types"
import { localeDirection } from "@/lib/i18n/locale"
import {
  landingCta,
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
  landingHeroGlass,
  landingInner,
  landingShell,
  landingTitleCard,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, SITE_NAME, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

import "@/app/styles/landing-modern.css"

function statusBadgeVariant(
  status: ReturnType<typeof normalizeInvoiceStatus>
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid") return "default"
  if (status === "pending") return "secondary"
  if (status === "failed") return "destructive"
  return "outline"
}

function formatExpiry(value?: string | null): string | null {
  if (!value) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(ms))
}

function InvoiceRow({
  invoice,
  mode,
}: {
  invoice: PaymentInvoice
  mode: "invoice" | "payment"
}) {
  const t = useTranslations("billingPage")
  const status = normalizeInvoiceStatus(invoice.status)
  const cryptoLabel = formatCryptoAmount(
    mode === "payment" && invoice.paid_amount_crypto
      ? invoice.paid_amount_crypto
      : invoice.amount_crypto,
    invoice.currency
  )
  const when =
    mode === "payment"
      ? formatInvoiceDate(invoice.paid_at ?? invoice.updated_at)
      : formatInvoiceDate(invoice.created_at)

  const statusKey =
    status === "paid"
      ? "statusPaid"
      : status === "pending"
        ? "statusPending"
        : status === "failed"
          ? "statusFailed"
          : status === "expired"
            ? "statusExpired"
            : "statusUnknown"

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-white/45 px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:px-6 dark:border-white/10">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {formatInvoicePlanLabel(invoice.plan_id)}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {invoice.uid}
        </p>
      </div>
      <p className="hidden truncate text-[13px] text-muted-foreground sm:block">
        {when}
      </p>
      <div className="justify-self-end text-end sm:justify-self-auto">
        <p className="text-[13px] font-medium text-foreground tabular-nums">
          {formatInvoiceUsd(invoice.amount_usd)}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {cryptoLabel}
        </p>
      </div>
      <div className="col-start-2 row-start-1 justify-self-end sm:col-auto sm:row-auto">
        <Badge
          variant={statusBadgeVariant(status)}
          className="rounded-full bg-white/55 dark:bg-white/10"
        >
          {t(statusKey)}
        </Badge>
      </div>
      <p className="col-span-2 text-xs text-muted-foreground sm:hidden">
        {when}
      </p>
    </li>
  )
}

function HistoryList({
  rows,
  mode,
  emptyTitle,
  emptyBody,
}: {
  rows: PaymentInvoice[]
  mode: "invoice" | "payment"
  emptyTitle: string
  emptyBody: string
}) {
  if (rows.length === 0) {
    return (
      <Empty className="min-h-52 border-0 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {mode === "payment" ? <WalletIcon /> : <ReceiptIcon />}
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyBody}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="min-w-0">
      {rows.map((invoice) => (
        <InvoiceRow key={invoice.uid} invoice={invoice} mode={mode} />
      ))}
    </ul>
  )
}

function StatCell({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("min-w-0 px-5 py-4 sm:px-6", className)}>
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[1.05rem] font-medium tracking-tight">
        {value}
      </p>
    </div>
  )
}

function BillingView() {
  const t = useTranslations("billingPage")
  const locale = useLocale()
  const dir = localeDirection(locale)
  const isRtl = dir === "rtl"
  const { user, isAuthenticated, isProUser, login, loginPending } = useAuth()
  const [invoices, setInvoices] = React.useState<PaymentInvoice[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const creditUsage = useCreditUsage(isAuthenticated)

  const planName = displayPlanName(user?.tier)
  const proExpires = formatExpiry(user?.pro_expires_at)
  const trialEnds = formatExpiry(user?.trial_ends_at)

  const displayFont = isRtl
    ? '"IRIS Sans"'
    : (plusJakarta.style.fontFamily.split(",")[0]?.trim() ??
      '"Plus Jakarta Sans"')
  const fontVariables = isRtl ? undefined : plusJakarta.variable

  const loadInvoices = React.useCallback(async () => {
    if (!isAuthenticated) {
      setInvoices([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await listPaymentInvoices()
      setInvoices(rows)
    } catch (err) {
      const message =
        err instanceof InvoiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("loadError")
      setError(message)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, t])

  React.useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void loadInvoices()
    })
    return () => {
      cancelled = true
    }
  }, [loadInvoices])

  const invoiceRows = invoiceHistoryRows(invoices ?? [])
  const paymentRows = paymentHistoryRows(invoices ?? [])
  const pendingCount = invoiceRows.filter(
    (row) => normalizeInvoiceStatus(row.status) === "pending"
  ).length

  const statusValue = !isAuthenticated
    ? t("statusSignedOut")
    : isProUser
      ? t("statusActive")
      : pendingCount > 0
        ? t("statusPaymentPending")
        : t("statusFree")

  const renewValue = isProUser
    ? (proExpires ?? "—")
    : trialEnds
      ? t("endsDate", { date: trialEnds })
      : "—"

  return (
    <div
      dir={dir}
      className={cn(
        fontVariables,
        "landing-modern min-h-dvh bg-background text-foreground antialiased selection:bg-foreground/10 selection:text-foreground",
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
      <div className={cn(landingShell, "relative z-10 pb-8 sm:pb-10")}>
        <header className="mt-3 flex items-center gap-3 sm:mt-5">
          <div
            className={cn(
              landingGlassSurface,
              "flex min-w-0 flex-1 items-center gap-3 rounded-full bg-white/44 px-3 py-2.5 sm:px-4 dark:bg-white/10"
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
              <p className="text-sm leading-none font-medium tracking-tight">
                {t("title")}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t("currentPlanLine", {
                  plan: isAuthenticated ? planName : "—",
                })}
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
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            <XIcon className="relative z-10 size-4" />
          </Button>
        </header>

        <article
          className={cn(
            landingHeroGlass,
            "mt-6 min-h-0 rounded-[2rem] sm:rounded-[2.5rem]"
          )}
        >
          <div className={cn(landingInner, "py-10 sm:py-12 lg:py-14")}>
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

            <Separator className="mx-auto my-10 max-w-3xl bg-foreground/8" />

            <div className="mx-auto flex max-w-3xl flex-col gap-10">
              <section className="space-y-4">
                <BillingGlassPanel>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/55 px-5 py-6 sm:px-6 dark:border-white/10">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {t("currentPlan")}
                      </p>
                      <p
                        className={cn(
                          landingTitleCard,
                          "mt-2 text-2xl sm:text-[1.75rem]"
                        )}
                      >
                        {isAuthenticated ? planName : "—"}
                      </p>
                      {isProUser && proExpires ? (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {t("renews", { date: proExpires })}
                        </p>
                      ) : !isProUser && trialEnds ? (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {t("trialEnds", { date: trialEnds })}
                        </p>
                      ) : !isAuthenticated ? (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {t("signInForPlan")}
                        </p>
                      ) : pendingCount > 0 ? (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {t("paymentPendingHint")}
                        </p>
                      ) : null}
                    </div>
                    {!isProUser ? (
                      <Button
                        size="sm"
                        className={landingCta("glass", "sm")}
                        nativeButton={false}
                        render={<Link href={UPGRADE_PATH} />}
                      >
                        {t("upgrade")}
                        <ArrowUpRightIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full border-white/50 bg-white/50 dark:border-white/15 dark:bg-white/10"
                      >
                        {t("active")}
                      </Badge>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3">
                    <StatCell
                      label={t("status")}
                      value={statusValue}
                      className="border-b border-white/45 sm:border-e sm:border-b-0 dark:border-white/10"
                    />
                    <StatCell
                      label={isProUser ? t("renewsExpires") : t("trial")}
                      value={renewValue}
                      className="border-b border-white/45 sm:border-e sm:border-b-0 dark:border-white/10"
                    />
                    <StatCell
                      label={t("pendingInvoices")}
                      value={isAuthenticated ? String(pendingCount) : "—"}
                    />
                  </div>
                </BillingGlassPanel>

                {!isAuthenticated ? (
                  <BillingGlassPanel className="bg-white/50 dark:bg-white/10">
                    <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                        {t("signInForHistory")}
                      </p>
                      <Button
                        size="sm"
                        className={landingCta("glass", "sm")}
                        disabled={loginPending}
                        onClick={() => login({ source: "billing" })}
                      >
                        {loginPending ? t("connecting") : t("signIn")}
                      </Button>
                    </div>
                  </BillingGlassPanel>
                ) : null}
              </section>

              <CreditUsageStatusPanel
                balance={creditUsage.balance}
                trial={creditUsage.trial}
                loading={creditUsage.loading}
                error={creditUsage.error}
                onRefresh={() => void creditUsage.refresh()}
              />

              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className={landingTitleCard}>{t("history")}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {t("historySubtitle")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={landingCta("secondary", "sm")}
                    disabled={!isAuthenticated || loading}
                    onClick={() => void loadInvoices()}
                  >
                    <RefreshCwIcon
                      className={cn("size-3.5", loading && "animate-spin")}
                    />
                    {t("refresh")}
                  </Button>
                </div>

                {error ? (
                  <p className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <BillingGlassPanel>
                  <Tabs defaultValue="invoices" className="gap-0">
                    <div className="flex justify-center border-b border-white/55 px-4 py-3 dark:border-white/10">
                      <TabsList className="h-11 rounded-full bg-white/45 p-1.5 group-data-horizontal/tabs:h-11 dark:bg-white/10">
                        <TabsTrigger
                          value="invoices"
                          className="h-8 rounded-full px-5 text-sm data-active:bg-white data-active:shadow-sm dark:data-active:bg-white/15"
                        >
                          {t("invoices")}
                          {invoiceRows.length > 0 ? (
                            <span className="text-muted-foreground">
                              ({invoiceRows.length})
                            </span>
                          ) : null}
                        </TabsTrigger>
                        <TabsTrigger
                          value="payments"
                          className="h-8 rounded-full px-5 text-sm data-active:bg-white data-active:shadow-sm dark:data-active:bg-white/15"
                        >
                          {t("payments")}
                          {paymentRows.length > 0 ? (
                            <span className="text-muted-foreground">
                              ({paymentRows.length})
                            </span>
                          ) : null}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="invoices" className="mt-0">
                      {loading && invoices == null ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          {t("loadingInvoices")}
                        </p>
                      ) : (
                        <HistoryList
                          rows={invoiceRows}
                          mode="invoice"
                          emptyTitle={t("noInvoicesTitle")}
                          emptyBody={t("noInvoicesBody")}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="payments" className="mt-0">
                      {loading && invoices == null ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          {t("loadingPayments")}
                        </p>
                      ) : (
                        <HistoryList
                          rows={paymentRows}
                          mode="payment"
                          emptyTitle={t("noPaymentsTitle")}
                          emptyBody={t("noPaymentsBody")}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </BillingGlassPanel>
              </section>

              <p className="pb-2 text-center text-[11px] text-muted-foreground">
                {t.rich("managePlans", {
                  upgrade: (chunks) => (
                    <Link
                      href={UPGRADE_PATH}
                      className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export { BillingView }
