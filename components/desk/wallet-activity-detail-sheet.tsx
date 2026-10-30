"use client"

import * as React from "react"
import Image from "next/image"
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
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
  lookupLedgerAddress,
  shortenLedgerReference,
} from "@/lib/api/wallet"
import { formatUsd, pnlToneClass } from "@/lib/desk-mock/format"
import { stableNetworkMeta } from "@/lib/desk-mock/stable-networks"
import type { DeskLedgerEntry } from "@/lib/desk-mock/types"
import { cn } from "@/lib/utils"

type WalletActivityDetailSheetProps = {
  entry: DeskLedgerEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  statusLabel: string
}

function statusToneClass(status: DeskLedgerEntry["status"]): string {
  switch (status) {
    case "credited":
    case "settled":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
    case "failed":
    case "cancelled":
      return "bg-rose-500/12 text-rose-700 dark:text-rose-300"
    case "confirming":
    case "reviewing":
      return "bg-[#2563EB]/12 text-[#1D4ED8] dark:text-[#93C5FD]"
    default:
      return "bg-muted/60 text-muted-foreground"
  }
}

function StatusBadge({
  status,
  label,
}: {
  status: DeskLedgerEntry["status"]
  label: string
}) {
  const busy = status === "confirming" || status === "reviewing"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight",
        statusToneClass(status)
      )}
    >
      {busy ? (
        <Loader2Icon className="size-3 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {label}
    </span>
  )
}

function DetailRow({
  label,
  children,
  align = "end",
}: {
  label: string
  children: React.ReactNode
  align?: "end" | "start"
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/35 py-3 last:border-b-0 dark:border-white/8">
      <p className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "min-w-0 text-[14px] leading-snug font-medium break-words",
          align === "end" ? "text-end" : "text-start"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function CopyChip({
  value,
  copiedLabel,
  copyLabel,
}: {
  value: string
  copiedLabel: string
  copyLabel: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Ignore — user can still select the text.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
        "bg-white/55 text-foreground/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)] backdrop-blur-md",
        "hover:bg-white/70 dark:bg-white/12 dark:text-foreground/80 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] dark:hover:bg-white/16"
      )}
    >
      {copied ? (
        <CheckIcon className="size-3.5" aria-hidden />
      ) : (
        <CopyIcon className="size-3.5" aria-hidden />
      )}
    </button>
  )
}

function NetworkMark({
  network,
}: {
  network: string
}) {
  const meta = stableNetworkMeta(network)
  const [failed, setFailed] = React.useState(false)
  if (!meta) return <span>{network}</span>

  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="text-end">
        <span className="block text-[14px] font-semibold tracking-tight">
          {meta.chain}
        </span>
        <span className="block text-[11px] font-medium text-muted-foreground">
          {meta.code}
        </span>
      </span>
      <span
        className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-white/12"
        aria-hidden
      >
        {!failed ? (
          <Image
            src={meta.logoUrl}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="size-full rounded-full object-cover"
          />
        ) : (
          <span className="text-[9px] font-bold text-muted-foreground">
            {meta.code.slice(0, 3)}
          </span>
        )}
      </span>
    </span>
  )
}

function resolveAddress(entry: DeskLedgerEntry): string | null {
  return (
    entry.reference?.trim() ||
    lookupLedgerAddress(entry.kind, entry.id)?.trim() ||
    null
  )
}

function ActivityDetailBody({
  entry,
  statusLabel,
}: {
  entry: DeskLedgerEntry
  statusLabel: string
}) {
  const t = useTranslations("deskProfile")
  const inbound = entry.kind === "deposit"
  const Icon = inbound ? ArrowDownToLineIcon : ArrowUpFromLineIcon
  const awaiting =
    entry.kind === "deposit" &&
    entry.status === "pending" &&
    entry.amountUsd <= 0
  const amountSigned = inbound
    ? entry.amountUsd
    : -Math.abs(entry.amountUsd)
  const address = resolveAddress(entry)

  return (
    <div
      className={cn(
        chatMobileSheetBodyClass,
        "min-h-0 flex-1 overflow-y-auto pt-1 pb-5"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              "border border-white/80 bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] backdrop-blur-md",
              "dark:border-white/10 dark:bg-white/12 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
            )}
            aria-hidden
          >
            <Icon className="size-4 stroke-[1.75]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-tight">
              {inbound ? t("deposit") : t("withdraw")}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {entry.network
                ? `${entry.currency} · ${entry.network}`
                : entry.currency}
            </p>
          </div>
        </div>
        <StatusBadge status={entry.status} label={statusLabel} />
      </div>

      <div className="px-0.5">
        <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {t("activityAmount")}
        </p>
        <p
          className={cn(
            "mt-1.5 text-[28px] leading-none font-semibold tracking-tight tabular-nums",
            !awaiting && pnlToneClass(amountSigned)
          )}
        >
          {awaiting ? (
            <span className="text-[18px] font-medium text-muted-foreground">
              {t("amountAwaiting")}
            </span>
          ) : (
            <>
              {formatUsd(amountSigned, { signed: true })}
              <span className="ms-2 text-[14px] font-medium text-muted-foreground">
                {entry.currency}
              </span>
            </>
          )}
        </p>
      </div>

      <div className={cn(chatMobileSheetCardClass, "px-4 py-1")}>
        {entry.network ? (
          <DetailRow label={t("activityNetwork")}>
            <NetworkMark network={entry.network} />
          </DetailRow>
        ) : null}
        <DetailRow label={t("activityStatus")}>
          <StatusBadge status={entry.status} label={statusLabel} />
        </DetailRow>
        <DetailRow label={t("activityDate")}>
          <span className="tabular-nums">
            {new Date(entry.createdAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </DetailRow>
      </div>

      <div className={cn(chatMobileSheetCardClass, "px-4 py-3")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold tracking-tight">
            {inbound ? t("activityDepositAddress") : t("activityDestination")}
          </p>
          {address ? (
            <CopyChip
              value={address}
              copyLabel={t("activityCopyAddress")}
              copiedLabel={t("activityAddressCopied")}
            />
          ) : null}
        </div>
        {address ? (
          <p className="mt-2 font-mono text-[13px] leading-relaxed break-all text-foreground/90">
            {address}
          </p>
        ) : (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {t("activityAddressUnavailable")}
          </p>
        )}
      </div>

      <div className={cn(chatMobileSheetCardClass, "px-4 py-3")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold tracking-tight">
            {t("activityId")}
          </p>
          <CopyChip
            value={entry.id}
            copyLabel={t("activityCopyId")}
            copiedLabel={t("activityIdCopied")}
          />
        </div>
        <p className="mt-2 font-mono text-[12px] leading-relaxed break-all text-muted-foreground">
          {entry.id}
        </p>
      </div>
    </div>
  )
}

function WalletActivityDetailSheet({
  entry,
  open,
  onOpenChange,
  statusLabel,
}: WalletActivityDetailSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()
  const title =
    entry?.kind === "withdrawal" ? t("withdraw") : t("deposit")
  const address = entry ? resolveAddress(entry) : null
  const preview = address ? shortenLedgerReference(address) : title

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,42rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{preview}</DialogDescription>
          </DialogHeader>
          {open && entry ? (
            <ActivityDetailBody entry={entry} statusLabel={statusLabel} />
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
        className={cn(
          chatMobileSheetCompactContentClass,
          "max-h-[min(92dvh,44rem)]"
        )}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 pe-5")}>
          <div className="flex items-center gap-2">
            <SheetTitle
              className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}
            >
              {title}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={() => onOpenChange(false)} />
          </div>
          <SheetDescription className="sr-only">{preview}</SheetDescription>
        </SheetHeader>
        {open && entry ? (
          <ActivityDetailBody entry={entry} statusLabel={statusLabel} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { WalletActivityDetailSheet }
