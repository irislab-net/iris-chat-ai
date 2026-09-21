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

import { useAuth } from "@/components/auth/auth-provider"
import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import {
  CreditUsageStatusPanel,
  useCreditUsage,
} from "@/components/billing/credit-usage-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
import {
  InvoiceError,
  listPaymentInvoices,
} from "@/lib/billing/invoices"
import type { PaymentInvoice } from "@/lib/billing/invoice-types"
import { APP_NEWS_PATH, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

function statusBadgeVariant(
  status: ReturnType<typeof normalizeInvoiceStatus>
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid") return "default"
  if (status === "pending") return "secondary"
  if (status === "failed") return "destructive"
  return "outline"
}

function statusLabel(status: ReturnType<typeof normalizeInvoiceStatus>): string {
  if (status === "paid") return "Paid"
  if (status === "pending") return "Pending"
  if (status === "failed") return "Failed"
  if (status === "expired") return "Expired"
  return "Unknown"
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

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-border/50 px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-foreground">
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
        <p className="text-[13px] font-medium tabular-nums text-foreground">
          {formatInvoiceUsd(invoice.amount_usd)}
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {cryptoLabel}
        </p>
      </div>
      <div className="col-start-2 row-start-1 justify-self-end sm:col-auto sm:row-auto">
        <Badge variant={statusBadgeVariant(status)} className="rounded-full capitalize">
          {statusLabel(status)}
        </Badge>
      </div>
      <p className="col-span-2 text-[12px] text-muted-foreground sm:hidden">
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
    <div className={cn("min-w-0 px-5 py-4", className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[17px] font-semibold tracking-tight">
        {value}
      </p>
    </div>
  )
}

function BillingView() {
  const { user, isAuthenticated, isProUser, login, loginPending } = useAuth()
  const [invoices, setInvoices] = React.useState<PaymentInvoice[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const creditUsage = useCreditUsage(isAuthenticated)

  const planName = displayPlanName(user?.tier)
  const proExpires = formatExpiry(user?.pro_expires_at)
  const trialEnds = formatExpiry(user?.trial_ends_at)

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
            : "Could not load billing history"
      setError(message)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

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
    ? "Signed out"
    : isProUser
      ? "Active"
      : pendingCount > 0
        ? "Payment pending"
        : "Free"

  const renewValue = isProUser
    ? (proExpires ?? "—")
    : trialEnds
      ? `Ends ${trialEnds}`
      : "—"

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4 sm:px-6">
        <IrisLabLogo alt="Exur" size={32} className="size-8 rounded-full" priority />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none">Billing</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Current plan: {isAuthenticated ? planName : "—"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={<Link href={APP_NEWS_PATH} aria-label="Back to desk" />}
        >
          <XIcon className="size-4" />
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your billing
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Plan status, co-pilot credits, and crypto payment history in one
            place.
          </p>
        </div>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 px-5 py-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Current plan
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                  {isAuthenticated ? planName : "—"}
                </p>
                {isProUser && proExpires ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Renews {proExpires}
                  </p>
                ) : !isProUser && trialEnds ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Trial ends {trialEnds}
                  </p>
                ) : !isAuthenticated ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sign in to see your plan details
                  </p>
                ) : pendingCount > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Payment pending · finish checkout on Upgrade
                  </p>
                ) : null}
              </div>
              {!isProUser ? (
                <Button
                  size="sm"
                  className="rounded-xl"
                  nativeButton={false}
                  render={<Link href={UPGRADE_PATH} />}
                >
                  Upgrade
                  <ArrowUpRightIcon className="size-3.5" />
                </Button>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  Active
                </Badge>
              )}
            </div>

            <div className="grid sm:grid-cols-3">
              <StatCell
                label="Status"
                value={statusValue}
                className="border-b border-border/50 sm:border-r sm:border-b-0"
              />
              <StatCell
                label={isProUser ? "Renews / expires" : "Trial"}
                value={renewValue}
                className="border-b border-border/50 sm:border-r sm:border-b-0"
              />
              <StatCell
                label="Pending invoices"
                value={
                  isAuthenticated ? String(pendingCount) : "—"
                }
              />
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                Sign in to view invoices, payments, and credit usage.
              </p>
              <Button
                size="sm"
                className="rounded-xl"
                disabled={loginPending}
                onClick={() => login({ source: "billing" })}
              >
                {loginPending ? "Connecting…" : "Sign in"}
              </Button>
            </div>
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
              <h2 className="text-lg font-semibold tracking-tight">History</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crypto invoices and confirmed payments.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              disabled={!isAuthenticated || loading}
              onClick={() => void loadInvoices()}
            >
              <RefreshCwIcon
                className={cn("size-3.5", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90">
            <Tabs defaultValue="invoices" className="gap-0">
              <div className="flex justify-center border-b border-border/50 px-4 py-3">
                <TabsList className="h-11 rounded-full p-1.5 group-data-horizontal/tabs:h-11">
                  <TabsTrigger
                    value="invoices"
                    className="h-8 rounded-full px-5 text-sm"
                  >
                    Invoices
                    {invoiceRows.length > 0 ? (
                      <span className="text-muted-foreground">
                        ({invoiceRows.length})
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="h-8 rounded-full px-5 text-sm"
                  >
                    Payments
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
                    Loading invoices…
                  </p>
                ) : (
                  <HistoryList
                    rows={invoiceRows}
                    mode="invoice"
                    emptyTitle="No invoices yet"
                    emptyBody="When you start a Plus checkout, invoices will show up here."
                  />
                )}
              </TabsContent>
              <TabsContent value="payments" className="mt-0">
                {loading && invoices == null ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Loading payments…
                  </p>
                ) : (
                  <HistoryList
                    rows={paymentRows}
                    mode="payment"
                    emptyTitle="No payments yet"
                    emptyBody="Confirmed crypto payments will appear in this list."
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          Manage plans on{" "}
          <Link
            href={UPGRADE_PATH}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Upgrade
          </Link>
        </p>
      </main>
    </div>
  )
}

export { BillingView }
