"use client"

import * as React from "react"
import {
  CopyIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { useTheme } from "@wrksz/themes/client/use-theme"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { IosShareIcon } from "@/components/icons/ios-share-icon"
import { Button } from "@/components/ui/button"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  captureShareNodeToBlob,
  formatSignalShareDate,
  shareImageWithCaption,
  signalShareBrandLogoSrc,
  signalShareCardBg,
} from "@/lib/chat/signal-share-capture"
import {
  buildSignalShareText,
  SIGNAL_SHARE_SITE,
  signalShareFileName,
} from "@/lib/chat/signal-share"
import { signalRewardRiskRatio } from "@/lib/chat/signal-setup"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"
import { cn } from "@/lib/utils"

type ChatSignalShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: PaperTradeTicket
}

function ActionRow({
  busy,
  copied,
  onCopyText,
  onShareImage,
  copyLabel,
  shareLabel,
  copiedLabel,
}: {
  busy: boolean
  copied: boolean
  onCopyText: () => void
  onShareImage: () => void
  copyLabel: string
  shareLabel: string
  copiedLabel: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className={cn(
          chatMobileSheetSecondaryButtonClass,
          "h-11! min-h-11 gap-1.5 text-[14px]"
        )}
        onClick={onCopyText}
      >
        <CopyIcon className="size-3.5" />
        {copied ? copiedLabel : copyLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className={cn(
          chatMobileSheetPrimaryButtonClass,
          "h-11! min-h-11 gap-1.5 text-[14px]"
        )}
        onClick={onShareImage}
      >
        <IosShareIcon className="size-3.5" />
        {shareLabel}
      </Button>
    </div>
  )
}

function SharePreviewCard({
  ticket,
  shareDate,
  captureRef,
  isDark,
}: {
  ticket: PaperTradeTicket
  shareDate: string
  captureRef: React.RefObject<HTMLDivElement | null>
  isDark: boolean
}) {
  const t = useTranslations("workspace")
  const isLong = ticket.side === "LONG"
  const SideIcon = isLong ? TrendingUpIcon : TrendingDownIcon
  const rewardRisk = signalRewardRiskRatio(ticket)
  const setup = ticket.setup.trim()
  const thesis = ticket.thesis.trim()
  const timeHorizon = ticket.timeHorizon?.trim() ?? ""
  const stopLossReason = ticket.stopLossReason?.trim() ?? ""
  const entryReason = ticket.entryReason?.trim() ?? ""
  const takeProfitReason = ticket.takeProfitReason?.trim() ?? ""
  const hasLeverage = ticket.leverage > 0
  const hasSize = ticket.quantity > 0
  const logoSrc = signalShareBrandLogoSrc()
  const tileClass = "rounded-2xl bg-white px-2.5 py-3 dark:bg-white/[0.08]"
  const panelClass = "rounded-2xl bg-white px-3.5 py-3 dark:bg-white/[0.08]"
  const mutedLabelClass =
    "text-[10px] font-medium tracking-[0.07em] text-black/45 uppercase dark:text-white/45"
  const mutedMetaLabelClass =
    "text-[10px] font-medium tracking-[0.06em] text-black/45 uppercase dark:text-white/45"

  const priceItems = [
    {
      label: t("signalCardStopLoss"),
      value: formatTradePrice(ticket.stopLoss),
      reason: stopLossReason,
    },
    {
      label: t("signalCardEntry"),
      value: formatTradePrice(ticket.markPrice),
      reason: entryReason,
      emphasis: true,
    },
    {
      label: t("signalShareTarget"),
      value: formatTradePrice(ticket.takeProfit),
      reason: takeProfitReason,
    },
  ]

  const metaItems = [
    hasLeverage
      ? { label: t("signalCardLeverage"), value: `${ticket.leverage}x` }
      : null,
    hasSize
      ? {
          label: t("signalCardSize"),
          value: ticket.quantity.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          }),
        }
      : null,
    rewardRisk != null
      ? {
          label: t("signalCardRewardRisk"),
          value: `1 : ${rewardRisk.toFixed(2)}`,
        }
      : null,
    timeHorizon
      ? { label: t("signalCardTimeHorizon"), value: timeHorizon }
      : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div
      ref={captureRef}
      className={cn(
        "relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.35rem] bg-[#f7f8fa] text-[#0f172a] shadow-[0_12px_40px_-18px_rgba(15,23,42,0.28)]",
        "dark:bg-[#2a2a2a] dark:text-[#f8fafc] dark:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)]"
      )}
      style={{
        backgroundImage: isDark
          ? isLong
            ? "radial-gradient(120% 80% at 0% 0%, rgba(52,211,153,0.18), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(96,165,250,0.12), transparent 50%)"
            : "radial-gradient(120% 80% at 0% 0%, rgba(251,113,133,0.18), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(96,165,250,0.1), transparent 50%)"
          : isLong
            ? "radial-gradient(120% 80% at 0% 0%, rgba(16,185,129,0.16), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(37,99,235,0.1), transparent 50%)"
            : "radial-gradient(120% 80% at 0% 0%, rgba(244,63,94,0.14), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(37,99,235,0.08), transparent 50%)",
      }}
    >
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em]">
              {ticket.symbol}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
                isLong
                  ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/18 dark:text-emerald-300"
                  : "bg-rose-500/15 text-rose-700 dark:bg-rose-400/18 dark:text-rose-300"
              )}
            >
              <SideIcon className="size-3 shrink-0" aria-hidden />
              {isLong ? t("signalSideLong") : t("signalSideShort")}
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-medium tracking-[0.03em] text-black/45 uppercase dark:text-white/45">
            {t("signalCardTitle")}
          </span>
        </div>
        {setup ? (
          <p className="mt-2.5 text-[13px] leading-relaxed text-black/55 dark:text-white/55">
            {setup}
          </p>
        ) : null}
      </header>

      <div className="space-y-3 px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {priceItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                tileClass,
                "text-center",
                // Emphasis = larger type only. No ring/shadow — both painted a
                // dark/blue smudge in the gap between the three price tiles.
                item.emphasis && "relative z-[1]"
              )}
            >
              <p className={mutedLabelClass}>{item.label}</p>
              <p
                className={cn(
                  "mt-1.5 font-semibold tracking-tight tabular-nums text-[#0f172a] dark:text-[#f8fafc]",
                  item.emphasis ? "text-[1.1rem]" : "text-[15px]"
                )}
              >
                {item.value}
              </p>
              {item.reason ? (
                <p className="mt-2 text-[10px] leading-snug text-black/50 dark:text-white/50">
                  {item.reason}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {metaItems.length > 0 ? (
          <div className={cn("grid grid-cols-2 gap-x-3 gap-y-2.5", panelClass)}>
            {metaItems.map((item) => (
              <div key={item.label} className="min-w-0">
                <p className={mutedMetaLabelClass}>{item.label}</p>
                <p className="mt-1 text-[13px] font-medium tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {thesis ? (
          <div className={panelClass}>
            <p className="text-[10px] font-medium tracking-[0.08em] text-black/45 uppercase dark:text-white/45">
              {t("signalCardThesisHeading")}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-black/75 dark:text-white/75">
              {thesis}
            </p>
          </div>
        ) : null}

        <p className="text-center text-[9px] tracking-[0.06em] text-black/40 uppercase dark:text-white/40">
          {t("signalCardDisclaimer")}
        </p>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-black/6 bg-white px-4 py-3 dark:border-white/8 dark:bg-white/[0.08]">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- capture-safe raster logo */}
          <img
            src={logoSrc}
            alt=""
            width={28}
            height={28}
            decoding="sync"
            className="size-7 shrink-0 rounded-full"
          />
          <span className="text-[13px] font-semibold tracking-tight">Exur</span>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[11px] font-medium tracking-tight text-black/50 dark:text-white/50">
            {shareDate}
          </p>
          <p className="text-[12px] font-medium tracking-tight text-black/45 dark:text-white/45">
            {SIGNAL_SHARE_SITE}
          </p>
        </div>
      </footer>
    </div>
  )
}

function ChatSignalShareDialog({
  open,
  onOpenChange,
  ticket,
}: ChatSignalShareDialogProps) {
  const t = useTranslations("workspace")
  const locale = useLocale()
  const isDesktop = useIsDesktop()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const captureRef = React.useRef<HTMLDivElement | null>(null)
  const copiedTimerRef = React.useRef(0)

  const shareDate = React.useMemo(
    () => formatSignalShareDate(locale),
    [locale]
  )

  const shareText = React.useMemo(
    () =>
      buildSignalShareText(
        ticket,
        {
          entry: t("signalCardEntry"),
          stopLoss: t("signalCardStopLoss"),
          target: t("signalShareTarget"),
        },
        { date: shareDate }
      ),
    [shareDate, t, ticket]
  )

  const shareTitle = `${ticket.symbol} ${ticket.side} · Exur`

  React.useEffect(() => {
    return () => window.clearTimeout(copiedTimerRef.current)
  }, [])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setBusy(false)
      setCopied(false)
    } else {
      toast.dismiss()
    }
    onOpenChange(next)
  }

  function flashCopied() {
    toast.dismiss()
    setCopied(true)
    window.clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1_600)
  }

  async function onCopyText() {
    if (busy) return
    setBusy(true)
    try {
      await navigator.clipboard.writeText(shareText)
      flashCopied()
    } catch {
      toast.error(t("signalShareCopyFailed"))
    } finally {
      setBusy(false)
    }
  }

  async function onShareImage() {
    if (busy) return
    setBusy(true)
    try {
      const node = captureRef.current
      if (!node) throw new Error("preview-missing")
      const blob = await captureShareNodeToBlob(node, signalShareCardBg(isDark))
      try {
        const result = await shareImageWithCaption({
          blob,
          fileName: signalShareFileName(ticket),
          title: shareTitle,
          text: shareText,
        })
        if (result.kind !== "shared") {
          flashCopied()
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        throw error
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error(t("signalShareShareFailed"))
    } finally {
      setBusy(false)
    }
  }

  const shareHeading = t("share")

  if (isDesktop === null) return null

  const preview = (
    <SharePreviewCard
      ticket={ticket}
      shareDate={shareDate}
      captureRef={captureRef}
      isDark={isDark}
    />
  )

  const actions = (
    <ActionRow
      busy={busy}
      copied={copied}
      onCopyText={onCopyText}
      onShareImage={onShareImage}
      copyLabel={t("signalShareCopyText")}
      shareLabel={t("signalShareShareImage")}
      copiedLabel={t("signalShareCopied")}
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "flex h-auto max-h-none w-full flex-col gap-0 overflow-visible sm:max-w-[26rem]"
          )}
          showCloseButton
          gsapMotion
          open={open}
        >
          <DialogHeader className="shrink-0 gap-0 space-y-0 px-5 pt-5 pb-3 text-start">
            <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
              {shareHeading}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {shareHeading}
            </DialogDescription>
          </DialogHeader>
          <div className="px-5">{preview}</div>
          <div className="bg-transparent px-5 pt-3 pb-5">{actions}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(
          chatMobileSheetContentClass,
          "flex flex-col gap-0 overflow-hidden border-0"
        )}
      >
        <div
          aria-hidden
          className={cn(chatMobileSheetHandleClass, "shrink-0")}
        />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 gap-0")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {shareHeading}
          </SheetTitle>
          <SheetDescription className="sr-only">{shareHeading}</SheetDescription>
        </SheetHeader>
        <div
          className={cn(
            chatMobileSheetBodyClass,
            "min-h-0 flex-1 overflow-y-auto pt-1"
          )}
        >
          {preview}
        </div>
        <SheetFooter className={cn(chatMobileSheetFooterClass, "shrink-0")}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>
            {actions}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ChatSignalShareDialog }
