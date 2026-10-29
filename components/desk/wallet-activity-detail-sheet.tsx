"use client"

import * as React from "react"
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CheckIcon,
  CopyIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
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
import { shortenLedgerReference } from "@/lib/api/wallet"
import { formatUsd } from "@/lib/desk-mock/format"
import type { DeskLedgerEntry } from "@/lib/desk-mock/types"
import { cn } from "@/lib/utils"

type WalletActivityDetailSheetProps = {
  entry: DeskLedgerEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  statusLabel: string
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/40 py-3 last:border-b-0 dark:border-white/10">
      <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="text-[14px] leading-snug font-medium break-words">
        {children}
      </div>
    </div>
  )
}

function CopyAddressButton({
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
      // Ignore — user can still select the address.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        "border border-white/70 bg-white/55 text-foreground/70",
        "dark:border-white/20 dark:bg-white/12 dark:text-foreground/80"
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
  const address = entry.reference?.trim() || null

  return (
    <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-2 pb-6")}>
      <div className="flex items-center gap-3 px-1 pb-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            "border border-white/70 bg-white/55 dark:border-white/20 dark:bg-white/12"
          )}
          aria-hidden
        >
          <Icon className="size-4 stroke-[1.75]" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight">
            {inbound ? t("deposit") : t("withdraw")}
            {entry.network ? ` · ${entry.network}` : null}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {statusLabel}
          </p>
        </div>
      </div>

      <div className="px-1">
        <DetailRow label={t("activityAmount")}>
          {awaiting ? (
            t("amountAwaiting")
          ) : (
            <span className="tabular-nums">
              {inbound
                ? formatUsd(entry.amountUsd)
                : formatUsd(-Math.abs(entry.amountUsd), { signed: true })}
              <span className="ms-1.5 text-[12px] font-medium text-muted-foreground">
                {entry.currency}
              </span>
            </span>
          )}
        </DetailRow>

        {entry.network ? (
          <DetailRow label={t("activityNetwork")}>{entry.network}</DetailRow>
        ) : null}

        <DetailRow label={t("activityStatus")}>{statusLabel}</DetailRow>

        <DetailRow label={t("activityDate")}>
          <span className="tabular-nums">
            {new Date(entry.createdAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </DetailRow>

        <DetailRow
          label={inbound ? t("activityDepositAddress") : t("activityDestination")}
        >
          {address ? (
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 font-mono text-[13px] leading-relaxed break-all">
                {address}
              </p>
              <CopyAddressButton
                value={address}
                copyLabel={t("activityCopyAddress")}
                copiedLabel={t("activityAddressCopied")}
              />
            </div>
          ) : (
            <p className="text-[13px] font-normal text-muted-foreground">
              {t("activityAddressUnavailable")}
            </p>
          )}
        </DetailRow>

        <DetailRow label={t("activityId")}>
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed break-all text-muted-foreground">
              {entry.id}
            </p>
            <CopyAddressButton
              value={entry.id}
              copyLabel={t("activityCopyId")}
              copiedLabel={t("activityIdCopied")}
            />
          </div>
        </DetailRow>
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
  const preview =
    entry?.reference != null
      ? shortenLedgerReference(entry.reference)
      : title

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
          "max-h-[min(88dvh,40rem)]"
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
