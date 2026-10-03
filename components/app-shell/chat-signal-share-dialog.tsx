"use client"

import * as React from "react"
import {
  CopyIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { toBlob } from "html-to-image"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  chatDesktopDialogClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ExurLogo } from "@/components/brand/exur-logo"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  buildSignalShareText,
  SIGNAL_SHARE_SITE,
  signalShareFileName,
} from "@/lib/chat/signal-share"
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
  captureRef,
}: {
  ticket: PaperTradeTicket
  captureRef: React.RefObject<HTMLDivElement | null>
}) {
  const t = useTranslations("workspace")
  const isLong = ticket.side === "LONG"
  const SideIcon = isLong ? TrendingUpIcon : TrendingDownIcon

  return (
    <div
      ref={captureRef}
      className={cn(
        "relative isolate mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.35rem] bg-[#f7f8fa] text-[#0f172a]",
        "shadow-[0_12px_40px_-18px_rgba(15,23,42,0.28)]",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:content-['']",
        isLong
          ? "before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.1),transparent_50%)]"
          : "before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(244,63,94,0.14),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%)]"
      )}
      // Keep capture colors stable regardless of app theme.
      style={{ colorScheme: "light" }}
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
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-rose-500/15 text-rose-700"
              )}
            >
              <SideIcon className="size-3 shrink-0" aria-hidden />
              {isLong ? t("signalSideLong") : t("signalSideShort")}
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-medium tracking-[0.03em] text-black/45 uppercase">
            {t("signalCardTitle")}
          </span>
        </div>
        {ticket.setup.trim() ? (
          <p className="mt-2.5 text-[13px] leading-relaxed text-black/55">
            {ticket.setup.trim()}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {[
          {
            label: t("signalCardStopLoss"),
            value: formatTradePrice(ticket.stopLoss),
          },
          {
            label: t("signalCardEntry"),
            value: formatTradePrice(ticket.markPrice),
            emphasis: true,
          },
          {
            label: t("signalShareTarget"),
            value: formatTradePrice(ticket.takeProfit),
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-2xl bg-white/90 px-2.5 py-3 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]",
              item.emphasis && "ring-1 ring-sky-500/20"
            )}
          >
            <p className="text-[10px] font-medium tracking-[0.07em] text-black/45 uppercase">
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1.5 font-semibold tracking-tight tabular-nums",
                item.emphasis ? "text-[1.1rem]" : "text-[15px]"
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-black/6 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <ExurLogo decorative variant="brand" className="size-7" size={28} />
          <span className="text-[13px] font-semibold tracking-tight">Exur</span>
        </div>
        <span className="text-[12px] font-medium tracking-tight text-black/45">
          {SIGNAL_SHARE_SITE}
        </span>
      </footer>
    </div>
  )
}

async function copyImageBlob(blob: Blob) {
  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard?.write
  ) {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || "image/png"]: blob }),
    ])
    return
  }
  throw new Error("image-clipboard-unsupported")
}

async function shareImageBlob(input: {
  blob: Blob
  ticket: PaperTradeTicket
  title: string
  text: string
}) {
  const file = new File([input.blob], signalShareFileName(input.ticket), {
    type: input.blob.type || "image/png",
  })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: input.title,
      text: input.text,
    })
    return
  }
  if (typeof navigator.share === "function") {
    await navigator.share({ title: input.title, text: input.text })
    return
  }
  throw new Error("share-unsupported")
}

function ChatSignalShareDialog({
  open,
  onOpenChange,
  ticket,
}: ChatSignalShareDialogProps) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const captureRef = React.useRef<HTMLDivElement | null>(null)
  const copiedTimerRef = React.useRef(0)

  const shareText = React.useMemo(
    () =>
      buildSignalShareText(ticket, {
        entry: t("signalCardEntry"),
        stopLoss: t("signalCardStopLoss"),
        target: t("signalShareTarget"),
      }),
    [t, ticket]
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

  async function capturePreviewBlob() {
    const node = captureRef.current
    if (!node) throw new Error("preview-missing")
    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#f7f8fa",
    })
    if (!blob) throw new Error("preview-empty")
    return blob
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
      const blob = await capturePreviewBlob()
      try {
        await shareImageBlob({
          blob,
          ticket,
          title: shareTitle,
          text: shareText,
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        await copyImageBlob(blob)
        flashCopied()
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error(t("signalShareShareFailed"))
    } finally {
      setBusy(false)
    }
  }

  if (isDesktop === null) return null

  const shareHeading = t("share")

  const header = isDesktop ? (
    <DialogHeader className="shrink-0 gap-0 space-y-0 px-5 pt-5 pb-3 text-start">
      <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
        {shareHeading}
      </DialogTitle>
      <DialogDescription className="sr-only">{shareHeading}</DialogDescription>
    </DialogHeader>
  ) : (
    <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 gap-0")}>
      <SheetTitle className={chatMobileSheetTitleClass}>{shareHeading}</SheetTitle>
      <SheetDescription className="sr-only">{shareHeading}</SheetDescription>
    </SheetHeader>
  )

  const actionRow = (
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

  const preview = (
    <div className="rounded-[1.5rem] bg-foreground/[0.03] p-3 dark:bg-white/[0.04]">
      <SharePreviewCard ticket={ticket} captureRef={captureRef} />
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "flex max-h-[min(85dvh,720px)] flex-col gap-0 overflow-hidden sm:max-w-[26rem]"
          )}
          showCloseButton
          gsapMotion
          open={open}
        >
          {header}
          <div className="min-h-0 flex-1 overflow-y-auto px-5">{preview}</div>
          <div className="shrink-0 bg-transparent px-5 pt-3 pb-5">{actionRow}</div>
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
        <div aria-hidden className={chatMobileSheetHandleClass} />
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{preview}</div>
        <div
          className={cn(
            chatMobileSheetFooterBarClass,
            "shrink-0 !bg-transparent shadow-none backdrop-blur-none"
          )}
        >
          {actionRow}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { ChatSignalShareDialog }
